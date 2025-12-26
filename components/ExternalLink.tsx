import { HTMLAttributes } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

export default function ExternalLink({
   className,
   href,
   disabled,
   ...props
}: HTMLAttributes<HTMLAnchorElement> & { href: string; disabled?: boolean }) {
   return (
      <a
         href={href}
         target="_blank"
         className={tw('hover:underline flex items-center', className, disabled ? 'pointer-events-none opacity-50' : '')}
         {...props}
      >
         {props.children}
         <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs ml-1.5" />
      </a>
   )
}
