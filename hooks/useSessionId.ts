import { useEffect, useState } from 'react'

export default function useSessionId() {
   const [id, setId] = useState<string | undefined>(undefined)
   const [isIdFetching, setIsIdFetching] = useState(true)
   useEffect(() => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return

      // first try if already initialized
      const sessionId = localStorage.getItem(process.env.NEXT_PUBLIC_CLIENT_ID_STORAGE_KEY!)
      if (sessionId) {
         setId(sessionId)
         setIsIdFetching(false)
         return
      }

      const interval = setInterval(() => {
         const sessionId = localStorage.getItem(process.env.NEXT_PUBLIC_CLIENT_ID_STORAGE_KEY!)
         if (sessionId) {
            setId(sessionId)
            setIsIdFetching(false)
            clearInterval(interval)
         }
      }, 100)
      const timeout = setTimeout(() => {
         clearInterval(interval)
      }, 10000)

      return () => {
         clearInterval(interval)
         clearTimeout(timeout)
      }
   }, [])

   return { id, isIdFetching }
}
