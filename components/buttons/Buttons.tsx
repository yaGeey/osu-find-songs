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
            'no-jump _bg-linear-to-br _from-main-dark _to-main-dark-vivid text-white px-4 py-1 text-nowrap bg-main-dark-vivid border-2 border-main-border rounded-xl flex justify-center items-center gap-1 transition-all',
            'hover:-translate-y-[1px] hover:shadow-[0_1px_0_0_var(--color-main-border)] hover:brightness-110',
            'disabled:brightness-80 active:brightness-90 active:scale-98',
            className,
         )}
      >
         <span className={textClassName}>{children}</span>
      </button>
   )
}
// bg-gradient-to-br from-success/70 to-success
