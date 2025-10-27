import { BeatmapSet } from '@/types/Osu'
import SearchComponents from '@/components/Search'
import { useEffect, useState } from 'react'

export default function Search({
   beatmapsets,
   onChange,
   disabled = false,
}: {
   beatmapsets: BeatmapSet[][]
   onChange: (beatmapsets: BeatmapSet[][]) => void
   disabled?: boolean
}) {
   const [value, setValue] = useState('')

   useEffect(() => {
      const timer = setTimeout(() => {
         onChange(
            beatmapsets.map((beatmapset) =>
               beatmapset.filter((beatmap) => {
                  if (!value.length) return true
                  const val = value.toLowerCase()
                  return (
                     beatmap.artist.toLowerCase().includes(val) ||
                     beatmap.title.toLowerCase().includes(val) ||
                     beatmap.creator.toLowerCase().includes(val)
                  )
               }),
            ),
         )
      }, 400)
      return () => clearTimeout(timer)
   }, [value, beatmapsets])

   return <SearchComponents value={value} setValue={setValue} width={250} disabled={disabled} />
}
