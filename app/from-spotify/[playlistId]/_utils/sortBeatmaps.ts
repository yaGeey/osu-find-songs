import { BeatmapSet } from "@/types/Osu"

const sortFn = (sortQuery: string) => (a: BeatmapSet, b: BeatmapSet) => {
   if (!sortQuery) return 0
   const [sort, order] = sortQuery.split('_')

   const sign = order === 'asc' ? 1 : -1
   if (sort === 'title') return sign * a.title.localeCompare(b.title)
   if (sort === 'artist') return sign * a.artist.localeCompare(b.artist)
   if (sort === 'difficulty')
      return (
         sign *
         (Math.max(...a.beatmaps.map((beatmap) => beatmap.difficulty_rating)) -
            Math.max(...b.beatmaps.map((beatmap) => beatmap.difficulty_rating)))
      )
   if (sort === 'ranked') {
      if (!a.ranked_date) return 1
      if (!b.ranked_date) return -1
      return sign * (new Date(a.ranked_date).getTime() - new Date(b.ranked_date).getTime())
   }
   if (sort === 'plays') return sign * (a.play_count - b.play_count)
   if (sort === 'favorites') return sign * (a.favourite_count - b.favourite_count)
   return 0
}
export default sortFn