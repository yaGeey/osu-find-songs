import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { ClipboardCheck, Copy, MonitorOff, ShieldCheck, SquareArrowOutUpRight, Terminal } from 'lucide-react'
import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import AlertBanner from './AlertBanner'

const OS_LIST = ['Windows', 'MacOS', 'Linux'] as const
type OS = (typeof OS_LIST)[number]

function getOSSnapshot(): OS | null {
   const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
   if (/Macintosh/i.test(userAgent)) return 'MacOS'
   if (/Windows/i.test(userAgent)) return 'Windows'
   if (/Linux/i.test(userAgent)) return 'Linux'
   return null
}

function Kbd({ children }: { children: React.ReactNode }) {
   return (
      <kbd className="rounded-sm border border-main-border/50 bg-main-lightest px-1 3xl:px-1.5 4xl:px-2 py-px font-inter-tight text-[11px] 3xl:text-xs 4xl:text-sm font-semibold text-main-gray">
         {children}
      </kbd>
   )
}

export default function CommandSection({
   clientId,
   detectedOSOverride,
}: {
   clientId: string
   /** Preview/testing only: override OS detection. `null` simulates an unsupported OS. */
   detectedOSOverride?: OS | null
}) {
   // get users operating system
   const detectedOS = useSyncExternalStore(
      () => () => {},
      getOSSnapshot,
      (): OS => 'Windows',
   )
   const os: OS | null = detectedOSOverride !== undefined ? detectedOSOverride : detectedOS

   const [manualOS, setManualOS] = useState<OS | null>(null)
   const selectedOS: OS | null = manualOS ?? os
   const osUnsupported = os === null
   const noOSSelected = selectedOS === null

   const command = useMemo(() => {
      if (!clientId || !selectedOS) return null
      return osInstructions[selectedOS].command(clientId)
   }, [selectedOS, clientId])

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
      <div className="grid w-full gap-3 3xl:gap-5 4xl:gap-6">
         <div className="min-w-0">
            <h2 className="flex items-center gap-2 3xl:gap-3 text-lg 3xl:text-2xl 4xl:text-3xl font-semibold tracking-tight text-main-gray">
               <Terminal size={18} className="shrink-0 opacity-70 size-[18px] 3xl:size-6 4xl:size-7" />
               Paste this command to get started
            </h2>
            <p className="mt-1 3xl:mt-2 text-sm 3xl:text-base 4xl:text-lg text-main-gray/80 leading-relaxed">
               Scans your osu! (lazer or stable) beatmaps and sends their song info here. Run the command to get
               started.
            </p>
         </div>
         {osUnsupported && (
            <AlertBanner title="Unsupported operating system">
               We couldn&apos;t detect your OS automatically.
            </AlertBanner>
         )}
         <div className="w-full overflow-hidden rounded-lg 3xl:rounded-xl border-2 border-main-dark-vivid bg-main-light">
            <div className="flex items-center justify-between border-b-2 border-main-dark-vivid pr-3 3xl:pr-5 4xl:pr-6">
               <div className="flex pl-1.5 3xl:pl-3 4xl:pl-4">
                  {OS_LIST.map((item) => (
                     <button
                        key={item}
                        className={tw(
                           'relative cursor-pointer px-2.5 3xl:px-4 4xl:px-5 py-2 3xl:py-2.5 4xl:py-3 text-sm 3xl:text-base 4xl:text-lg font-semibold transition-colors',
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
                  <span className="font-inter-tight font-medium text-xs 3xl:text-sm 4xl:text-base text-main-gray/70">
                     {osInstructions[selectedOS].shell}
                  </span>
               )}
            </div>

            <div className="flex items-center gap-2 3xl:gap-3 px-3 3xl:px-5 4xl:px-6 py-2.5 3xl:py-4 4xl:py-5">
               {noOSSelected ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 text-sm 3xl:text-base 4xl:text-lg text-main-gray/70">
                     <MonitorOff size={16} className="shrink-0 opacity-70 3xl:size-5 4xl:size-6" />
                     <p>Pick your platform above to get the command.</p>
                  </div>
               ) : command ? (
                  <>
                     <p
                        className="min-w-0 flex-1 overflow-hidden font-mono text-sm 3xl:text-base 4xl:text-lg text-nowrap text-main-gray mask-r-from-90%"
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
                           className="grid place-items-center [&>svg]:size-4 3xl:[&>svg]:size-5 4xl:[&>svg]:size-6"
                        >
                           {copied ? <ClipboardCheck size={16} className="text-black" /> : <Copy size={16} />}
                        </motion.span>
                     </button>
                  </>
               ) : (
                  <p className="text-sm 3xl:text-base 4xl:text-lg text-main-gray/60">Not implemented for now</p>
               )}
            </div>
         </div>
         {selectedOS && (
            <p className="flex items-center gap-1.5 3xl:gap-2 text-xs 3xl:text-sm 4xl:text-base text-main-gray/80">
               <ShieldCheck size={15} className="shrink-0 3xl:size-4 4xl:size-5" />
               <span>
                  Want to know what this command does?{' '}
                  <a
                     href={osInstructions[selectedOS].source}
                     target="_blank"
                     rel="noreferrer"
                     className="inline-flex items-center gap-1 3xl:gap-1.5 text-main-gray underline underline-offset-2 transition-colors hover:text-black"
                  >
                     View source
                     <SquareArrowOutUpRight size={12} className="shrink-0 3xl:size-3.5 4xl:size-4" />
                  </a>
               </span>
            </p>
         )}
         {selectedOS && (
            <div className="rounded-lg 3xl:rounded-xl border-2 border-main-dark-vivid/40 bg-main-light/60 px-3 3xl:px-5 4xl:px-6 py-2.5 3xl:py-4 4xl:py-5">
               <p className="mb-1.5 3xl:mb-2.5 text-sm 3xl:text-base 4xl:text-lg font-semibold text-main-gray">First time using a terminal?</p>
               <ol className="list-decimal space-y-1 3xl:space-y-1.5 4xl:space-y-2 pl-4 3xl:pl-5 text-xs 3xl:text-sm 4xl:text-base text-main-gray/80">
                  {osInstructions[selectedOS].steps.map((step, index) => (
                     <li key={index}>{step}</li>
                  ))}
               </ol>
            </div>
         )}
      </div>
   )
}

const unixCommand = (clientId: string) =>
   `curl -fsSL '${process.env.NEXT_PUBLIC_APP_URL}/unix.sh' | bash -s -- --client '${clientId}' --api '${process.env.NEXT_PUBLIC_LOCAL_API_URL}' --app '${process.env.NEXT_PUBLIC_APP_URL}'`

const osInstructions = {
   Windows: {
      command: (clientId: string) =>
         `$c = irm '${process.env.NEXT_PUBLIC_APP_URL}/win.ps1'; if ($c -is [byte[]]) { $c = [Text.Encoding]::UTF8.GetString($c) }; & ([scriptblock]::Create($c)) -ClientId '${clientId}' -ApiBase '${process.env.NEXT_PUBLIC_LOCAL_API_URL}' -AppBase '${process.env.NEXT_PUBLIC_APP_URL}'`,
      steps: [
         <>
            Press <Kbd>Win</Kbd>, type <span className="font-semibold text-main-gray">PowerShell</span> and open it.
         </>,
         <>
            Paste the command with <Kbd>Ctrl</Kbd> + <Kbd>V</Kbd> and press <Kbd>Enter</Kbd>.
         </>,
      ],
      shell: 'PowerShell',
      source: 'https://github.com/yaGeey/osu-find-songs/blob/main/public/win.ps1',
   },
   MacOS: {
      command: unixCommand,
      steps: [
         <>
            Press <Kbd>Cmd</Kbd> + <Kbd>Space</Kbd>, type <span className="font-semibold text-main-gray">Terminal</span>{' '}
            and open it.
         </>,
         <>
            Paste the command with <Kbd>Cmd</Kbd> + <Kbd>V</Kbd> and press <Kbd>Enter</Kbd>.
         </>,
      ],
      shell: 'bash',
      source: 'https://github.com/yaGeey/osu-find-songs/blob/main/public/unix.sh',
   },
   Linux: {
      command: unixCommand,
      steps: [
         <>Open your terminal.</>,
         <>
            Paste the command with <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>V</Kbd> and press <Kbd>Enter</Kbd>.
         </>,
      ],
      shell: 'bash',
      source: 'https://github.com/yaGeey/osu-find-songs/blob/main/public/unix.sh',
   },
}
