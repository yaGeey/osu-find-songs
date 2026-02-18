'use server'
import { cookies } from 'next/headers'
import { SpotifyAuthResponse, SpotifyError } from '@/types/Spotify'
import { isAxiosError } from 'axios'
import { customAxios as axios } from '../axios'

export async function getServerToken(): Promise<string> {
   let token = (await cookies()).get('spotify_token')?.value
   if (!token) token = await revalidateSpotifyToken()
   return token
}

async function getUserToken(): Promise<string> {
   let token = (await cookies()).get('spotify_oauth_token')?.value
   if (!token) token = await refreshToken()
   return token
}

export async function fetchSpotify<T>(func: (token: string) => Promise<T>, tokenType: 'api' | 'oauth' = 'api'): Promise<T> {
   let token: string | undefined
   try {
      token = tokenType === 'api' ? await getServerToken() : await getUserToken()
      return await func(token)
   } catch (err) {
      if (isAxiosError<SpotifyError>(err)) {
         if (err.response?.data.error.status === 429 && token) {
            const wait = parseInt(err.response?.headers?.['Retry-After'])
            if (wait > 60 || isNaN(wait)) throw new Error(`Spotify rate limit: wait too long (${wait}s)`)
            console.warn(`Rate limit exceeded. Waiting for ${wait} seconds...`)
            await new Promise((resolve) => setTimeout(resolve, wait * 1000 + 1))
            return await func(token)
         }
      }
      throw err
   }
}

export const findSong = async (query: string) => {
   return fetchSpotify(async (token) => {
      const res = await axios.get<SpotifyApi.TrackSearchResponse>(
         `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
         {
            headers: { Authorization: `Bearer ${token}` },
         },
      )
      return res.data
   })
}

export async function refreshToken(): Promise<string> {
   const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
      client_id: process.env.AUTH_SPOTIFY_ID!,
      client_secret: process.env.AUTH_SPOTIFY_SECRET!,
   })
   const { data } = await axios.post<SpotifyAuthResponse>('https://accounts.spotify.com/api/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
   })
   console.log('refresh_token NEW', data.refresh_token)

   const storage = await cookies()
   storage.set('spotify_oauth_access_token', data.access_token, {
      path: '/',
      expires: new Date(Date.now() + data.expires_in * 1000),
   })
   return data.access_token
}

export async function revalidateSpotifyToken(): Promise<string> {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AUTH_SPOTIFY_ID!,
      client_secret: process.env.AUTH_SPOTIFY_SECRET!,
   })

   const { data } = await axios.post<SpotifyAuthResponse>('https://accounts.spotify.com/api/token', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
   })

   const storage = await cookies()
   storage.set('spotify_token', data.access_token, {
      path: '/',
      expires: new Date(Date.now() + data.expires_in * 1000),
   })
   return data.access_token
}

export async function getPlaylist(playlistId: string) {
   return fetchSpotify(async (token) => {
      const { data } = await axios.get<SpotifyApi.SinglePlaylistResponse>(`https://api.spotify.com/v1/playlists/${playlistId}`, {
         headers: { Authorization: `Bearer ${token}` },
      })
      return data
   })
}

export async function fetchMyProfile() {
   return fetchSpotify(async (token) => {
      const res = await axios.get<SpotifyApi.CurrentUsersProfileResponse>('https://api.spotify.com/v1/me', {
         headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
   }, 'oauth')
}

export async function createPlaylist({
   userId,
   name,
   description,
   isPublic = false,
   collaborative = false,
}: {
   userId: string
   name: string
   isPublic?: boolean
   collaborative?: boolean
   description: string
}) {
   return fetchSpotify(async (token) => {
      const { data } = await axios.post<SpotifyApi.CreatePlaylistResponse>(
         `https://api.spotify.com/v1/users/${userId}/playlists`,
         {
            name,
            public: isPublic,
            collaborative,
            description,
         },
         { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      )
      return data
   }, 'oauth')
}

export async function addItemsToPlaylist(playlistId: string, uris: string[]) {
   return fetchSpotify(async (token) => {
      if (uris.length > 100) throw new Error('Max 100 tracks per request, got ' + uris.length)
      if (uris.length === 0) throw new Error('No tracks provided')
      const res = await axios.post<SpotifyApi.AddTracksToPlaylistResponse>(
         `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
         { uris, position: 0 }, //? add to the beginning of the playlist
         { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      )
      return res.data
   }, 'oauth')
}

export async function OAuthAuthorization(code: string) {
   const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NEXT_PUBLIC_URL! + '/auth/spotify/callback',
      client_id: process.env.AUTH_SPOTIFY_ID!,
      client_secret: process.env.AUTH_SPOTIFY_SECRET!,
   })

   const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
   })

   if (!response.ok) throw new Error(await response.text())
   const data = await response.json()

   const storage = await cookies()
   storage.set('spotify_oauth_refresh_token', data.refresh_token, {
      maxAge: data.expires_in,
   })
   return data
}

export async function fetchWithToken(url: string) {
   return fetchSpotify(async (token) => {
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      return res.data
   })
}
