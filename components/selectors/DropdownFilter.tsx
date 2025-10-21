import React, { useState, useRef, useEffect } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FilterOption, options, Filter } from './FilterOptions'

export default function DropdownFilter({
   onSelected,
}: {
   onSelected: ({ option, filter, value }: { option: FilterOption; filter: Filter; value: number | string }) => void
}) {
   const [query, setQuery] = useState('')
   const [value, setValue] = useState<number | string>('')
   const [isOpen, setIsOpen] = useState(false)
   const [filter, setFilter] = useState<Filter>('>')

   const containerRef = useRef<HTMLDivElement>(null)
   const filtered = options.filter((opt) => opt.label.join(' ').toLowerCase().includes(query.toLowerCase()))
   const selectedOption = options.find((opt) => opt.label.includes(query))

   const handleSelect = (opt: FilterOption) => {
      setQuery(opt.label[0])
      setIsOpen(false)
   }

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false)
         }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
   }, [])

   return (
      <div
         className={tw(
            'border-2 border-main-border bg-white-50 rounded-full flex items-center gap-1 px-1.5 w-fit h-[26px] transition-all text-sm',
         )}
         onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (query && value) onSelected({ option: selectedOption!, filter, value })
            else handleSelect(filtered[0])
         }}
      >
         <div ref={containerRef} className="relative flex h-full z-100">
            <input
               type="text"
               value={query}
               onChange={(e) => {
                  setQuery(e.target.value)
                  setIsOpen(true)
               }}
               onFocus={() => setIsOpen(true)}
               className="text-center outline-hidden"
               placeholder="Select filter"
               style={{ width: '150px', paddingLeft: '18px' }}
            />
            <div className="absolute h-full text-main-gray flex items-center justify-center">
               {query && <FontAwesomeIcon icon={faXmark} onClick={() => setQuery('')} />}
               {!isOpen && !query && <FontAwesomeIcon icon={faArrowDown} onClick={() => setIsOpen((p) => !p)} />}
               {isOpen && !query && <FontAwesomeIcon icon={faArrowUp} onClick={() => setIsOpen((p) => !p)} />}
            </div>
            {isOpen && filtered.length > 0 && (
               <ul className="absolute left-0 right-0 top-1 mt-6 border-2 border-main-border bg-white-50 rounded-md z-10">
                  {filtered.map((opt) => (
                     <li
                        key={opt.value}
                        onClick={() => handleSelect(opt)}
                        className="px-2 py-0.5 hover:bg-gray-200 cursor-pointer text-[15px]"
                        onMouseDown={(e) => e.preventDefault()}
                     >
                        {opt.label[0]}
                     </li>
                  ))}
               </ul>
            )}
         </div>

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

         <input
            type={selectedOption?.isDate ? 'date' : 'number'}
            value={value}
            onChange={(e) => {
               const val = e.target.value
               if (selectedOption?.isDate) setValue(val)
               else setValue(val === '' ? '' : parseFloat(val))
            }}
            placeholder="Value"
            className="bg-transparent text-center outline-hidden text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ width: selectedOption?.isDate ? 'fit-content' : '50px' }}
            min={0}
            step={0.5}
         />
      </div>
   )
}
