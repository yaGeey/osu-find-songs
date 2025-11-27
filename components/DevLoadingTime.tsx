import { useEffect, useRef } from 'react'

export default function DevLoadingTime({ isLoading, dataLength }: { isLoading: boolean; dataLength: number }) {
   const loadStartTime = useRef<number | null>(null)
   const hasShownAlert = useRef(false)

   useEffect(() => {
      if (isLoading && loadStartTime.current === null) {
         loadStartTime.current = performance.now()
         hasShownAlert.current = false
      }
   }, [isLoading])

   useEffect(() => {
      if (
         !isLoading &&
         loadStartTime.current !== null &&
         !hasShownAlert.current &&
         dataLength > 0 &&
         process.env.NODE_ENV === 'development'
      ) {
         const totalTime = ((performance.now() - loadStartTime.current) / 1000).toFixed(2)
         alert(`Завантаження завершено за ${totalTime} секунд`)
         hasShownAlert.current = true
         loadStartTime.current = null
      }
   }, [isLoading, dataLength])

   return null
}
