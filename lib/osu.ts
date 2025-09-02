'use server'
import { BeatmapSet } from '@/types/Osu'
import axios from 'axios'
import { axiosErrorHandler, unexpectedErrorHandler } from './errorHandlers'

let osuToken: string | null = null
let tokenRefreshing: Promise<string> | null = null
const customAxios = axios.create({
   httpAgent: new (require('http')).Agent({ keepAlive: true }),
   httpsAgent: new (require('https')).Agent({ keepAlive: true }),
})

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

async function fetchOsu<T>(func: (token: string) => Promise<T>): Promise<T> {
   const token = await getToken()
   try {
      return await func(token)
   } catch (err) {
      if (axios.isAxiosError<{ error: string }>(err)) {
         if (err.response?.data.error === 'Too Many Attempts.' && token) {
            console.warn(`OSU: Too many attempts, retrying in 1s...`)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return await func(token)
         }
         axiosErrorHandler(err, 'OSU')
      } else unexpectedErrorHandler(err, 'OSU')
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
   console.log('osu token revalidation')

   // const storage = await cookies()
   // storage.set('osuToken', data.access_token, {
   //    path: '/',
   //    expires: new Date(Date.now() + data.expires_in * 1000),
   // })
   return data.access_token
}
