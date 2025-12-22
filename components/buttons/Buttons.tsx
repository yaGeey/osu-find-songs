import { ButtonHTMLAttributes, Ref } from 'react'
import { twMerge as tw } from 'tailwind-merge'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
   ref?: Ref<HTMLButtonElement>
   textClassName?: string
}
export function Button({ onClick, ref, className, textClassName, children, ...props }: BtnProps) {
   return (
      <button
         onClick={onClick}
         ref={ref}
         {...props}
         className={tw(
            'hover:-translate-y-0.5 text-white px-4 py-1.5 text-nowrap bg-main-dark-vivid border-2 border-main-border rounded-xl flex justify-center items-center gap-1 hover:shadow-md transition-all hover:brightness-110 disabled:brightness-75 active:brightness-90',
            className,
         )}
      >
         <span className={textClassName}>{children}</span>
      </button>
   )
}
