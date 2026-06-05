export type Beatmap = {
   accuracy: number
   ar: number
   beatmapset_id: number
   bpm: number
   checksum: string
   convert: boolean
   count_circles: number
   count_sliders: number
   count_spinners: number
   cs: number
   deleted_at: string | null
   difficulty_rating: number
   drain: number
   hit_length: number
   id: number
   is_scoreable: boolean
   last_updated: string
   max_combo: number
   mode: 'osu' | 'taiko' | 'fruits' | 'mania'
   owners: {
      id: number
      username: string
   }[]
   passcount: number
   playcount: number
   ranked: number
   status: Status
   total_length: number
   url: string
   user_id: number
   version: string
}

export type BeatmapSet = {
   artist: string
   covers: {
      cover: string
      'cover@2x': string
      card: string
      'card@2x': string
      list: string
   }
   beatmaps: Beatmap[]
   bpm: number
   // converts: Beatmap[] // TODO
   creator: string
   favourite_count: number
   genre: {
      id: number
      name: string
   }
   id: number
   language: {
      id: number
      name: string
   }
   last_updated: string
   play_count: number
   preview_url: string
   source: string | null
   status: Status
   // tags: string // TODO search tags too
   title: string
   // title_unicode: string // TODO
   video: boolean
   ranked: number
   ranked_date: string | null
   submitted_date: string
   rating: number
}
export type BeatmapSetFromOsu = {
   covers: {
      cover: string
      'card@2x': string
      list: string
   }
   bpm: number
   genre: string
   id: number
   language: string
   submitted_date: string
   rating: number
}

type Status = 'ranked' | 'approved' | 'qualified' | 'loved' | 'pending' | 'graveyard' | 'wip'
