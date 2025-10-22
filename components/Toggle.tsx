import { twMerge as tw } from 'tailwind-merge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'

export default function Toggle({
   value,
   setValue,
   disabled = false,
   text,
   width,
}: {
   value: boolean
   setValue: React.Dispatch<React.SetStateAction<boolean>>
   disabled?: boolean
   text: { on: string; off: string }
   width?: number
}) {
   return (
      <div
         className={tw('input-parent flex', disabled && 'brightness-75 pointer-events-none')}
         onClick={() => setValue((p) => !p)}
         style={{ width }}
      >
         <span className="flex-grow text-center text-nowrap">{value ? text.on : text.off}</span>
         <div style={{ width: '13px', height: '26px', overflow: 'hidden', marginRight: '-9px' }}>
            <div className="border-2 rounded-full border-main-border" style={{ width: '26px', height: '26px' }}></div>
         </div>
         <div className="text-main-gray">{value ? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faXmark} />}</div>
      </div>
   )
}
