import React, { useState, useRef, useEffect, use } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faAdd, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FilterOption, options, SelectedOption, Filter } from './FilterOptions'

export default function DropdownFilterMultiDropdownFilter({ onSelected }: { onSelected: (options: SelectedOption[]) => void }) {
   const [query, setQuery] = useState('')
   const [value, setValue] = useState<number | string>('')
   const [selected, setSelected] = useState<SelectedOption[]>([])
   const [isOpen, setIsOpen] = useState(false)
   const [filter, setFilter] = useState<Filter>('>')

   const containerRef = useRef<HTMLDivElement>(null)
   const filtered = options.filter((opt) => opt.label.join(' ').toLowerCase().includes(query.toLowerCase()))
   const selectedOption = options.find((opt) => opt.label.includes(query))

   const handleSelect = (opt: FilterOption) => {
      setQuery(opt.label[0])
      setIsOpen(false)
   }

   const addItem = () => {
      if (!selectedOption || !filter || !value) return
      setSelected((p) => {
         const alreadySelectedIdx = p.findIndex((item) => item.option.value === selectedOption.value)
         let newArr = [...p]
         if (alreadySelectedIdx !== -1) newArr = p.filter((_, i) => i !== alreadySelectedIdx)
         return [...newArr, { option: selectedOption, filter, value }]
      })
      setQuery('')
      setValue('')
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

   useEffect(() => onSelected(selected), [selected])

   return (
      <div
         className={tw(
            'border-2 border-main-border bg-white-50 rounded-full flex items-center gap-1 px-1.5 w-fit h-[26px] transition-all text-sm',
         )}
         onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (query && value) addItem()
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
               className="text-center outline-hidden text-black"
               placeholder="Select filters"
               style={{ width: '130px', paddingLeft: '12px' }}
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
                        className="px-2 py-0.5 hover:bg-gray-200 cursor-pointer text-sm text-main-gray"
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

         {query && !!value && (
            <div onClick={addItem} className="cursor-pointer">
               <FontAwesomeIcon icon={faAdd} className="text-main-gray" />
            </div>
         )}

         {!!selected.length && (
            <div style={{ width: '13px', height: '26px', overflow: 'hidden', marginLeft: '-4px' }}>
               <div
                  className="border-2 rounded-full border-main-border"
                  style={{ width: '26px', height: '26px', marginLeft: '-13px' }}
               ></div>
            </div>
         )}
         <div className="flex text-nowrap truncate font-inter-tight text-sm" style={{ maxWidth: '300px' }}>
            {selected
               .sort(() => -1)
               .map((item, index) => (
                  <div
                     key={index}
                     className="bg-main-accent rounded-full px-1 flex text-main-gray items-center gap-1 cursor-pointer"
                     onClick={() => setSelected((p) => p.filter((_, i) => i !== index))}
                  >
                     <span>
                        {item.option.label[0]} {item.filter} {item.value}
                     </span>
                     <FontAwesomeIcon icon={faXmark} />
                  </div>
               ))}
         </div>
      </div>
   )
}
