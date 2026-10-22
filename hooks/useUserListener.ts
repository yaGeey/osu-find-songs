'use client'
import { useEffect } from 'react'
import type Pusher from 'pusher-js'
import { toast } from 'react-toastify'
import useSessionId from './useSessionId'

export default function useUserListener() {
   const { id: sessionId } = useSessionId()
   useEffect(() => {
      if (!sessionId) return
      let cancelled = false
      let client: Pusher | undefined

      // pusher-js (~60 KB) is only needed once a session exists, load it after paint.
      void (async () => {
         const { default: PusherClient } = await import('pusher-js')
         if (cancelled) return

         client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
         })

         const channel = client.subscribe(`user-${sessionId}`)
         channel.bind('message', (data: { message: string }) => {
            toast.info(`Message from developer: ${data.message}`, { autoClose: false })
         })
      })()

      return () => {
         cancelled = true
         if (!client) return
         client.unsubscribe(`user-${sessionId}`)
         client.disconnect()
         client = undefined
      }
   }, [sessionId])
   return
}
