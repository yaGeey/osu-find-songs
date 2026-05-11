'use client'
import SwitchFullDict from '@/components/switches/SwitchFullDict'
import SwitchSort from '@/components/switches/SwitchSort'
import { useQueryState } from 'nuqs'
import DropdownFilterMulti from '@/components/selectors/DropdownFilterMulti'
import { SelectedOption } from '@/components/selectors/FilterOptions'
import Search from './Search'
import { LastfmPeriod } from '@/types/lastfm'

const periodOptions: Record<string, LastfmPeriod> = {
   overall: 'overall',
   '7 days': '7day',
   '1 month': '1month',
   '3 months': '3month',
   '6 months': '6month',
   '12 months': '12month',
}

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
   const [s, setS] = useQueryState('s', { defaultValue: 'any' })
   const [sort, setSort] = useQueryState('sort', { defaultValue: 'lastfm rank_asc' })
   const [period, setPeriod] = useQueryState('period', { defaultValue: 'overall' })
   const defaultPeriodLabel = Object.entries(periodOptions).find(([, value]) => value === period)?.[0] || 'overall'

   return (
      <div className="relative flex flex-col gap-3 text-[15px]">
         {/* Main filters */}
         <div className="flex justify-between ">
            <div className="flex items-center gap-6.5">
               <h4 className="font-outline-sm">Mode</h4>
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
                  disabled={disabled}
               />
            </div>
            <Search onSearch={onSearch} disabled={disabled} />
         </div>
         <section className="flex items-center gap-7.5">
            <h4 className="font-outline-sm">Period</h4>
            <SwitchFullDict
               className="font-inter"
               required
               defaultValue={defaultPeriodLabel}
               options={periodOptions}
               onChange={(val) => setPeriod(val)}
               disabled={disabled}
            />
         </section>
         <section className="flex items-center gap-7.5">
            <h4 className="font-outline-sm">State</h4>
            <SwitchFullDict
               className="font-inter"
               required
               defaultValue={s === 'leaderboard' ? 'has leaderboard' : s}
               options={{
                  any: 'any',
                  'has leaderboard': 'leaderboard',
                  ranked: 'ranked',
                  loved: 'loved',
                  approved: 'approved',
                  pending: 'pending',
               }}
               onChange={(val) => setS(val)}
               disabled={disabled}
            />
         </section>
         <section className="flex items-center gap-5.5">
            <h4 className="font-outline-sm">Filters</h4>
            <DropdownFilterMulti onSelected={(opt) => onFilterChange(opt)} disabled={disabled} />
         </section>
         <section className="flex items-center gap-4">
            <h4 className="font-outline-sm">Sort by</h4>
            <SwitchSort
               options={['lastfm rank', 'title', 'artist', 'difficulty', 'date submitted', 'rating', 'plays', 'favorites']}
               onChange={(val, sort) => {
                  if (val) setSort(`${val}_${sort}`)
               }}
               defaultOption={sort.split('_')[0]}
               defaultSort={sort.split('_')[1] as 'asc' | 'desc'}
               disabled={disabled}
            />
         </section>
         {foundString && (
            <div className="text-white/80 tracking-wide text-sm leading-tight whitespace-normal">
               {foundString}
            </div>
         )}
      </div>
   )
}
