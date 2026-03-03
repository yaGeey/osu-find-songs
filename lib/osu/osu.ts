'use server'
import { BeatmapSet } from '@/types/Osu'
import axios from 'axios'
import { customAxios } from '../axios'
import { cookies } from 'next/headers'

let tokenRefreshPromise: Promise<string> | null = null

function buildHeaders(token?: string) {
   const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
   }
   if (token) headers['Authorization'] = `Bearer ${token}`
   return { ...headers }
}

async function getToken(): Promise<string> {
   // if we are already refreshing the token, wait for it to finish and return the new token
   if (tokenRefreshPromise) return tokenRefreshPromise

   // If no, try to get from cookies
   const cookieStore = await cookies()
   const cachedToken = cookieStore.get('osuToken')?.value
   if (cachedToken) return cachedToken

   // If expired or not exist
   tokenRefreshPromise = revalidateOsuToken().then((newToken) => {
      tokenRefreshPromise = null
      return newToken
   })
   return tokenRefreshPromise
}

async function fetchOsu<T>(func: (token: string) => Promise<T>, retries = 3): Promise<T> {
   try {
      const token = await getToken()
      return await func(token)
   } catch (err) {
      if (axios.isAxiosError<{ error: string }>(err)) {
         if (err.response?.status === 429 || (err.response?.data.error === 'Too Many Attempts' && retries > 0)) {
            const jitter = Math.random() * 400
            const delay = 300 + jitter
            console.warn(`OSU 429. Retry in ${Math.floor(delay)}ms`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            return fetchOsu(func, retries - 1)
         }
      }
      throw err
   }
}

export async function getBeatmap(id: string): Promise<BeatmapSet> {
   return fetchOsu(async (token) => {
      const res = await customAxios.get<BeatmapSet>(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`, {
         headers: buildHeaders(token),
      })
      return res.data
   })
}

type Queries = Record<string, string | null>
function getQueryString(queries: Queries) {
   return Object.entries(queries)
      .flatMap(([key, value]) => {
         if (!value) return []
         return `${key}=${encodeURIComponent(value)}`
      })
      .join('&')
}

export async function beatmapsSearch(queries: Queries) {
   return fetchOsu(async (token) => {
      const queryString = getQueryString(queries)

      const res = await customAxios.get<{ beatmapsets: Array<BeatmapSet>; total: number }>(
         `https://osu.ppy.sh/api/v2/beatmapsets/search?${queryString}`,
         {
            headers: buildHeaders(token),
         },
      )
      return res.data
   })
}

export async function beatmapsSearchCatboy(queries: Queries) {
   const queryString = getQueryString(queries)
   const { data } = await customAxios.get<Array<BeatmapSet>>(`https://catboy.best/api/v2/search?${queryString}`)
   return data
}

export async function revalidateOsuToken(): Promise<string> {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OSU_CLIENT!,
      client_secret: process.env.OSU_SECRET!,
      scope: 'public',
   })

   const { data } = await customAxios.post<{
      access_token: string
      expires_in: number
      token_type: string
   }>('https://osu.ppy.sh/oauth/token', body.toString(), {
      headers: {
         Accept: 'application/json',
         'Content-Type': 'application/x-www-form-urlencoded',
      },
   })

   const storage = await cookies()
   storage.set('osuToken', data.access_token, {
      path: '/',
      expires: new Date(Date.now() + data.expires_in * 1000),
   })
   return data.access_token
}
