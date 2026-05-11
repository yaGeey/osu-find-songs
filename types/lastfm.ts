import { BeatmapSet } from './Osu'

export const lastfmPeriods = ['overall', '7day', '1month', '3month', '6month', '12month'] as const

export type LastfmPeriod = (typeof lastfmPeriods)[number]

export type LastfmImage = {
   '#text': string
   size: 'small' | 'medium' | 'large' | 'extralarge'
}

export type LastfmApiError = {
   error: number
   message: string
}

export type LastfmUserInfoResponse = {
   user: {
      name: string
      realname?: string
      url: string
      playcount: string
      image?: LastfmImage[]
   }
}

export type LastfmTopTracksResponse = {
   toptracks: {
      '@attr': {
         user: string
         page: string
         perPage: string
         total: string
         totalPages: string
      }
      track: LastfmTopTrackResponse[] | LastfmTopTrackResponse
   }
}

export type LastfmTopTrackResponse = {
   '@attr'?: {
      rank?: string
   }
   name: string
   playcount: string
   url: string
   artist: {
      name: string
      url: string
   }
   image?: LastfmImage[]
}

export type LastfmTrack = {
   rank: number
   name: string
   artist: string
   playcount: number
   url: string
   image: string | null
}

export type LastfmTopTracksResult = {
   user: LastfmUser | null
   tracks: LastfmTrack[]
   period: LastfmPeriod
   total: number
   page: number
   perPage: number
   hasMore: boolean
   error?: string
}

export type LastfmUser = {
   name: string
   displayName: string
   url: string
   playcount: number
   image: string | null
}

export type LastfmBeatmapSet = BeatmapSet & {
   lastfmRank: number
   lastfmTrack: LastfmTrack
}
