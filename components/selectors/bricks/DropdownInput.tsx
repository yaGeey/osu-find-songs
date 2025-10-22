import { useEffect, useRef, useState } from 'react'
import { Filter, FilterOption, options as filterOptions } from '../FilterOptions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faAdd, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'

export default function DropdownInput({
   query,
   setQuery,
   isOpen,
   setIsOpen,
   placeholder,
   options = filterOptions,
   width = 130,
}: {
   query: string
   setQuery: React.Dispatch<React.SetStateAction<string>>
   isOpen: boolean
   setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
   placeholder: string
   options?: FilterOption[]
   width?: number
}) {
   const containerRef = useRef<HTMLDivElement>(null)
   const filtered = options.filter((opt) => opt.label.join(' ').toLowerCase().includes(query.toLowerCase()))

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
            placeholder={placeholder}
            style={{ width, paddingLeft: '12px' }}
         />

         <div className="absolute h-full text-main-gray flex items-center justify-center">
            {query && <FontAwesomeIcon icon={faXmark} onClick={() => setQuery('')} />}
            {!isOpen && !query && <FontAwesomeIcon icon={faArrowDown} onClick={() => setIsOpen((p) => !p)} />}
            {isOpen && !query && <FontAwesomeIcon icon={faArrowUp} onClick={() => setIsOpen((p) => !p)} />}
         </div>

         {isOpen && filtered.length > 0 && (
            <ul className="absolute left-0 right-0 top-1 mt-6 border-2 border-main-border bg-gray-200 rounded-md z-10">
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
   )
}
