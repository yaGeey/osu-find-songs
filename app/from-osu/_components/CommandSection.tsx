import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { ClipboardCheck, Copy, Info, MonitorOff, Terminal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import AlertBanner from './AlertBanner'

const OS_LIST = ['Windows', 'Mac OS', 'Linux'] as const
type OS = (typeof OS_LIST)[number]
const SHELL_BY_OS: Record<OS, string> = {
   Windows: 'PowerShell',
   'Mac OS': 'Terminal',
   Linux: 'Terminal',
}

const COMMAND_EXPLANATION =
   'Scans your osu!stable beatmaps folder, reads the title and artist of every map, sends them to this site, and adds the Spotify matches to your playlist.'

function Kbd({ children }: { children: React.ReactNode }) {
   return (
      <kbd className="rounded-sm border border-main-border/50 bg-main-lightest px-1 font-inter-tight text-[11px] font-semibold text-main-gray">
         {children}
      </kbd>
   )
}

export default function CommandSection({
   playlistId,
   clientId,
   detectedOSOverride,
}: {
   playlistId: string
   clientId: string
   /** Preview/testing only: override OS detection. `null` simulates an unsupported OS. */
   detectedOSOverride?: OS | null
}) {
   // get users operating system
   const detectedOS = useMemo<OS | null>(() => {
      if (detectedOSOverride !== undefined) return detectedOSOverride
      if (typeof window === 'undefined') return null
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      if (/Macintosh/i.test(userAgent)) {
         return 'Mac OS'
      } else if (/Windows/i.test(userAgent)) {
         return 'Windows'
      } else if (/Linux/i.test(userAgent)) {
         return 'Linux'
      } else {
         return null
      }
   }, [detectedOSOverride])

   // default to Windows until mounted (keeps SSR output stable), then use the detected os;
   // the user can still switch manually
   const [mounted, setMounted] = useState(false)
   useEffect(() => setMounted(true), [])

   const [manualOS, setManualOS] = useState<OS | null>(null)
   const selectedOS: OS | null = manualOS ?? (mounted ? detectedOS : 'Windows')
   // OS detection failed — the alert banner stays visible even after a manual pick
   const osUnsupported = mounted && detectedOS === null
   const noOSSelected = selectedOS === null

   const command = useMemo(() => {
      if (!playlistId || !clientId || !selectedOS) return null
      return commands[selectedOS](playlistId, clientId)
   }, [selectedOS, playlistId, clientId])

   const [copied, setCopied] = useState(false)
   const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

   const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!command) return
      navigator.clipboard.writeText(command)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1300)

      // burst of confetti from the button position
      const rect = event.currentTarget.getBoundingClientRect()
      confetti({
         particleCount: 10,
         spread: 60,
         startVelocity: 10,
         gravity: 1,
         scalar: 0.7,
         ticks: 30,
         colors: ['#ff66aa', '#8ab4f8', '#ffffff'],
         origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
         },
         disableForReducedMotion: true,
      })
   }

   return (
      <div className="grid w-full gap-3">
         <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-main-gray">
               <Terminal size={18} className="shrink-0 opacity-70" />
               Paste this command to get started
            </h2>
            <p className="mt-1 text-sm text-main-gray/80">
               Scans your osu!stable beatmaps folder and sends every map&apos;s title and artist here.
            </p>
         </div>
         {osUnsupported && (
            <AlertBanner title="Unsupported operating system">
               We couldn&apos;t detect your OS automatically.
            </AlertBanner>
         )}
         <div className="w-full overflow-hidden rounded-lg border-2 border-main-dark-vivid bg-main-light">
            <div className="flex items-center justify-between border-b-2 border-main-dark-vivid pr-3">
               <div className="flex pl-1.5">
                  {OS_LIST.map((item) => (
                     <button
                        key={item}
                        className={tw(
                           'relative cursor-pointer px-2.5 py-2 text-sm font-semibold transition-colors',
                           selectedOS === item ? 'text-black' : 'text-main-gray/70 hover:text-main-gray',
                        )}
                        onClick={() => setManualOS(item)}
                     >
                        {item}
                        {selectedOS === item && (
                           <motion.span
                              layoutId="os-tab-underline"
                              className="absolute inset-x-1.5 -bottom-0.5 h-0.5 rounded-full bg-main-gray"
                              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                              initial={false}
                              aria-hidden
                           />
                        )}
                     </button>
                  ))}
               </div>
               {selectedOS && (
                  <span className="font-inter-tight font-medium text-xs text-main-gray/70">
                     {SHELL_BY_OS[selectedOS]}
                  </span>
               )}
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5">
               {noOSSelected ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-main-gray/70">
                     <MonitorOff size={16} className="shrink-0 opacity-70" />
                     <p>Pick your platform above to get the command.</p>
                  </div>
               ) : command ? (
                  <>
                     <p
                        className="min-w-0 flex-1 overflow-hidden font-mono text-sm text-nowrap text-main-gray mask-r-from-90%"
                        title={command}
                     >
                        {command}
                     </p>
                     <button
                        className="shrink-0 cursor-pointer text-main-gray/70 transition-colors hover:text-black"
                        title={copied ? 'Copied!' : 'Copy command'}
                        onClick={handleCopy}
                     >
                        <motion.span
                           key={copied ? 'check' : 'copy'}
                           initial={{ scale: 0.5, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           transition={{ type: 'spring', stiffness: 600, damping: 28 }}
                           className="grid place-items-center"
                        >
                           {copied ? <ClipboardCheck size={16} className="text-black" /> : <Copy size={16} />}
                        </motion.span>
                     </button>
                  </>
               ) : (
                  <p className="text-sm text-main-gray/60">Not implemented for now</p>
               )}
            </div>
         </div>
         {selectedOS === 'Windows' && (
            <div className="rounded-lg border-2 border-main-dark-vivid/40 bg-main-light/60 px-3 py-2.5">
               <p className="mb-1.5 text-sm font-semibold text-main-gray">First time using a terminal?</p>
               <ol className="list-decimal space-y-1 pl-4 text-xs text-main-gray/80">
                  <li>
                     Press <Kbd>Win</Kbd>, type <span className="font-semibold text-main-gray">PowerShell</span> and
                     open it.
                  </li>
                  <li>
                     Paste the command with <Kbd>Ctrl</Kbd> + <Kbd>V</Kbd> and press <Kbd>Enter</Kbd>.
                  </li>
                  <li>
                     When it asks for the folder, press <Kbd>Enter</Kbd> to use the default osu! Songs folder.
                  </li>
               </ol>
            </div>
         )}
         <p title={COMMAND_EXPLANATION} className="flex items-start gap-1.5 text-xs text-main-gray/80">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>Run the command, then come back to this page to watch the progress.</span>
         </p>
      </div>
   )
}

// STABLE
// Win: C:\Users\<Username>\AppData\Local\osu!\Songs
// Mac: /Applications/osu!.app/Contents/Resources/drive_c/osu!/Songs

// LAZER

const commands: Record<OS, (plId: string, clientId: string) => string | null> = {
   Windows: (plId, clientId) =>
      `$url = '${process.env.NEXT_PUBLIC_LOCAL_API_URL}/spotify/playlist/${plId}'; $headers = @{ 'x-client-id' = '${clientId}' }; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $defaultSongs = "$env:LOCALAPPDATA\\osu!\\Songs"; $cr = [char]13; $barW = 24; $pad = 70; Write-Host ''; Write-Host -NoNewline "Select osu folder "; Write-Host -NoNewline "(Enter for default: $defaultSongs)" -ForegroundColor DarkGray; Write-Host -NoNewline ": "; $songs = (Read-Host).Trim().Trim('"'); if (-not $songs) { $songs = $defaultSongs }; if (-not (Test-Path -LiteralPath $songs)) { $songs = $PWD.Path }; $dirs = @(Get-ChildItem -LiteralPath $songs -Directory); $total = $dirs.Count; $i = 0; $data = foreach ($dir in $dirs) { $i++; $filled = [int][math]::Round($i / $total * $barW); $bar = ('#' * $filled).PadRight($barW, '-'); Write-Host -NoNewline ($cr + ("[$bar] $($i)/$($total) Parsing maps...").PadRight($pad)) -ForegroundColor Yellow; $osu = Get-ChildItem -LiteralPath $dir.FullName -Filter *.osu -File -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -First 1; if ($osu) { $meta = @{}; $section = ''; foreach ($line in [System.IO.File]::ReadLines($osu.FullName)) { if ($line -match '^\\[(.+)\\]') { $section = $Matches[1] } elseif ($section -eq 'Metadata' -and $line -match '^(Title|TitleUnicode|Artist|ArtistUnicode):(.*)$') { $v = $Matches[2].Trim(); if ($v) { $meta[$Matches[1]] = $v } } }; [pscustomobject]@{ Title = $meta['Title']; TitleUnicode = $meta['TitleUnicode']; Artist = $meta['Artist']; ArtistUnicode = $meta['ArtistUnicode'] } } }; $bar = '#' * $barW; Write-Host -NoNewline ($cr + ("[$bar] $total/$total Sending maps to server...").PadRight($pad)) -ForegroundColor Yellow; $json = ConvertTo-Json -InputObject @($data) -Depth 3; $body = [System.Text.Encoding]::UTF8.GetBytes($json); try { $null = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $body -TimeoutSec 120; Write-Host -NoNewline ($cr + (' ' * $pad) + $cr); Write-Host ''; Write-Host "Done! $(@($data).Count) maps parsed." -ForegroundColor Green; Write-Host "Return back to the app to see progress - ${process.env.NEXT_PUBLIC_APP_URL}/from-osu" -ForegroundColor Green } catch { Write-Host -NoNewline ($cr + (' ' * $pad) + $cr); Write-Host ''; Write-Host "Failed to send maps: $($_.Exception.Message)" -ForegroundColor Red }`,
   'Mac OS': () => null,
   Linux: () => null,
}
