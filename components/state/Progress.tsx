import { LinearProgress } from '@mui/material'
import { twMerge as tw } from 'tailwind-merge'

export default function Progress({
   isVisible,
   value,
   isError = false,
   children,
   color = 'text-highlight',
}: {
   isVisible: boolean
   value: number
   isError?: boolean
   children?: React.ReactNode
   color?: string
}) {
   if (!isVisible) return <div className="h-0.75 fixed top-0 bg-darker w-screen z-1000"></div>
   return (
      <div className={tw('fixed top-0 h-0.75 z-100000 w-screen ', isError ? 'text-red-400' : color)}>
         <LinearProgress variant="determinate" value={value} color="inherit" />
         <div
            className={tw(
               'absolute top-1 right-0 z-1000 bg-highlight/30 text-gray-800 text-xs px-1 rounded-bl-sm min-w-[100px] text-end',
               isError && 'bg-red-400/30',
            )}
         >
            {children}
         </div>
      </div>
   )
}
