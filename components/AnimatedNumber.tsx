'use client'
import { useState, useEffect } from 'react'
import { useSpring, motion } from 'framer-motion'
import { roundDownAndSaveDigits } from '@/utils/numbers'

export default function AnimatedNumber({ value: target, duration = 1000, label }: { value: number; duration?: number, label?: string }) {
   const rounded = roundDownAndSaveDigits(target)
   const [displayValue, setDisplayValue] = useState(rounded)

   const spring = useSpring(rounded, { duration, bounce: 0 })

   useEffect(() => {
      return spring.on('change', (latest) => setDisplayValue(Math.round(latest)))
   }, [spring])

   useEffect(() => {
      spring.set(target)
   }, [target, spring])

   return (
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
         {displayValue} {label}
      </motion.span>
   )
}
