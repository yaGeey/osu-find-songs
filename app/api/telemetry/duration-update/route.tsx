import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
   const body = await req.json()
   const { id, duration_ms } = body
   try {
      const sql = neon(`${process.env.DATABASE_URL}`)
      await sql`
         UPDATE telemetry
         SET duration_ms = ${Math.floor(duration_ms)}
         WHERE id = ${id}
      `
      return NextResponse.json({ message: 'Duration updated' }, { status: 200 })
   } catch (err) {
      console.error('Error updating telemetry duration:', err)
      return NextResponse.json({ message: 'Error updating duration' }, { status: 500 })
   }
}
