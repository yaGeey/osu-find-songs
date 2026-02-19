'use client'
import { Button } from '@/components/buttons/Buttons'
import { Input } from '@mui/material'
import axios from 'axios'
import { ToastContainer } from 'react-toastify'

export default function AdminPage() {
   const sendMessage = async (formData: FormData) => {
      const targetUserId = formData.get('targetUserId') as string
      const message = formData.get('message') as string
      const pwd = formData.get('pwd') as string
      try {
         await axios.post('/api/notify-user', { targetUserId, message, pwd })
      } catch (err) {
         alert('Failed to send message')
         console.log(err)
      }
   }

   return (
      <>
         <form action={sendMessage} className="bg-white w-fit h-fit p-6 rounded-lg flex flex-col gap-3 m-auto inset-0 absolute">
            <Input placeholder="targetUserId" name="targetUserId" />
            <Input placeholder="message" name="message" />
            <Input placeholder="pwd" name="pwd" />
            <Button type="submit">Send</Button>
         </form>
         <ToastContainer />
      </>
   )
}
