import { NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
   appId: process.env.PUSHER_APP_ID!,
   key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
   secret: process.env.PUSHER_SECRET!,
   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
   useTLS: true,
})

export async function POST(req: Request) {
   const { targetUserId, message, pwd } = await req.json()
   if (pwd !== process.env.ADMIN_PWD) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
   }
   if (typeof targetUserId !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
   }

   await pusher.trigger(`user-${targetUserId}`, 'message', { message })

   return NextResponse.json({})
}
