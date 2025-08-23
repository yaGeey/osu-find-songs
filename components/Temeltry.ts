'use client'
import { useEffect } from 'react'
import axios from 'axios'
import { usePathname } from 'next/navigation'

export default function Telemetry() {
   const pathname = usePathname()
   useEffect(() => {
      const func = async () => {
         const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
         localStorage.setItem('sessionId', sessionId)

         await axios.post('/api/telemetry', {
            session_id: sessionId,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
            page: window.location.pathname,
         })
      }
      if (process.env.NODE_ENV == 'development') func()
   }, [pathname])
   return null
}
