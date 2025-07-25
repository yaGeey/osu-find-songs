import { Track, TrackFull } from './Spotify'
import { BeatmapSet } from './Osu'
import { UseQueryResult } from '@tanstack/react-query'

export type Song = {
   title: string
   author: string
   text: string
   id: string
   image: string
}
export type SongMin = {
   title: string
   author: string
   text: string
}

export type SongData = {
   beatmapset?: BeatmapSet
   spotify?: TrackFull[] | null
   local: Song
}

export type SongDataQueried = {
   beatmapsetQuery: UseQueryResult<BeatmapSet, unknown>
   spotifyQuery: UseQueryResult<TrackFull[] | null, unknown>
   local: Song
}
export type CombinedQueried = {
   local: Song[]
   spotifyQuery: UseQueryResult<(Track[] | null)[], Error>
   osuQuery: UseQueryResult<BeatmapSet[] | null, Error>
}
export type Combined = {
   local: Song[]
   spotify: Track[][]
   osu: BeatmapSet[]
}

// TODO розібратися
type WithLoading<T, LoadingKey extends string, DataKey extends string> =
   | ({ [K in LoadingKey]: false } & { [K in DataKey]: T })
   | ({ [K in LoadingKey]: true } & { [K in DataKey]: undefined })

// add error field
export type CombinedSingle = { local: Song; error?: string } & WithLoading<BeatmapSet, 'isOsuLoading', 'osu'> &
   WithLoading<Track[], 'isSpotifyLoading', 'spotify'>
// TODO fix types
export type CombinedSingleSimple = {
   local: Song
   spotify?: Track[] | null
   osu?: BeatmapSet | null
   isSpotifyLoading: boolean
   isOsuLoading: boolean
   error?: string
}
// export type SongDataQueried = {
//    local: Song[]
//    spotifyQuery: UseQueryResult<Track[][], Error>
//    osuQuery: UseQueryResult<BeatmapSet[], Error>
// }
