import { useState } from 'react'

export default function useNotification() {
   const [permission, setPermission] = useState<NotificationPermission>(Notification.permission)
   const isSupported = typeof window !== 'undefined' && 'Notification' in window

   const requestPermission = async () => {
      if (!isSupported) return
      const result = await Notification.requestPermission()
      setPermission(result)
   }

   const sendNotification = (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return
      return new Notification(title, options)
   }

   return { permission, isSupported, requestPermission, sendNotification }
}
