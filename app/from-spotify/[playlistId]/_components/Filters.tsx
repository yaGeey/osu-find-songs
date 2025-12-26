'use client'
import SwitchFullDict from '@/app/from-osu/_components/switches/SwitchFullDict'
import SwitchSort from '@/app/from-osu/_components/switches/SwitchSort'
import { useQueryState } from 'nuqs'
import DropdownFilterMulti from '@/components/selectors/DropdownFilterMulti'
import { SelectedOption } from '@/components/selectors/FilterOptions'
import Search from './Search'
// TODO If =1 then res: 1 - 1.99

export default function Filters({
   foundString,
   disabled = false,
   onFilterChange,
   onSearch,
}: {
   foundString?: string
   disabled?: boolean
   onFilterChange: (filters: SelectedOption[]) => void
   onSearch: React.Dispatch<React.SetStateAction<string>>
}) {
   const [m, setM] = useQueryState('m', { defaultValue: '' })
   const [s, setS] = useQueryState('s', { defaultValue: '' })
   const [sort, setSort] = useQueryState('sort', { defaultValue: '' })

   return (
      <div className="relative flex flex-col gap-3 text-[15px]">
         {/* Main filters */}
         <div className="flex justify-between ">
            <div className="flex items-center gap-6.5">
               <h4>Mode</h4>
               <SwitchFullDict
                  className="font-inter"
                  required
                  defaultValue="any"
                  options={{
                     any: '',
                     'osu!': '0',
                     'osu!taiko': '1',
                     'osu!catch': '2',
                     'osu!mania': '3',
                  }}
                  onChange={(val) => setM(val)}
               />
            </div>
            <Search onSearch={onSearch} disabled={disabled} />
         </div>
         <section className="flex items-center gap-7.5">
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
         <section className="flex items-center gap-5.5">
            <h4>Filters</h4>
            <DropdownFilterMulti onSelected={(opt) => onFilterChange(opt)} />
         </section>
         <section className="flex items-center gap-4">
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
            <div className="absolute right-2 bottom-1 text-white tracking-wide text-sm hidden md:block">{foundString}</div>
         )}
      </div>
   )
}
