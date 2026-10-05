'use client'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

const COUNT = 3

export default function LoadingDots({
   className,
   interval = 400,
   label,
}: {
   className?: string
   interval?: number
   label?: string
}) {
   const [step, setStep] = useState(1)

   useEffect(() => {
      const id = window.setInterval(() => setStep((s) => (s + 1) % (COUNT + 1)), interval)
      return () => window.clearInterval(id)
   }, [interval])

   return (
      <span
         role={label ? 'status' : undefined}
         aria-label={label}
         aria-hidden={label ? undefined : true}
         className={twMerge('inline-flex', className)}
      >
         {Array.from({ length: COUNT }, (_, i) => (
            <span key={i} className={i < step ? 'opacity-100' : 'opacity-0'}>
               .
            </span>
         ))}
      </span>
   )
}
