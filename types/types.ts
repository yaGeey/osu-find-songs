import { BeatmapSet } from './Osu'
import { UseQueryResult } from '@tanstack/react-query'
import { SpotifyTrack } from './graphql-spotify/searchDesktop'

export type Song = {
   title: string
   author: string
   text: string
   id: string
   image: string
}
export type CombinedQueried = {
   local: Song[]
   spotifyQuery: UseQueryResult<(SpotifyTrack[] | null)[], Error>
   osuQuery: UseQueryResult<BeatmapSet[] | null, Error>
}
// TODO розібратися + !NOT USED!
type WithLoading<T, LoadingKey extends string, DataKey extends string> =
   | ({ [K in LoadingKey]: false } & { [K in DataKey]: T })
   | ({ [K in LoadingKey]: true } & { [K in DataKey]: undefined })

// add error field
export type CombinedSingle = { local: Song; error?: string } & WithLoading<BeatmapSet, 'isOsuLoading', 'osu'> &
   WithLoading<SpotifyTrack[], 'isSpotifyLoading', 'spotify'>
// TODO fix types
export type CombinedSingleSimple = {
   local: Song
   spotify: SpotifyTrack[] | null
   osu: BeatmapSet | null
   isSpotifyLoading: boolean
   isOsuLoading: boolean
   error: string | null
}
