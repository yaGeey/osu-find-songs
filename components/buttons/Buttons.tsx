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
            'no-jump select-none  _bg-linear-to-br _from-main-dark _to-main-dark-vivid text-white px-4 py-1 text-nowrap bg-main-dark-vivid border-2 border-main-border rounded-xl flex justify-center items-center gap-1 transition-all',
            'enabled:hover:-translate-y-[1px] enabled:hover:shadow-[0_1px_0_0_var(--color-main-border)] enabled:hover:brightness-110',
            'disabled:brightness-80 enabled:active:brightness-90 enabled:active:scale-98',
            className,
         )}
      >
         <span className={textClassName}>{children}</span>
      </button>
   )
}
// bg-gradient-to-br from-success/70 to-success
