'use server'

import { isAxiosError } from 'axios'
import { customAxios } from '@/lib/serverAxios'
import {
   LastfmApiError,
   LastfmPeriod,
   LastfmTopTrackResponse,
   LastfmTopTracksResult,
   LastfmTopTracksResponse,
   LastfmTrack,
   LastfmUser,
   LastfmUserInfoResponse,
   lastfmPeriods,
} from '@/types/lastfm'

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/'
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 100

class ExpectedLastfmError extends Error {
   constructor(message: string) {
      super(message)
      this.name = 'ExpectedLastfmError'
   }
}

function getApiKey() {
   const apiKey = process.env.LASTFM_API_KEY
   if (!apiKey) throw new Error('LASTFM_API_KEY is not configured')
   return apiKey
}

function isLastfmError(data: unknown): data is LastfmApiError {
   return !!data && typeof data === 'object' && 'error' in data && 'message' in data
}

function normalisePeriod(period?: string | null): LastfmPeriod {
   if (period && lastfmPeriods.includes(period as LastfmPeriod)) return period as LastfmPeriod
   return 'overall'
}

function pickImage(images?: Array<{ '#text': string; size: string }>) {
   if (!images?.length) return null
   return [...images].reverse().find((image) => image['#text'])?.['#text'] ?? null
}

async function fetchLastfm<T>(params: Record<string, string | number>) {
   const searchParams = new URLSearchParams({
      api_key: getApiKey(),
      format: 'json',
   })

   for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value))
   }

   const { data } = await customAxios
      .get<T | LastfmApiError>(LASTFM_API_URL, {
         params: searchParams,
         headers: {
            Accept: 'application/json',
            'User-Agent': 'osu-lastfm/0.1.0 (https://github.com/codenm/osu-lastfm)',
         },
         context: `lastfm ${params.method}`,
      })
      .catch((err) => {
         const data = isAxiosError(err) ? err.response?.data : undefined
         if (isLastfmError(data)) throw new ExpectedLastfmError(data.message)
         return Promise.reject(err)
      })

   if (isLastfmError(data)) {
      throw new ExpectedLastfmError(data.message)
   }

   return data
}

function emptyTopTracksResult({
   user,
   period,
   limit,
   page,
   error,
}: {
   user: LastfmUser | null
   period: LastfmPeriod
   limit: number
   page: number
   error: string
}): LastfmTopTracksResult {
   return {
      user,
      tracks: [],
      period,
      total: 0,
      page,
      perPage: limit,
      hasMore: false,
      error,
   }
}

export async function getLastfmUser(username: string): Promise<LastfmUser> {
   const trimmed = username.trim()
   if (!trimmed) throw new Error('Last.fm username is required')

   const data = await fetchLastfm<LastfmUserInfoResponse>({
      method: 'user.getInfo',
      user: trimmed,
   })

   return {
      name: data.user.name,
      displayName: data.user.realname?.trim() || data.user.name,
      url: data.user.url,
      playcount: Number(data.user.playcount) || 0,
      image: pickImage(data.user.image),
   }
}

export async function getLastfmTopTracks({
   username,
   period,
   limit = DEFAULT_LIMIT,
   page = 1,
}: {
   username: string
   period?: string | null
   limit?: number
   page?: number
}): Promise<LastfmTopTracksResult> {
   const safePeriod = normalisePeriod(period)
   const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT)
   const safePage = Math.max(Math.floor(page), 1)

   try {
      const user = await getLastfmUser(username)
      const data = await fetchLastfm<LastfmTopTracksResponse>({
         method: 'user.getTopTracks',
         user: user.name,
         period: safePeriod,
         limit: safeLimit,
         page: safePage,
      })

      const rawTracks = Array.isArray(data.toptracks.track) ? data.toptracks.track : [data.toptracks.track]
      const tracks = rawTracks.filter(Boolean).map(normaliseTrack)
      const total = Number(data.toptracks['@attr']?.total) || tracks.length
      const totalPages = Number(data.toptracks['@attr']?.totalPages) || safePage

      if (!tracks.length && safePage === 1) {
         return emptyTopTracksResult({
            user,
            period: safePeriod,
            limit: safeLimit,
            page: safePage,
            error: 'No public Last.fm top tracks were found for this user and period',
         })
      }

      return {
         user,
         tracks,
         period: safePeriod,
         total,
         page: safePage,
         perPage: safeLimit,
         hasMore: safePage < totalPages && tracks.length > 0,
      }
   } catch (err) {
      if (err instanceof ExpectedLastfmError) {
         return emptyTopTracksResult({
            user: null,
            period: safePeriod,
            limit: safeLimit,
            page: safePage,
            error: err.message,
         })
      }
      throw err
   }
}

function normaliseTrack(track: LastfmTopTrackResponse, index: number): LastfmTrack {
   return {
      rank: Number(track['@attr']?.rank) || index + 1,
      name: track.name,
      artist: track.artist.name,
      playcount: Number(track.playcount) || 0,
      url: track.url,
      image: pickImage(track.image),
   }
}
