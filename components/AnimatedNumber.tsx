'use client'
import { useState, useEffect } from 'react'
import { useSpring } from 'framer-motion'
import { roundDownAndSaveDigits } from '@/utils/numbers'

export default function AnimatedNumber({ value: target, duration = 1000 }: { value: number; duration?: number }) {
   const rounded = roundDownAndSaveDigits(target)
   const [displayValue, setDisplayValue] = useState(rounded)

   const spring = useSpring(rounded, { duration, bounce: 0 })

   useEffect(() => {
      return spring.on('change', (latest) => setDisplayValue(Math.round(latest)))
   }, [spring])

   useEffect(() => {
      spring.set(target)
   }, [target, spring])

   return displayValue
}
