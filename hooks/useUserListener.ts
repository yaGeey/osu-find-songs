'use client'
import { useEffect } from 'react'
import Pusher from 'pusher-js'
import { toast } from 'react-toastify'
import useSessionId from './useSessionId'

export default function useUserListener() {
   const sessionId = useSessionId()
   useEffect(() => {
      if (!sessionId) return
      console.log(sessionId)

      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
         cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      })

      const channel = pusher.subscribe(`user-${sessionId}`)
      channel.bind('message', (data: { message: string }) => {
         console.log('Received message:', data)
         toast.info(`Message from developer: ${data.message}`, { autoClose: false })
      })

      return () => {
         pusher.unsubscribe(`user-${sessionId}`)
      }
   }, [sessionId])
   return
}
