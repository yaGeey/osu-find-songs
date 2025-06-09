'use client'
import { twMerge as tw } from 'tailwind-merge'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons'

export default function SwitchSort({
   options,
   onChange,
   defaultOption = null,
   defaultSort = 'desc',
   ...props
}: {
   onChange: (value: string | null, sort: 'asc' | 'desc') => void
   options: string[]
   defaultOption?: string | null
   defaultSort?: string
}) {
   const [selection, setSelection] = useState<string | null>(defaultOption)
   const [sort, setSort] = useState<'asc' | 'desc'>(defaultSort as 'asc' | 'desc')
   useEffect(() => {
      onChange(selection, sort)
   }, [selection, sort])

   return (
      <div
         {...props}
         data-tooltip-id="sort-tooltip"
         data-tooltip-content="Will result in a refetch"
         data-tooltip-delay-show={500}
         className="bg-darker/80 font-inter border-2 border-[#733F3F] text white h-[26px] p-1 pl-7 rounded-full flex items-center gap-5 px-2.5 select-none"
      >
         {options.map((option, i) => (
            <button
               key={i}
               className={tw(
                  'cursor-pointer flex mb-0.5 text-sm hover:selected transition-all',
                  selection == option && 'selected',
               )}
               onClick={() => {
                  if (selection === option) setSort(sort === 'asc' ? 'desc' : 'asc')
                  else setSort('desc')
                  setSelection(option)
               }}
            >
               {option}
               <div className="text-xs ml-1 ">
                  {sort === 'desc' && selection === option && <FontAwesomeIcon icon={faSortDown} className="mt-1" />}
                  {sort === 'asc' && selection === option && <FontAwesomeIcon icon={faSortUp} className="mt-1" />}
                  {selection !== option && <FontAwesomeIcon icon={faSortDown} className="opacity-0" />}
               </div>
            </button>
         ))}
      </div>
   )
}
