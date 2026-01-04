'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'
const botRegex =
   /bot|crawler|vercel|spider|slurp|facebookexternalhit|bingpreview|embedly|quora|baidu|yandex|sogou|exabot|rogerbot|uptime/i

export default function Telemetry() {
   const pathname = usePathname()
   const startTimeRef = useRef<number>(Date.now())
   const recordIfRef = useRef<number | null>(null)

   // Update session duration in DB
   const sendDuration = (durationMs: number) => {
      if (!recordIfRef.current) return

      fetch('/api/telemetry/duration-update', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            id: recordIfRef.current,
            duration_ms: durationMs,
         }),
         keepalive: true, // ensure the request is sent even on unload
      }).catch((err) => console.error('Sync failed', err))
   }

   useEffect(() => {
      if (process.env.NODE_ENV === 'development') return
      if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof navigator === 'undefined') return

      const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
      localStorage.setItem('sessionId', sessionId)

      // first req to db to log visit
      const logVisit = async () => {
         try {
            const res = await axios.post('/api/telemetry', {
               session_id: sessionId,
               user_agent: navigator.userAgent,
               referrer: document.referrer || null,
               page: pathname,
               is_bot: botRegex.test(navigator.userAgent),
            })
            recordIfRef.current = res.data.id
         } catch (e) {}
      }

      recordIfRef.current = null // Dropping previous record id on path change
      logVisit()

      // setup for duration tracking
      startTimeRef.current = Date.now()
      const handleVisibilityChange = () => {
         if (document.visibilityState === 'hidden') {
            sendDuration(Date.now() - startTimeRef.current)
         } else {
            startTimeRef.current = Date.now()
         }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      // cleanup, calls on umount or path change
      return () => {
         sendDuration(Date.now() - startTimeRef.current)
         document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
   }, [pathname])

   return null
}
