'use client'
import Spinner from 'react-spinner-material'
import { twMerge as tw } from 'tailwind-merge'

export default function Loading({
   color = 'oklch(0.8 0.16 250)',
   radius = 40,
   className,
}: {
   color?: string
   radius?: number
   className?: string
}) {
   return (
      <div
         className={tw(
            `absolute top-0 left-0 w-full h-full flex justify-center items-center z-50 [backdrop-filter:blur(1px)]`,
            className,
         )}
      >
         <Spinner radius={radius} color={color} stroke={3} visible={true} />
      </div>
   )
}
