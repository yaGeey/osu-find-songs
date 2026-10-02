'use server'
import { createHmac } from 'crypto'

export async function signLocalApiUrl(pathWithQuery: string) {
   if (!process.env.LOCAL_API_SECRET || !process.env.NEXT_PUBLIC_LOCAL_API_URL)
      throw new Error('LOCAL_API_SECRET or NEXT_PUBLIC_LOCAL_API_URL is not set')

   const exp = Math.floor(Date.now() / 1000) + 60 * 5
   const sig = createHmac('sha256', process.env.LOCAL_API_SECRET).update(`${pathWithQuery}${exp}`).digest('hex')

   const url = new URL(pathWithQuery, process.env.NEXT_PUBLIC_LOCAL_API_URL)
   url.searchParams.set('url', pathWithQuery)
   url.searchParams.set('exp', exp.toString())
   url.searchParams.set('sig', sig)

   return url.toString()
}
