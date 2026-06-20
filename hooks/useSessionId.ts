import { useEffect, useState } from 'react'

export default function useSessionId() {
   const [id, setId] = useState<string | undefined>(undefined)
   useEffect(() => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return

      // first try if already initialized
      const sessionId = localStorage.getItem('highlightIdentifier')
      if (sessionId) {
         setId(sessionId)
         return
      }

      const interval = setInterval(() => {
         const sessionId = localStorage.getItem('highlightIdentifier')
         if (sessionId) {
            setId(sessionId)
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

   return id
}
