import React, { useState, useRef, useEffect, use } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faAdd, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FilterOption, options, SelectedOption, Filter } from './FilterOptions'
import DropdownInput from './bricks/DropdownInput'
import DropdownFilterSelect from './bricks/DropdownFilterSelect'
import DropdownValueInput from './bricks/DropdownValueInput'

export default function DropdownFilterMultiDropdownFilter({
   onSelected,
   disabled = false,
}: {
   onSelected: (options: SelectedOption[]) => void
   disabled?: boolean
}) {
   const [query, setQuery] = useState('')
   const [value, setValue] = useState<number | string>('')
   const [selected, setSelected] = useState<SelectedOption[]>([])
   const [isOpen, setIsOpen] = useState(false)
   const [filter, setFilter] = useState<Filter>('>')

   const containerRef = useRef<HTMLDivElement>(null)
   const filtered = options.filter((opt) => opt.label.join(' ').toLowerCase().includes(query.toLowerCase()))
   const selectedOption = options.find((opt) => opt.label.some((label) => label.toLowerCase() === query.toLowerCase()))

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

   useEffect(() => onSelected(selected), [selected])

   return (
      <div
         className={tw('input-parent', disabled && 'brightness-75 pointer-events-none')}
         onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (query && value) addItem()
            else setQuery(filtered[0].label[0])
            setIsOpen(false)
         }}
      >
         <DropdownInput query={query} setQuery={setQuery} isOpen={isOpen} setIsOpen={setIsOpen} placeholder="Select filters" />
         <DropdownFilterSelect filter={filter} setFilter={setFilter} />
         <DropdownValueInput selectedOption={selectedOption} value={value} setValue={setValue} />

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
