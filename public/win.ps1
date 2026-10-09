#Requires -Version 5.1
<#
.SYNOPSIS
    Scans an osu! install (stable or lazer) and sends every beatmap's title/artist to osu-find-songs.

.DESCRIPTION
    Asks which osu! version you use, then reads the Title / TitleUnicode / Artist / ArtistUnicode
    metadata of every beatmap and POSTs the result to the local API, which matches the maps against
    the chosen Spotify playlist.

    osu!stable keeps one folder per beatmap set under `Songs`, so the first `.osu` file of each
    folder is used. osu!(lazer) has no `Songs` folder: every imported file is stored under its
    SHA-256 hash inside `%APPDATA%\osu\files`, so the raw `.osu` files are located by content and
    then deduplicated by metadata. Both modes produce the same payload.

    Nothing is written to disk: the script is meant to be piped straight into PowerShell with
    `irm` (see the website for the exact command).

.PARAMETER PlaylistId
    Spotify playlist id the maps should be matched against.

.PARAMETER ClientId
    Client id used to authenticate the request (sent as the `x-client-id` header).

.PARAMETER ApiBase
    Base url of the local API, e.g. http://localhost:3000.

.PARAMETER AppBase
    Base url of the web app. Used only to print the "come back" link at the end.

.EXAMPLE
    & ([scriptblock]::Create((irm 'http://localhost:3000/win.ps1'))) `
        -PlaylistId '37i9dQZF1DXcBWIGoYBM5M' -ClientId 'abc123' `
        -ApiBase 'http://localhost:3000' -AppBase 'http://localhost:3000'
#>
[CmdletBinding()]
param(
    [string]$PlaylistId,

    [string]$ClientId,

    [string]$ApiBase,

    [string]$AppBase,

    # Test-only: skip running the main routine (used when dot-sourcing the script in tests).
    [switch]$NoRun
)

$ErrorActionPreference = 'Stop'

# osu!-related endpoints need TLS 1.2 on Windows PowerShell 5.1
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$barWidth = 24
$padWidth = 70
$carriageReturn = [char]13

$stableDefaultSongs = Join-Path $env:LOCALAPPDATA 'osu!\Songs'

function Write-ProgressLine {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [string]$Color = 'Yellow'
    )
    Write-Host -NoNewline ($carriageReturn + $Text.PadRight($padWidth)) -ForegroundColor $Color
}

function Clear-ProgressLine {
    Write-Host -NoNewline ($carriageReturn + (' ' * $padWidth) + $carriageReturn)
}

# Reads Title / TitleUnicode / Artist / ArtistUnicode from a single .osu file.
# Stops as soon as the [Metadata] section ends, so huge hit-object lists are never read.
function Get-OsuMetadataFromFile {
    param([Parameter(Mandatory = $true)][string]$Path)

    $meta = @{}
    $inMetadata = $false

    foreach ($line in [System.IO.File]::ReadLines($Path)) {
        if ($line.Length -gt 0 -and $line[0] -eq '[') {
            if ($inMetadata) { break }
            if ($line.StartsWith('[Metadata]')) { $inMetadata = $true }
            continue
        }

        if ($inMetadata -and $line -match '^(Title|TitleUnicode|Artist|ArtistUnicode):(.*)$') {
            $value = $Matches[2].Trim()
            if ($value) { $meta[$Matches[1]] = $value }
        }
    }

    [pscustomobject]@{
        Title         = $meta['Title']
        TitleUnicode  = $meta['TitleUnicode']
        Artist        = $meta['Artist']
        ArtistUnicode = $meta['ArtistUnicode']
    }
}

# osu!(lazer) lets the user move the whole file store; the chosen path is kept in storage.ini
# inside the default folder (a plain `FullPath = <path>` line). Prefer it when present.
function Get-LazerRoot {
    param([Parameter(Mandatory = $true)][string]$DefaultRoot)

    $storageIni = Join-Path $DefaultRoot 'storage.ini'
    if (Test-Path -LiteralPath $storageIni) {
        # ReadAllLines (not the lazy ReadLines) so the handle is always released, even on early return.
        foreach ($line in [System.IO.File]::ReadAllLines($storageIni)) {
            if ($line -match '^\s*FullPath\s*=\s*(.+?)\s*$') {
                $custom = $Matches[1].Trim().Trim('"')
                if ($custom -and (Test-Path -LiteralPath $custom)) { return $custom }
                break
            }
        }
    }

    return $DefaultRoot
}

# --- osu!stable ------------------------------------------------------------
# One beatmap set per folder: use the first .osu file (sorted by name) of each folder.
function Get-StableMaps {
    param([Parameter(Mandatory = $true)][string]$Songs)

    $dirs = @(Get-ChildItem -LiteralPath $Songs -Directory)
    $total = $dirs.Count
    $index = 0
    $lastFilled = -1
    $maps = New-Object System.Collections.Generic.List[object]

    foreach ($dir in $dirs) {
        $index++
        if ($total -gt 0) {
            $filled = [int][math]::Round($index / $total * $barWidth)
            if ($filled -ne $lastFilled) {
                $lastFilled = $filled
                $bar = ('#' * $filled).PadRight($barWidth, '-')
                Write-ProgressLine -Text "[$bar] $index/$total Parsing maps..."
            }
        }

        $osu = Get-ChildItem -LiteralPath $dir.FullName -Filter *.osu -File -ErrorAction SilentlyContinue |
            Sort-Object Name |
            Select-Object -First 1

        if ($osu) {
            $maps.Add((Get-OsuMetadataFromFile -Path $osu.FullName))
        }
    }

    return $maps.ToArray()
}

# --- osu!(lazer) -----------------------------------------------------------
# Compiles the parallel scanner once per session.
function Initialize-LazerScanner {
    if ('OsuLazerScan' -as [type]) { return }

    $typeDefinition = @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;

public static class OsuLazerScan
{
    private static readonly byte[] Needle = Encoding.ASCII.GetBytes("osu file format");

    private static bool IsOsuFile(string path)
    {
        try
        {
            using (var fs = File.OpenRead(path))
            {
                var buf = new byte[Needle.Length + 3];
                int n = fs.Read(buf, 0, buf.Length);
                // skip a UTF-8 BOM if present
                int off = (n >= 3 && buf[0] == 0xEF && buf[1] == 0xBB && buf[2] == 0xBF) ? 3 : 0;
                if (n - off < Needle.Length) return false;
                for (int i = 0; i < Needle.Length; i++)
                {
                    if (buf[off + i] != Needle[i]) return false;
                }
                return true;
            }
        }
        catch { return false; }
    }

    public static string[] FindOsuFiles(string root)
    {
        var result = new System.Collections.Concurrent.ConcurrentBag<string>();

        Parallel.ForEach(
            Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories),
            path => { if (IsOsuFile(path)) result.Add(path); });

        var list = new List<string>(result);
        list.Sort(StringComparer.OrdinalIgnoreCase);
        return list.ToArray();
    }
}
'@

    Add-Type -TypeDefinition $typeDefinition -Language CSharp
}

# Returns the full paths of every .osu file inside the lazer file store.
function Get-LazerOsuFiles {
    param([Parameter(Mandatory = $true)][string]$Root)

    Initialize-LazerScanner
    return [OsuLazerScan]::FindOsuFiles($Root)
}

# Scans the store and returns one metadata object per beatmap (set by default).
function Get-LazerMaps {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [switch]$KeepDuplicates
    )

    $filesRoot = Join-Path $Root 'files'
    if (-not (Test-Path -LiteralPath $filesRoot)) {
        if ((Split-Path -Path $Root -Leaf) -eq 'files') {
            $filesRoot = $Root
        }
        else {
            throw "osu!(lazer) 'files' folder not found at: $filesRoot"
        }
    }

    $osuFiles = @(Get-LazerOsuFiles -Root $filesRoot)
    $total = $osuFiles.Count
    $index = 0
    $lastFilled = -1
    $seen = @{}
    $maps = New-Object System.Collections.Generic.List[object]

    foreach ($file in $osuFiles) {
        $index++
        if ($total -gt 0) {
            $filled = [int][math]::Round($index / $total * $barWidth)
            # repaint only when the bar actually changes, to keep the terminal (and the
            # console host) from being hammered on stores with thousands of files
            if ($filled -ne $lastFilled) {
                $lastFilled = $filled
                $bar = ('#' * $filled).PadRight($barWidth, '-')
                Write-ProgressLine -Text "[$bar] $index/$total Parsing maps..."
            }
        }

        $meta = Get-OsuMetadataFromFile -Path $file

        if (-not $KeepDuplicates) {
            $key = '{0}|{1}|{2}|{3}' -f $meta.Artist, $meta.Title, $meta.ArtistUnicode, $meta.TitleUnicode
            if ($seen.ContainsKey($key)) { continue }
            $seen[$key] = $true
        }

        $maps.Add($meta)
    }

    return $maps.ToArray()
}

# Asks for the osu! version to scan. Empty input picks the detected default.
function Read-OsuSource {
    $hasStable = Test-Path -LiteralPath $stableDefaultSongs
    $hasLazer = Test-Path -LiteralPath (Join-Path $lazerRoot 'client.realm')

    $default = 'stable'
    if ($hasLazer -and -not $hasStable) { $default = 'lazer' }
    $defaultLabel = if ($default -eq 'lazer') { 'L' } else { 'S' }

    while ($true) {
        Write-Host ''
        Write-Host -NoNewline 'Which osu! version? '
        Write-Host -NoNewline '[S]table / [L]azer' -ForegroundColor DarkGray
        Write-Host -NoNewline " (Enter = $defaultLabel): "
        $answer = (Read-Host).Trim().ToLowerInvariant()

        switch ($answer) {
            '' { return $default }
            's' { return 'stable' }
            'stable' { return 'stable' }
            '1' { return 'stable' }
            'l' { return 'lazer' }
            'lazer' { return 'lazer' }
            '2' { return 'lazer' }
            default { Write-Host 'Please type S for stable or L for lazer.' -ForegroundColor Yellow }
        }
    }
}

function Invoke-OsuFindSongs {
    if (-not $PlaylistId) { throw '-PlaylistId is required.' }
    if (-not $ClientId) { throw '-ClientId is required.' }
    if (-not $ApiBase) { throw '-ApiBase is required.' }
    if ($PSVersionTable.PSVersion.Major -ge 6 -and -not $IsWindows) {
        throw 'This script is for Windows. On macOS/Linux use unix.ps1.'
    }

    $source = Read-OsuSource

    if ($source -eq 'lazer') {
        Write-Host ''
        Write-Host "Scanning osu!(lazer) storage: $lazerRoot" -ForegroundColor DarkGray
        $maps = @(Get-LazerMaps -Root $lazerRoot)
    }
    else {
        Write-Host ''
        Write-Host -NoNewline 'Select osu folder '
        Write-Host -NoNewline "(Enter for default: $stableDefaultSongs)" -ForegroundColor DarkGray
        Write-Host -NoNewline ': '
        $songs = (Read-Host).Trim().Trim('"')
        if (-not $songs) { $songs = $stableDefaultSongs }
        if (-not (Test-Path -LiteralPath $songs)) {
            Write-Host "Folder not found: $songs - falling back to the current directory." -ForegroundColor DarkYellow
            $songs = $PWD.Path
        }
        $maps = @(Get-StableMaps -Songs $songs)
    }

    if ($maps.Count -eq 0) {
        Clear-ProgressLine
        Write-Host ''
        Write-Host 'No beatmaps found.' -ForegroundColor Yellow
        return
    }

    $bar = '#' * $barWidth
    Write-ProgressLine -Text "[$bar] $($maps.Count)/$($maps.Count) Sending maps to server..."

    $uri = ($ApiBase.TrimEnd('/') + '/spotify/playlist/' + $PlaylistId)
    $headers = @{ 'x-client-id' = $ClientId }
    $json = ConvertTo-Json -InputObject $maps -Depth 3
    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    try {
        $null = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers `
            -ContentType 'application/json; charset=utf-8' -Body $body -TimeoutSec 120

        Clear-ProgressLine
        Write-Host ''
        Write-Host "Done! $($maps.Count) maps parsed." -ForegroundColor Green
        if ($AppBase) {
            Write-Host "Return back to the app to see progress - $($AppBase.TrimEnd('/'))/from-osu" -ForegroundColor Green
        }
    }
    catch {
        Clear-ProgressLine
        Write-Host ''
        Write-Host "Failed to send maps: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$lazerRoot = Get-LazerRoot -DefaultRoot (Join-Path $env:APPDATA 'osu')

if (-not $NoRun) {
    Invoke-OsuFindSongs
}
