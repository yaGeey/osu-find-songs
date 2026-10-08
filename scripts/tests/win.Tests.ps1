#requires -Version 5.1
<#
    Tests for public/win.ps1 (osu!stable + osu!(lazer) modes)

    Run with any of:
        Invoke-Pester .\scripts\tests\win.Tests.ps1
        powershell -NoProfile -Command "Invoke-Pester .\scripts\tests\win.Tests.ps1"

    Written against Pester 3.4 (the version bundled with Windows PowerShell), so it uses the
    positional `Should Be` syntax rather than `Should -Be`.
#>

$scriptUnderTest = Join-Path $PSScriptRoot '..\..\public\win.ps1'
. $scriptUnderTest -NoRun

# --- fixtures --------------------------------------------------------------
$fixtureRoot = Join-Path $env:TEMP ('osu-find-songs-win-fixture-' + [guid]::NewGuid().ToString('N'))
if (Test-Path -LiteralPath $fixtureRoot) { Remove-Item -Recurse -Force -LiteralPath $fixtureRoot }

$filesRoot = Join-Path $fixtureRoot 'files'
foreach ($sub in @('a\ab', 'c\cd', 'e\ef')) {
    New-Item -ItemType Directory -Path (Join-Path $filesRoot $sub) -Force | Out-Null
}

# roots for the storage.ini auto-detection tests
$lazerDefault = Join-Path $fixtureRoot 'lazerDefault'
$lazerMoved = Join-Path $fixtureRoot 'lazerMoved'
foreach ($dir in @($lazerDefault, $lazerMoved)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

function New-TextFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Text,
        [bool]$Bom = $false
    )
    $encoding = New-Object System.Text.UTF8Encoding($Bom)
    [System.IO.File]::WriteAllText($Path, $Text, $encoding)
}

# same set, two difficulties -> should collapse to one map
$blueZenith = @'
osu file format v14

[General]
AudioFilename: audio.mp3

[Metadata]
Title:Blue Zenith
TitleUnicode:ブルーゼニス
Artist:xi
ArtistUnicode:xi

[Difficulty]
Title:Not The Real Title
Version:Insane
'@

$blueZenithSecondDiff = @'
osu file format v14

[Metadata]
Title:Blue Zenith
TitleUnicode:ブルーゼニス
Artist:xi
ArtistUnicode:xi

[Difficulty]
Version:Another
'@

# no TitleUnicode / ArtistUnicode -> those fields must come back empty
$freedomDive = @'
osu file format v14

[Metadata]
Title:Freedom Dive
Artist:xi
'@

$noBomPath = Join-Path $filesRoot 'a\ab\hashNoBom'
$bomPath = Join-Path $filesRoot 'c\cd\hashBom'
$freedomPath = Join-Path $filesRoot 'e\ef\hashFreedom'

New-TextFile -Path $noBomPath -Text $blueZenith -Bom $false
New-TextFile -Path $bomPath -Text $blueZenithSecondDiff -Bom $true
New-TextFile -Path $freedomPath -Text $freedomDive -Bom $false

# a non-beatmap binary asset that must be ignored by the scanner
[System.IO.File]::WriteAllBytes((Join-Path $filesRoot 'e\ef\binaryAsset'), [byte[]](0..255))

# osu!stable: one folder per beatmap set, first .osu (sorted) wins
$stableRoot = Join-Path $fixtureRoot 'Songs'
$setA = Join-Path $stableRoot 'Artist A - Song One'
$setB = Join-Path $stableRoot 'Artist B - Song Two'
$emptySet = Join-Path $stableRoot 'No maps here'
foreach ($dir in @($setA, $setB, $emptySet)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
New-TextFile -Path (Join-Path $setA 'a.osu') -Text $blueZenith -Bom $false
New-TextFile -Path (Join-Path $setA 'z.osu') -Text $freedomDive -Bom $false
New-TextFile -Path (Join-Path $setB 'map.osu') -Text $freedomDive -Bom $false
New-TextFile -Path (Join-Path $emptySet 'readme.txt') -Text 'not a beatmap' -Bom $false

# --- tests -----------------------------------------------------------------
Describe 'Get-OsuMetadataFromFile' {
    It 'reads all four metadata fields' {
        $meta = Get-OsuMetadataFromFile -Path $noBomPath
        $meta.Title | Should Be 'Blue Zenith'
        $meta.TitleUnicode | Should Be 'ブルーゼニス'
        $meta.Artist | Should Be 'xi'
        $meta.ArtistUnicode | Should Be 'xi'
    }

    It 'reads a beatmap that starts with a UTF-8 BOM' {
        $meta = Get-OsuMetadataFromFile -Path $bomPath
        $meta.Title | Should Be 'Blue Zenith'
        $meta.Artist | Should Be 'xi'
    }

    It 'returns empty values for absent keys' {
        $meta = Get-OsuMetadataFromFile -Path $freedomPath
        $meta.Title | Should Be 'Freedom Dive'
        $meta.Artist | Should Be 'xi'
        $meta.TitleUnicode | Should BeNullOrEmpty
        $meta.ArtistUnicode | Should BeNullOrEmpty
    }

    It 'does not read keys from sections after [Metadata]' {
        $meta = Get-OsuMetadataFromFile -Path $noBomPath
        $meta.Title | Should Be 'Blue Zenith'
    }
}

Describe 'Get-LazerOsuFiles' {
    It 'finds only .osu files and ignores binary assets' {
        $found = @(Get-LazerOsuFiles -Root $filesRoot)
        $found.Count | Should Be 3
    }

    It 'finds beatmaps stored with and without a BOM' {
        $found = @(Get-LazerOsuFiles -Root $filesRoot)
        ($found -contains $noBomPath) | Should Be $true
        ($found -contains $bomPath) | Should Be $true
    }
}

Describe 'Get-LazerMaps' {
    It 'deduplicates difficulties of the same beatmap set' {
        $maps = @(Get-LazerMaps -Root $fixtureRoot)
        $maps.Count | Should Be 2
        @($maps | Where-Object { $_.Title -eq 'Blue Zenith' }).Count | Should Be 1
    }

    It 'keeps every difficulty when -KeepDuplicates is set' {
        $maps = @(Get-LazerMaps -Root $fixtureRoot -KeepDuplicates)
        $maps.Count | Should Be 3
    }

    It 'throws a helpful error when the files folder is missing' {
        $threw = $false
        try {
            Get-LazerMaps -Root (Join-Path $env:TEMP 'osu-find-songs-missing-lazer-root') | Out-Null
        }
        catch { $threw = $true }
        $threw | Should Be $true
    }
}

Describe 'Get-StableMaps' {
    It 'reads one map per set folder, using the first .osu file' {
        $maps = @(Get-StableMaps -Songs $stableRoot)
        $maps.Count | Should Be 2
        @($maps | Where-Object { $_.Title -eq 'Blue Zenith' }).Count | Should Be 1
        @($maps | Where-Object { $_.Title -eq 'Freedom Dive' }).Count | Should Be 1
    }

    It 'ignores folders that contain no .osu file' {
        $onlyEmpty = Join-Path $fixtureRoot 'EmptySongs'
        New-Item -ItemType Directory -Path (Join-Path $onlyEmpty 'nothing') -Force | Out-Null
        @(Get-StableMaps -Songs $onlyEmpty).Count | Should Be 0
    }
}

Describe 'Get-LazerRoot' {
    It 'falls back to the default root when storage.ini is absent' {
        Remove-Item -Force -LiteralPath (Join-Path $lazerDefault 'storage.ini') -ErrorAction SilentlyContinue
        Get-LazerRoot -DefaultRoot $lazerDefault | Should Be $lazerDefault
    }

    It 'uses the FullPath recorded in storage.ini' {
        [System.IO.File]::WriteAllText((Join-Path $lazerDefault 'storage.ini'), "FullPath = $lazerMoved`n")
        Get-LazerRoot -DefaultRoot $lazerDefault | Should Be $lazerMoved
    }

    It 'ignores a FullPath that does not exist' {
        $missing = Join-Path $lazerDefault 'does-not-exist'
        [System.IO.File]::WriteAllText((Join-Path $lazerDefault 'storage.ini'), "FullPath = $missing`n")
        Get-LazerRoot -DefaultRoot $lazerDefault | Should Be $lazerDefault
    }

    It 'ignores an empty FullPath' {
        [System.IO.File]::WriteAllText((Join-Path $lazerDefault 'storage.ini'), "FullPath = `n")
        Get-LazerRoot -DefaultRoot $lazerDefault | Should Be $lazerDefault
    }
}

Describe 'Invoke-OsuFindSongs' {
    It 'requires a playlist id' {
        $threw = $false
        try { Invoke-OsuFindSongs } catch { $threw = $true }
        $threw | Should Be $true
    }
}

Remove-Item -Recurse -Force -LiteralPath $fixtureRoot -ErrorAction SilentlyContinue
