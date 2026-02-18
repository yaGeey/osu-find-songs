import { useEffect, useRef, useState } from 'react'

export default function useProgressVariant(
   updateOnChangeValue: any,
   defaultVariant: 'determinate' | 'indeterminate' = 'determinate',
) {
   const [variant, setVariant] = useState(defaultVariant)
   const timeoutRef = useRef<NodeJS.Timeout | null>(null)

   useEffect(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      setVariant(defaultVariant)
      timeoutRef.current = setTimeout(() => {
         setVariant('indeterminate')
      }, 7000)
      return () => {
         if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
   }, [updateOnChangeValue, defaultVariant])

   return variant
}
