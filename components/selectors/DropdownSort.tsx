import React, { useEffect, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import DropdownInput from './bricks/DropdownInput'
import DropdownFilterSelect from './bricks/DropdownFilterSelect'
import DropdownValueInput from './bricks/DropdownValueInput'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDownWideShort, faArrowUpShortWide } from '@fortawesome/free-solid-svg-icons'
import { sortOptions as options } from '@/utils/selectOptions'

export default function DropdownSort({
   onSelected,
   disabled,
}: {
   onSelected: ({ query, order }: { query: string; order: 'asc' | 'desc' }) => void
   disabled?: boolean
}) {
   const [query, setQuery] = useState('')
   const [isOpen, setIsOpen] = useState(false)
   const [order, setOrder] = useState<'asc' | 'desc'>('asc')

   const filtered = options.filter((opt) => opt.label.join(' ').toLowerCase().includes(query.toLowerCase()))
   const selectedOption = options.find((opt) => opt.label.some((label) => label.toLowerCase() === query.toLowerCase()))

   useEffect(() => {
      if (query === '') onSelected({ query: 'no', order })
      else if (selectedOption) onSelected({ query: selectedOption.value, order })
   }, [query, selectedOption, order])

   return (
      <div
         className={tw('input-parent-no-padding pl-1.5', disabled && 'brightness-75 pointer-events-none')}
         onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (isOpen && filtered.length > 0 && !selectedOption) {
               setQuery(filtered[0].label[0])
               setIsOpen(false)
            }
         }}
      >
         <DropdownInput
            query={query}
            setQuery={setQuery}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            placeholder="Sort by"
            options={options}
            width={110}
         />

         <div className="bg-main-subtle h-full p-1 rounded-full flex items-center gap-1.5 px-1.5 select-none text-white">
            <button
               className={tw('cursor-pointer hover:selected transition-all', order == 'asc' && 'selected')}
               onClick={() => setOrder('asc')}
            >
               <FontAwesomeIcon icon={faArrowUpShortWide} />
            </button>
            <button
               className={tw('cursor-pointer hover:selected transition-all', order == 'desc' && 'selected')}
               onClick={() => setOrder('desc')}
            >
               <FontAwesomeIcon icon={faArrowDownWideShort} />
            </button>
         </div>
      </div>
   )
}
