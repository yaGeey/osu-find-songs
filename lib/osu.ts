'use server'
import { BeatmapSet } from '@/types/Osu'
import axios from 'axios'
import { customAxios } from './axios'

let osuToken: string | null = null
let tokenRefreshing: Promise<string> | null = null

async function getToken(): Promise<string> {
   if (osuToken) return osuToken
   if (tokenRefreshing) return tokenRefreshing
   tokenRefreshing = revalidateOsuToken().then((newToken) => {
      osuToken = newToken
      tokenRefreshing = null
      return newToken // return token to other waiters
   })
   return tokenRefreshing
}

async function fetchOsu<T>(func: (token: string) => Promise<T>, retries = 1): Promise<T> {
   const token = await getToken()
   try {
      return await func(token)
   } catch (err) {
      if (axios.isAxiosError<{ error: string }>(err)) {
         if ((err.response?.status === 429 || err.response?.data.error === 'Too Many Attempts') && retries > 0) {
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
         headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
         },
      })
      return res.data
   })
}

export async function beatmapsSearchV2(queries: { [key: string]: string | null }): Promise<any> {
   const token = await getToken()
   const queryString = Object.entries(queries)
      .flatMap(([key, value]) => {
         if (!value) return []
         return `${key}=${encodeURIComponent(value)}`
      })
      .join('&')

   return await customAxios.get(`https://osu.ppy.sh/api/v2/beatmapsets/search?${queryString}`, {
      headers: {
         Authorization: `Bearer ${token}`,
         'Content-Type': 'application/json',
         Accept: 'application/json',
      },
   })
}

export async function beatmapsSearch(queries: { [key: string]: string | null }): Promise<any> {
   // TODO fix any
   return fetchOsu(async (token) => {
      const queryString = Object.entries(queries)
         .flatMap(([key, value]) => {
            if (!value) return []
            return `${key}=${encodeURIComponent(value)}`
         })
         .join('&')

      const res = await customAxios.get(`https://osu.ppy.sh/api/v2/beatmapsets/search?${queryString}`, {
         headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
         },
      })
      // res.data.error
      return res.data.beatmapsets
   })
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
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
      },
   })
   console.log('osu token revalidation')

   // const storage = await cookies()
   // storage.set('osuToken', data.access_token, {
   //    path: '/',
   //    expires: new Date(Date.now() + data.expires_in * 1000),
   // })
   return data.access_token
}
