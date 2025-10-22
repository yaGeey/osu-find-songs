import { useEffect, useState } from 'react'
import { type FilterOption } from './FilterOptions'
import DropdownInput from './bricks/DropdownInput'
import { twMerge as tw } from 'tailwind-merge'

export default function Dropdown({
   onSelected,
   placeholder,
   options,
   disabled,
   width = 130,
}: {
   onSelected: (option: FilterOption) => void
   placeholder: string
   options: FilterOption[]
   disabled?: boolean
   width?: number
}) {
   const [query, setQuery] = useState('')
   const [isOpen, setIsOpen] = useState(false)
   const filtered = options.filter((opt) => [opt.label].flat().join(' ').toLowerCase().includes(query.toLowerCase()))
   const selectedOption = options.find((opt) => opt.label.some((label) => label.toLowerCase() === query.toLowerCase()))

   useEffect(() => {
      if (query === '') onSelected({ value: 'no', label: [''] })
      else if (selectedOption) onSelected(selectedOption)
   }, [query, selectedOption])

   return (
      <div
         className={tw('input-parent', disabled && 'brightness-75 pointer-events-none')}
         tabIndex={0}
         onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (filtered.length > 0 && !selectedOption) {
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
            placeholder={placeholder}
            options={options}
            width={width}
         />
      </div>
   )
}
