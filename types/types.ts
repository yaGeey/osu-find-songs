import { BeatmapSetFromOsu } from './Osu'

export type LocalBeatmap = {
   title: string
   artist: string
   creator: string
   id: string
   // imageURL: string | null
   // imageFile: File | undefined
}

// TODO fix types
export type CombinedSingleSimple = {
   local: LocalBeatmap
   spotify: number[] | null
   osu: BeatmapSetFromOsu | null
   isSpotifyLoading: boolean
   isOsuLoading: boolean
   error: string | null
}
