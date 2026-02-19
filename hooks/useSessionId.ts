import { useEffect, useState } from "react";

export default function useSessionId() {
   const [id, setId] = useState<string | null>(null)
   useEffect(() => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
      
      // first try if already initialized
      const sessionId = localStorage.getItem('highlightIdentifier')
      if (sessionId) {
         setId(sessionId)
         return
      }

      // polling
      const interval = setInterval(() => {
         const sessionId = localStorage.getItem('highlightIdentifier')
         if (sessionId) {
            setId(sessionId)
            clearInterval(interval)
         }
      }, 100)
      return () => clearInterval(interval)
   }, [])

   return id
}
