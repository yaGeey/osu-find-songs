'use client'
import { twMerge as tw } from 'tailwind-merge'

export default function TextSwitch({
   options,
   selected,
   setSelected,
   className,
}: {
   options: { value: string; label: string | React.ReactNode }[]
   selected: string
   setSelected: (value: string) => void
   className?: string
}) {
   return (
      <div className={`flex ${className}`}>
         {options.map((option) => (
            <button
               key={option.value}
               className={tw(
                  `px-2 py-1 text-sm text-black bg-white first:rounded-l-lg last:rounded-r-lg transition-all duration-300 ease-in-out hover:bg-gray-200`,
                  selected === option.value && 'bg-gray-300',
               )}
               onClick={() => setSelected(option.value)}
            >
               {option.label}
            </button>
         ))}
      </div>
   )
}
