'use server'
import { BeatmapSet } from '@/types/Osu'
import { cookies } from 'next/headers'
import axios from 'axios'

async function fetchOsu<T>(func: (token: string) => Promise<T>): Promise<T> {
   let token
   try {
      token = (await cookies()).get('osuToken')?.value
      if (!token) token = await revalidateOsuToken()
      return await func(token)
   } catch (err) {
      if (axios.isAxiosError<{ error: string }>(err)) {
         if (err.response?.data.error === 'Too Many Attempts.' && token) {
            console.warn(`OSU: Too many attempts, retrying in 1s...`)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return await func(token)
         }
         console.error('OSU Err:', err.toJSON())
         throw new Error(err.response?.data.error ?? err.message ?? 'Unexpected server error')
      }
      console.error('OSU unexpected:', err)
      throw new Error('Unexpected server error')
   }
}

export async function getBeatmap(id: string): Promise<BeatmapSet> {
   return fetchOsu(async (token) => {
      const res = await axios.get<BeatmapSet>(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`, {
         headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
         },
      })
      return res.data
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

      const res = await axios.get(`https://osu.ppy.sh/api/v2/beatmapsets/search?${queryString}`, {
         headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
         },
      })
      return res.data
   })
}

export async function revalidateOsuToken(): Promise<string> {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OSU_CLIENT!,
      client_secret: process.env.OSU_SECRET!,
      scope: 'public',
   })

   const { data } = await axios.post<{
      access_token: string
      expires_in: number
      token_type: string
   }>('https://osu.ppy.sh/oauth/token', body.toString(), {
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         Accept: 'application/json',
      },
   })
   console.log('osu token revalidation', data)

   const storage = await cookies()
   storage.set('osuToken', data.access_token, {
      path: '/',
      expires: new Date(Date.now() + data.expires_in * 1000),
   })
   return data.access_token
}
