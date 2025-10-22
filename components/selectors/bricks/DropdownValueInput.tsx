import { FilterOption } from '../FilterOptions'
import { useEffect } from 'react'

export default function DropdownValueInput({
   selectedOption,
   value,
   setValue,
}: {
   selectedOption: FilterOption | undefined
   value: number | string
   setValue: React.Dispatch<React.SetStateAction<string | number>>
}) {
   // Reset value when option type changes (date <-> number)
   useEffect(() => {
      setValue('')
   }, [selectedOption?.isDate])

   return (
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
         style={{ width: selectedOption?.isDate ? '130px' : '50px' }}
         min={0}
         step={0.5}
      />
   )
}
