'use client'
import { twMerge as tw } from 'tailwind-merge'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSortDown } from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'

export default function SwitchSort({
   options,
   onChange,
   defaultOption = null,
   defaultSort = 'desc',
   disabled = false,
   ...props
}: {
   onChange: (value: string | null, sort: 'asc' | 'desc') => void
   options: string[]
   defaultOption?: string | null
   defaultSort?: string
   disabled?: boolean
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
         className={tw(
            'bg-main-subtle font-inter border-2 border-main-border pl-7 rounded-full flex items-center gap-2 px-2 select-none',
            disabled && 'brightness-75 pointer-events-none',
         )}
      >
         {options.map((option, i) => (
            <button
               key={i}
               className={tw(
                  'cursor-pointer flex mb-0.5 text-sm transition-colors text-white hover:text-accent',
                  selection == option && 'selected',
               )}
               onClick={() => {
                  if (selection === option) setSort(sort === 'asc' ? 'desc' : 'asc')
                  else setSort('desc')
                  setSelection(option)
               }}
            >
               {option}
               <div className="text-xs/[5px] ml-1">
                  <motion.div
                     className="h-full"
                     variants={{ initial: { rotate: 0, opacity: 1 }, flip: { rotate: 180, opacity: 1 }, hidden: { opacity: 0 } }}
                     initial="initial"
                     animate={selection === option ? (sort === 'asc' ? 'flip' : 'initial') : 'hidden'}
                  >
                     <FontAwesomeIcon icon={faSortDown} className="mt-0.5" />
                  </motion.div>
               </div>
            </button>
         ))}
      </div>
   )
}
