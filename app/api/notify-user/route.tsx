import Pusher from 'pusher'

const pusher = new Pusher({
   appId: process.env.PUSHER_APP_ID!,
   key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
   secret: process.env.PUSHER_SECRET!,
   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
   useTLS: true,
})

export async function POST(req: Request) {
   try {
      const { targetUserId, message, pwd } = await req.json()
      if (pwd !== process.env.ADMIN_PWD) {
         return Response.json({ message: 'Unauthorized' }, { status: 401 })
      }
      if (typeof targetUserId !== 'string' || typeof message !== 'string') {
         return Response.json({ message: 'Invalid payload' }, { status: 400 })
      }

      await pusher.trigger(`user-${targetUserId}`, 'message', { message })
      return Response.json({ message: 'Notification sent' }, { status: 200 })
   } catch (error) {
      return Response.json({ message: 'Invalid JSON or internal error' }, { status: 400 })
   }
}
