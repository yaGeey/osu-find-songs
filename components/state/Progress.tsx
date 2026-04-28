import { twMerge as tw } from 'tailwind-merge'
import ProgressBase from './ProgressBase'
import useProgressVariant from '@/hooks/useProgressVariant'

type ProgressProps = {
   isVisible?: boolean
   value: number
   isError?: boolean
   children?: React.ReactNode
   color?: string
   defaultVariant?: 'determinate' | 'indeterminate'
}

export default function Progress({
   isVisible = true,
   value,
   isError = false,
   children,
   color = 'text-accent',
   defaultVariant = 'determinate',
}: ProgressProps) {
   const variant = useProgressVariant(value, defaultVariant)
   if (!isVisible) return <div className="h-0.75 fixed top-0 bg-main-darker w-screen z-1000"></div>
   return (
      <div className="overflow-hidden fixed top-0 left-0 h-0.75 z-1000 w-full">
         <ProgressBase value={value} indeterminate={variant === 'indeterminate'} color={color} />
         <div
            className={tw(
               'absolute top-0.75 right-0 z-1000 bg-accent/30 text-gray-800 text-xs px-1 rounded-bl-sm min-w-[100px] text-end',
               isError && 'bg-error',
            )}
         >
            {children}
         </div>
      </div>
   )
}

export function ProgressInline({ value, isError = false, color = 'text-accent', defaultVariant = 'determinate' }: ProgressProps) {
   const variant = useProgressVariant(value, defaultVariant)
   return <ProgressBase value={value} indeterminate={variant === 'indeterminate'} color={isError ? 'bg-error' : color} />
}
