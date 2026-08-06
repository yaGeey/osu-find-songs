import { neon } from '@neondatabase/serverless'

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
      return Response.json({ message: 'Duration updated' }, { status: 200 })
   } catch (err) {
      return Response.json({ message: 'Error updating duration' }, { status: 500 })
   }
}
