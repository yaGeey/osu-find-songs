import React, { useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { FilterOption, options, Filter } from './FilterOptions'
import DropdownInput from './bricks/DropdownInput'
import DropdownFilterSelect from './bricks/DropdownFilterSelect'
import DropdownValueInput from './bricks/DropdownValueInput'

export default function DropdownFilter({
   onSelected,
}: {
   onSelected: ({ option, filter, value }: { option: FilterOption; filter: Filter; value: number | string }) => void
}) {
   const [query, setQuery] = useState('')
   const [value, setValue] = useState<number | string>('')
   const [isOpen, setIsOpen] = useState(false)
   const [filter, setFilter] = useState<Filter>('>')

   const filtered = options.filter((opt) => opt.label.join(' ').toLowerCase().includes(query.toLowerCase()))
   const selectedOption = options.find((opt) => opt.label.includes(query))

   return (
      <div
         className={tw('input-parent')}
         onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (query && value) onSelected({ option: selectedOption!, filter, value })
            else setQuery(filtered[0].label[0])
         }}
      >
         <DropdownInput query={query} setQuery={setQuery} isOpen={isOpen} setIsOpen={setIsOpen} placeholder="Select filter" />
         <DropdownFilterSelect filter={filter} setFilter={setFilter} />
         <DropdownValueInput selectedOption={selectedOption} value={value} setValue={setValue} />
      </div>
   )
}
