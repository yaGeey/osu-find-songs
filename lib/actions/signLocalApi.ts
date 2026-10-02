'use server'
import { createHmac } from 'crypto'

function getSigningBase() {
   const base = process.env.NEXT_PUBLIC_LOCAL_API_URL
   if (!process.env.LOCAL_API_SECRET || !base) throw new Error('LOCAL_API_SECRET or NEXT_PUBLIC_LOCAL_API_URL is not set')
   return base
}

function signPayload(payload: string) {
   const exp = Math.floor(Date.now() / 1000) + 60 * 5
   const sig = createHmac('sha256', process.env.LOCAL_API_SECRET!).update(`${payload}${exp}`).digest('hex')
   return { exp: exp.toString(), sig }
}

export async function signLocalApiUrl(pathWithQuery: string) {
   const url = new URL(pathWithQuery, getSigningBase())
   const { exp, sig } = signPayload(pathWithQuery)

   url.searchParams.set('url', pathWithQuery)
   url.searchParams.set('exp', exp)
   url.searchParams.set('sig', sig)

   return url.toString()
}

// Builds a signed URL for the API server's /proxy route, whose `url` query param is both
// the signed payload and the fetch target (`HMAC(secret, url + exp)`). Must run as a
// server action: LOCAL_API_URL/LOCAL_API_SECRET don't exist in client bundles.
export async function createProxiedLocalApiUrl(targetUrl: string) {
   const base = getSigningBase()
   new URL(targetUrl) // reject invalid targets before signing

   const url = new URL('/proxy', base)
   const { exp, sig } = signPayload(targetUrl)

   url.searchParams.set('url', targetUrl) // encoded by URLSearchParams
   url.searchParams.set('exp', exp)
   url.searchParams.set('sig', sig)

   return url.toString()
}
