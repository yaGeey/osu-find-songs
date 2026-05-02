'use server'
import { BeatmapSet } from '@/types/Osu'
import { customAxios } from '../../serverAxios'
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
   const token = await getToken()
   return await func(token)
}

export async function getBeatmap(id: string): Promise<BeatmapSet> {
   return fetchOsu(async (token) => {
      const res = await customAxios.get<BeatmapSet>(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`, {
         headers: buildHeaders(token),
         context: 'fetch beatmap details',
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
            context: 'search beatmaps',
         },
      )
      if (res.data.beatmapsets?.find((b) => b.id === 22156) && res.data.beatmapsets.length === 50)
         return { beatmapsets: [], total: 0 }
      return res.data
   })
}

type AuthResponse = {
   access_token: string
   expires_in: number
}
async function revalidateOsuToken(): Promise<string> {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OSU_CLIENT!,
      client_secret: process.env.OSU_SECRET!,
      scope: 'public',
   })

   const { data } = await customAxios.post<AuthResponse>('https://osu.ppy.sh/oauth/token', body.toString(), {
      headers: {
         Accept: 'application/json',
         'Content-Type': 'application/x-www-form-urlencoded',
      },
      context: 'revalidate osu token',
   })

   const storage = await cookies()
   storage.set('osuToken', data.access_token, {
      path: '/',
      expires: new Date(Date.now() + data.expires_in * 1000),
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
   })
   return data.access_token
}

const lazerCookieTokenName = 'lazerToken'
export const getLazerToken = async () => (await cookies()).get(lazerCookieTokenName)?.value ?? (await lazerLogin())

async function lazerLogin() {
   const { data } = await customAxios.post<AuthResponse>(
      'https://osu.ppy.sh/oauth/token',
      `username=${process.env.LAZER_USERNAME}&password=${process.env.LAZER_PWD}&grant_type=password&client_id=5&client_secret=FGc9GAtyHzeQDshWP5Ah7dega8hJACAJpQtw6OXk&scope=*`,
      {
         headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         context: 'lazer login',
      },
   )
   const storage = await cookies()
   storage.set(lazerCookieTokenName, data.access_token, {
      path: '/',
      expires: new Date(Date.now() + data.expires_in * 1000),
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
   })
   return data.access_token
}
