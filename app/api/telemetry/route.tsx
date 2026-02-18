import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import axios from 'axios'

export async function POST(req: Request) {
   const body = await req.json()
   const { session_id, user_agent, referrer, page, is_bot } = body

   let country = req.headers.get('x-vercel-ip-country')
   let city = req.headers.get('x-vercel-ip-city')

   const forwardedFor = req.headers.get('x-forwarded-for')
   const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null
   const isLocalhost = ip === '::1' || ip === '127.0.0.1' || !ip

   if ((!country || !city) && !isLocalhost) {
      try {
         // using default axios as we dont care about errors there
         const { data } = await axios.get(`https://ipapi.co/${ip}/json/`)
         country = data.country
         city = data.city
      } catch (err) {
         console.error('Error fetching geolocation data:', err)
      }
   }

   try {
      const sql = neon(`${process.env.DATABASE_URL}`)
      const res = await sql`
         INSERT INTO telemetry (session_id, user_agent, referrer, country, city, page, is_bot)
         VALUES (${session_id}, ${user_agent}, ${referrer}, ${country}, ${city}, ${page}, ${is_bot})
         RETURNING id
      `
      return NextResponse.json({ message: 'Telemetry received', id: res[0]?.id }, { status: 200 })
   } catch (err) {
      console.error('Error storing telemetry:', err)
      return NextResponse.json({ message: 'Error storing telemetry' }, { status: 500 })
   }
}
