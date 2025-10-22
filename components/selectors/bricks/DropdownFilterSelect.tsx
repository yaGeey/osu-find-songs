import { Filter } from '../FilterOptions'
import { twMerge as tw } from 'tailwind-merge'

export default function DropdownFilterSelect({
   filter,
   setFilter,
}: {
   filter: Filter
   setFilter: React.Dispatch<React.SetStateAction<Filter>>
}) {
   return (
      <div className="bg-main-subtle h-full p-1 rounded-full flex items-center gap-1.5 px-1.5 select-none text-white">
         <button
            className={tw('cursor-pointer mb-0.5 hover:selected transition-all', filter == '<' && 'selected')}
            onClick={() => setFilter('<')}
         >
            &lt;
         </button>
         <button
            className={tw('cursor-pointer mb-0.5 hover:selected transition-all', filter == '=' && 'selected')}
            onClick={() => setFilter('=')}
         >
            =
         </button>
         <button
            className={tw('cursor-pointer mb-0.5 hover:selected transition-all', filter == '>' && 'selected')}
            onClick={() => setFilter('>')}
         >
            &gt;
         </button>
      </div>
   )
}
