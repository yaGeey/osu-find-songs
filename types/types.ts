import { BeatmapSet, BeatmapSetFromOsu } from './Osu'
import { UseQueryResult } from '@tanstack/react-query'
import { SpotifyTrack } from './graphql-spotify/searchDesktop'
import { ServerSpotifyResponse } from '@/app/api/batch/spotify/route'

export type LocalBeatmap = {
   title: string
   artist: string
   creator: string
   id: string
   // imageURL: string | null
   // imageFile: File | undefined
}

export type CombinedQueried = {
   local: LocalBeatmap[]
   spotifyQuery: UseQueryResult<ServerSpotifyResponse, Error>
   osuQuery: UseQueryResult<BeatmapSetFromOsu[] | null, Error>
}
// TODO розібратися + !NOT USED!
type WithLoading<T, LoadingKey extends string, DataKey extends string> =
   | ({ [K in LoadingKey]: false } & { [K in DataKey]: T })
   | ({ [K in LoadingKey]: true } & { [K in DataKey]: undefined })

// add error field
export type CombinedSingle = { local: LocalBeatmap; error?: string } & WithLoading<BeatmapSetFromOsu, 'isOsuLoading', 'osu'> &
   WithLoading<SpotifyTrack[], 'isSpotifyLoading', 'spotify'>
// TODO fix types
export type CombinedSingleSimple = {
   local: LocalBeatmap
   spotify: number[] | null
   osu: BeatmapSetFromOsu | null
   isSpotifyLoading: boolean
   isOsuLoading: boolean
   error: string | null
}
