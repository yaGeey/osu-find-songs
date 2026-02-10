import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { twMerge } from 'tailwind-merge'

export default function CloseBtn({ onClick, className }: { onClick: () => void; className?: string }) {
   return (
      <FontAwesomeIcon
         icon={faXmark}
         className={twMerge(
            'cursor-pointer bg-main-dark-vivid border-3 border-main-border p-2 px-2.5 rounded-full transition-none hover:brightness-105 hover:scale-105 active:brightness-95 active:scale-95 transition-all',
            className,
         )}
         onClick={onClick}
      />
   )
}
