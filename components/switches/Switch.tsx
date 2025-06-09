'use client'
import { twMerge as tw } from 'tailwind-merge'
import { useEffect, useState } from 'react'
import CursorBtn from './CursorBtn'

export default function Switch({
   options,
   onChange,
   disabled = false,
}: {
   options: string[]
   onChange: (value: string) => void
   disabled?: boolean
}) {
   const [isDisabled, setIsDisabled] = useState(disabled)
   const [selection, setSelection] = useState(options[0])

   function handleIncrease() {
      const index = options.indexOf(selection) + 1
      if (index >= options.length) return
      setSelection(options[index])
      onChange(options[index])
   }
   function handleDecrease() {
      const newIndex = options.indexOf(selection) - 1
      if (newIndex < 0) return
      setSelection(options[newIndex])
      onChange(options[newIndex])
   }

   useEffect(() => {
      if (isDisabled) onChange('')
      else onChange(selection || '')
   }, [selection, isDisabled])

   return (
      <div
         className={tw(
            'w-[150px] bg-white-50 font-inter-tight border-2 border-[#733F3F] rounded-full flex items-center gap-1 h-[26px] pl-1.5',
            isDisabled && 'brightness-60 cursor-pointer',
         )}
         onClick={() => isDisabled && setIsDisabled(false)}
      >
         <CursorBtn setIsDisabled={setIsDisabled} isDisabled={isDisabled} />
         <div className="bg-darker/80 text white h-full p-1 rounded-full flex items-center gap-2.5 px-2.5 select-none flex-1 justify-between">
            <button
               className={tw(
                  'cursor-pointer mb-0.5 hover:selected transition-all',
                  isDisabled && 'pointer-events-none',
                  options.indexOf(selection) == 0 && 'text-black/50 pointer-events-none',
               )}
               onClick={() => handleDecrease()}
            >
               &lt;
            </button>
            <span className="selected text-sm truncate max-w-[60px]">{selection}</span>
            <button
               className={tw(
                  'cursor-pointer mb-0.5 hover:selected transition-all',
                  isDisabled && 'pointer-events-none',
                  options.indexOf(selection) == options.length - 1 && 'text-black/50 pointer-events-none',
               )}
               onClick={() => handleIncrease()}
            >
               &gt;
            </button>
         </div>
      </div>
   )
}
