import { useEffect, useState } from 'react'

export default function useSessionId() {
   const [id, setId] = useState<string | undefined>(() => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return undefined
      return localStorage.getItem('highlightIdentifier') ?? undefined
   })

   useEffect(() => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return

      if (id) return

      // polling
      const interval = setInterval(() => {
         const sessionId = localStorage.getItem('highlightIdentifier')
         if (sessionId) {
            setId(sessionId)
            clearInterval(interval)
         }
      }, 100)
      return () => clearInterval(interval)
   }, [id])

   return id
}
