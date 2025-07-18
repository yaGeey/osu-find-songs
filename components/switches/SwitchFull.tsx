'use client'
import { twMerge as tw } from 'tailwind-merge'
import { useEffect, useState } from 'react'
import CursorBtn from './CursorBtn'

export default function SwitchFull({
   options,
   onChange,
   disabled = false,
   required = false,
   defaultValue,
   className,
}: {
   options: string[]
   onChange: (value: string) => void
   disabled?: boolean
   required?: boolean
   defaultValue?: number
   className?: string
}) {
   const [isDisabled, setIsDisabled] = useState(disabled)
   const [selection, setSelection] = useState<string | null>(defaultValue ? options[defaultValue] : null)
   useEffect(() => {
      if (isDisabled) onChange('')
      else onChange(selection || '')
   }, [selection, isDisabled])

   return (
      <div
         className={tw(
            'font-inter-tight border-2 border-[#733F3F] rounded-full flex items-center gap-1 h-[26px] cursor-pointer',
            isDisabled && 'brightness-60',
            !required && 'pl-1.5 bg-white-50 ',
            className,
         )}
         onClick={() => isDisabled && setIsDisabled(false)}
      >
         {!required && <CursorBtn setIsDisabled={setIsDisabled} isDisabled={isDisabled} />}

         <div className="bg-darker/80 text white h-full p-1 rounded-full flex items-center gap-2.5 px-2.5 select-none">
            {options.map((option, index) => (
               <button
                  key={index}
                  className={tw(
                     'cursor-pointer mb-0.5 text-sm hover:selected transition-all',
                     isDisabled && 'pointer-events-none',
                     selection == option && 'selected',
                  )}
                  onClick={() => setSelection(option)}
               >
                  {option}
               </button>
            ))}
         </div>
      </div>
   )
}
