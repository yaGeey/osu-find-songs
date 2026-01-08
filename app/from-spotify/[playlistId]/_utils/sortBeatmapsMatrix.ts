import { BeatmapSet } from '@/types/Osu'
export const sortBeatmapsMatrix = (a: BeatmapSet[], b: BeatmapSet[], sortFnName: string) => {
   const [name, order] = sortFnName.split('_')
   const sign = order === 'asc' ? 1 : -1

   switch (name) {
      case 'title':
         return sign * a[0].title.localeCompare(b[0].title)
      case 'artist':
         return sign * a[0].artist.localeCompare(b[0].artist)
      case 'difficulty':
         if (order === 'asc')
            return (
               Math.min(...a[0].beatmaps.map((beatmap) => beatmap.difficulty_rating)) -
               Math.min(...b[0].beatmaps.map((beatmap) => beatmap.difficulty_rating))
            )
         if (order === 'desc')
            return (
               Math.max(...b[0].beatmaps.map((beatmap) => beatmap.difficulty_rating)) -
               Math.max(...a[0].beatmaps.map((beatmap) => beatmap.difficulty_rating))
            )
      // TODO don't work
      case 'date ranked':
         if (!a[0].ranked_date) return 1
         if (!b[0].ranked_date) return -1
         return sign * (new Date(a[0].ranked_date).getTime() - new Date(b[0].ranked_date).getTime())
      case 'date submitted':
         return sign * (new Date(a[0].submitted_date).getTime() - new Date(b[0].submitted_date).getTime())
      case 'rating':
         return sign * (a[0].rating - b[0].rating)
      case 'plays':
         return sign * (a[0].play_count - b[0].play_count)
      case 'favorites':
         return sign * (a[0].favourite_count - b[0].favourite_count)
      case 'date in playlist':
         return sign
      default:
         return 0
   }
}
