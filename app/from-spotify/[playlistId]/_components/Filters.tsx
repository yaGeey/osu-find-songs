'use client'
import SwitchFullDict from '@/app/from-osu/_components/switches/SwitchFullDict'
import SwitchSort from '@/app/from-osu/_components/switches/SwitchSort'
import { twMerge as tw } from 'tailwind-merge'
import { useQueryState } from 'nuqs'
import DropdownFilterMulti from '@/components/selectors/DropdownFilterMulti'
import { SelectedOption } from '@/components/selectors/FilterOptions'
// TODO If =1 then res: 1 - 1.99

export default function Filters({
   foundString,
   disabled = false,
   onFilterChange,
}: {
   foundString?: string
   disabled?: boolean
   onFilterChange: (filters: SelectedOption[]) => void
}) {
   const [m, setM] = useQueryState('m', { defaultValue: '' })
   const [s, setS] = useQueryState('s', { defaultValue: '' })
   const [sort, setSort] = useQueryState('sort', { defaultValue: '' })
   // useEffect(() => { if (sort) setSort('') }, []) //? don't work, don't know why it's not clearing

   return (
      <div
         className={tw(
            'bg-main-dark z-110 sticky top-[56px] px-5 py-2 text-white shadow-tight text-nowrap border-b-2 border-b-main-border ',
         )}
      >
         {/* Main filters */}
         <div className="flex justify-between text-[15px]">
            <div className="flex items-center gap-6.5 text-[15px]">
               <h4>Mode</h4>
               <SwitchFullDict
                  className="font-inter"
                  options={{
                     'osu!': '0',
                     'osu!taiko': '1',
                     'osu!catch': '2',
                     'osu!mania': '3',
                  }}
                  onChange={(val) => setM(val)}
               />
            </div>
         </div>
         <section className="flex items-center gap-7.5 mt-3 text-[15px]">
            <h4>State</h4>
            <SwitchFullDict
               className="font-inter"
               required
               defaultValue="has leaderboard"
               options={{
                  any: 'any',
                  'has leaderboard': '',
                  ranked: 'ranked',
                  loved: 'loved',
                  approved: 'approved',
                  pending: 'pending',
               }}
               onChange={(val) => setS(val)}
            />
         </section>
         <section className="flex items-center gap-5.5 mt-3 text-[15px]">
            <h4>Filters</h4>
            <DropdownFilterMulti onSelected={(opt) => onFilterChange(opt)} />
         </section>
         <section className="flex items-center gap-4 mt-3 text-[15px]">
            <h4>Sort by</h4>
            <SwitchSort
               options={['title', 'artist', 'difficulty', 'date ranked', 'rating', 'plays', 'favorites', 'date added']}
               onChange={(val, sort) => {
                  if (val) setSort(`${val}_${sort}`)
               }}
               defaultOption={sort.split('_')[0]}
               defaultSort={sort.split('_')[1] as 'asc' | 'desc'}
               disabled={disabled}
            />
         </section>
         {foundString && !disabled && (
            <div className="absolute animate-in fade-in right-4 bottom-2 text-white/70 font-outline-sm tracking-wider text-sm hidden lg:block">
               {foundString} <span className="text-sm">found</span>
            </div>
         )}
      </div>
   )
}
