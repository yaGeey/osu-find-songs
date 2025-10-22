import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { twMerge as tw } from 'tailwind-merge'

export default function Search({
   value,
   setValue,
   placeholder = 'Search',
   width = 200,
   disabled,
}: {
   value: string
   setValue: React.Dispatch<React.SetStateAction<string>>
   placeholder?: string
   width?: number
   disabled?: boolean
}) {
   return (
      <div className={tw('input-parent', disabled && 'brightness-75 pointer-events-none')} style={{ width }}>
         <div className="h-full text-main-gray flex items-center justify-center">
            <FontAwesomeIcon icon={faSearch} />
         </div>

         <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-center outline-hidden text-black w-full"
            placeholder={placeholder}
         />
      </div>
   )
}
