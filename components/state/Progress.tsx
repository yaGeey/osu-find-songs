import { LinearProgress } from '@mui/material'
import { use, useEffect, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'

export default function Progress({
   isVisible,
   value,
   isError = false,
   children,
   color = 'text-accent',
   defaultVariant = 'determinate',
}: {
   isVisible: boolean
   value: number
   isError?: boolean
   children?: React.ReactNode
   color?: string
   defaultVariant?: 'determinate' | 'indeterminate'
}) {
   const [variant, setVariant] = useState<'determinate' | 'indeterminate'>(defaultVariant)

   useEffect(() => {
      setVariant(defaultVariant)
      const timeout = setTimeout(() => setVariant('indeterminate'), 4000)
      return () => clearTimeout(timeout)
   }, [value, defaultVariant])

   if (!isVisible) return <div className="h-0.75 fixed top-0 bg-main-darker w-screen z-1000"></div>
   return (
      <div className={tw('fixed top-0 h-0.75 z-100000 w-screen ', isError ? 'bg-error text-error' : color)}>
         <LinearProgress variant={variant} value={value} color="inherit" />
         <div
            className={tw(
               'absolute top-0.75 right-0 z-1000 bg-accent/30 text-gray-800 text-xs px-1 rounded-bl-sm min-w-[100px] text-end',
               isError && 'bg-error',
            )}
         >
            {children}
         </div>
      </div>
   )
}
