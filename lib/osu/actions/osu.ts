'use server'
import { BeatmapSet, BeatmapSetFromOsu, BeatmapSetFromSpotify } from '@/types/Osu'
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

export async function getBeatmapForFromOsu(id: string): Promise<BeatmapSetFromOsu> {
   return fetchOsu(async (token) => {
      const res = await customAxios.get<BeatmapSet>(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`, {
         headers: buildHeaders(token),
         context: 'fetch beatmap details from osu',
      })
      return {
         bpm: res.data.bpm,
         genre: res.data.genre.name,
         id: res.data.id,
         language: res.data.language.name,
         submitted_date: res.data.submitted_date,
         rating: res.data.rating,
         covers: {
            cover: res.data.covers.cover,
            'card@2x': res.data.covers['card@2x'],
            list: res.data.covers.list,
         },
      } satisfies BeatmapSetFromOsu // TODO maybe trim it more?
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

export async function beatmapsSearch(queries: Queries): Promise<{ beatmapsets: BeatmapSetFromSpotify[]; total: number }> {
   return fetchOsu(async (token) => {
      const queryString = getQueryString(queries)

      const res = await customAxios.get<{ beatmapsets: Array<BeatmapSet>; total: number }>(
         `https://osu.ppy.sh/api/v2/beatmapsets/search?${queryString}`,
         {
            headers: buildHeaders(token),
            context: 'search beatmaps',
         },
      )
      const bs = res.data.beatmapsets
      if (bs?.find((b) => b.id === 22156) && bs.length === 50) return { beatmapsets: [], total: 0 }
      return {
         total: res.data.total,
         beatmapsets: bs.map(
            (b) =>
               ({
                  bpm: b.bpm,
                  id: b.id,
                  submitted_date: b.submitted_date,
                  rating: b.rating,
                  covers: {
                     cover: b.covers.cover,
                     'card@2x': b.covers['card@2x'],
                     list: b.covers.list,
                     'cover@2x': b.covers['cover@2x'],
                     card: b.covers.card,
                  },
                  artist: b.artist,
                  beatmaps: b.beatmaps,
                  creator: b.creator,
                  favourite_count: b.favourite_count,
                  last_updated: b.last_updated,
                  play_count: b.play_count,
                  preview_url: b.preview_url,
                  ranked: b.ranked,
                  ranked_date: b.ranked_date,
                  status: b.status,
                  title: b.title,
                  video: b.video,
               }) satisfies BeatmapSetFromSpotify,
         ),
      }
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
