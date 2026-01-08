import { BeatmapSet } from '@/types/Osu'

// ['title', 'artist', 'difficulty', 'date ranked', 'rating', 'plays', 'favorites', 'date added']
const sortFn = (sortQuery: string) => (a: BeatmapSet, b: BeatmapSet) => {
   if (!sortQuery) return 0
   const [sort, order] = sortQuery.split('_')
   const sign = order === 'asc' ? 1 : -1

   switch (sort) {
      case 'title':
         return sign * a.title.localeCompare(b.title)
      case 'artist':
         return sign * a.artist.localeCompare(b.artist)
      case 'difficulty':
         return (
            sign *
            (Math.max(...a.beatmaps.map((beatmap) => beatmap.difficulty_rating)) -
               Math.max(...b.beatmaps.map((beatmap) => beatmap.difficulty_rating)))
         )
      case 'date ranked':
         if (!a.ranked_date) return 1
         if (!b.ranked_date) return -1
         return sign * (new Date(a.ranked_date).getTime() - new Date(b.ranked_date).getTime())
      case 'date submitted':
         return sign * (new Date(a.submitted_date).getTime() - new Date(b.submitted_date).getTime())
      case 'plays':
         return sign * (a.play_count - b.play_count)
      case 'favorites':
         return sign * (a.favourite_count - b.favourite_count)
      default:
         return 0
   }
}
export default sortFn
