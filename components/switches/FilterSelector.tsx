'use client';
import { twMerge as tw } from 'tailwind-merge';
import { useEffect, useState } from 'react';
import CursorBtn from './CursorBtn';

type Filter = '<' | '=' | '>' | '';
interface BaseProps {
   type: 'number' | 'date';
   onChange: (value: string, filter: Filter) => void;
   disabled?: boolean;
}
interface Number extends BaseProps {
   type: 'number';
   min: number;
   max: number;
   step?: number;
}
interface Date extends BaseProps {
   type: 'date';
   min?: never;
   max?: never;
   step?: never;
}
type Props = Number | Date;

export default function FilterSelector({ onChange, disabled = false, max, min, step = 1, type }: Props) {
   const [filter, setFilter] = useState<Filter>('>');
   const [value, setValue] = useState<string | null>(null);
   const [isDisabled, setIsDisabled] = useState(disabled);
   useEffect(() => {
      if (isDisabled) {
         onChange('', '');
         return;
      }
      if (value) onChange(value, filter);
   }, [filter, value, isDisabled]);

   return (
      <div
         className={tw(
            'bg-white-50 border-2 border-[#733F3F] rounded-full flex items-center gap-1 h-[26px] px-1.5',
            isDisabled && 'brightness-60 cursor-pointer',
         )}
         onClick={() => isDisabled && setIsDisabled(false)}
      >
         <CursorBtn setIsDisabled={setIsDisabled} isDisabled={isDisabled} />

         <div className="bg-darker/80 text white h-full p-1 rounded-full flex items-center gap-1.5 px-1.5 select-none">
            <button
               className={tw(
                  'cursor-pointer mb-0.5 hover:selected transition-all',
                  isDisabled && 'pointer-events-none',
                  filter == '<' && 'selected',
               )}
               onClick={() => setFilter('<')}
            >
               &lt;
            </button>
            <button
               className={tw(
                  'cursor-pointer mb-0.5 hover:selected transition-all',
                  isDisabled && 'pointer-events-none',
                  filter == '=' && 'selected',
               )}
               onClick={() => setFilter('=')}
            >
               =
            </button>
            <button
               className={tw(
                  'cursor-pointer mb-0.5 hover:selected transition-all',
                  isDisabled && 'pointer-events-none',
                  filter == '>' && 'selected',
               )}
               onClick={() => setFilter('>')}
            >
               &gt;
            </button>
         </div>
         {type == 'date' ? (
            <input
               type="date"
               onChange={(e) => setValue(e.target.value)}
               className={tw(
                  'w-[100px] font-inter-tight text-sm bg-transparent text-center outline-hidden text-black [appearance:textfield] [&::-webkit-calendar-picker-indicator]:appearance-none',
                  isDisabled && 'pointer-events-none',
               )}
               max={max}
               min={min}
            />
         ) : (
            <input
               type="number"
               step={step}
               onChange={(e) => setValue(e.target.value)}
               defaultValue={0}
               className={tw(
                  'w-[55px] bg-transparent text-center outline-hidden text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  isDisabled && 'pointer-events-none',
               )}
               max={max}
               min={min}
            />
         )}
      </div>
   );
}
