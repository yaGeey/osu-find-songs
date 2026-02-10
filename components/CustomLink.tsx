import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { twMerge } from 'tailwind-merge'

export default function CustomLink({
   className,
   href,
   disabled,
   showIcon,
   ...props
}: React.HTMLAttributes<HTMLAnchorElement> & { href: string; disabled?: boolean; showIcon?: boolean }) {
   return (
      <a
         href={href}
         target="_blank"
         {...props}
         className={twMerge(
            // 'hover:text-main-gray focus:text-main-gray after:bg-main-gray/80',
            'relative inline-block bg-transparent text-base cursor-pointer no-underline',
            'transition-colors duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)]',
            'hover:text-black focus:text-black outline-none',
            "after:content-[''] after:absolute after:bottom-[-2px] after:left-1/2 after:w-0 after:h-[2px] after:bg-black/80 after:pointer-events-none",
            'after:transition-all after:duration-400 after:ease-[cubic-bezier(0.25,0.8,0.25,1)]',
            'hover:after:w-full hover:after:left-0 focus:after:w-full focus:after:left-0',
            disabled && 'pointer-events-none opacity-50',
            className,
         )}
      >
         {props.children}
         {showIcon && <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs ml-1.5" />}
      </a>
   )
}
