import { motion } from 'framer-motion'
import { twJoin, twMerge } from 'tailwind-merge'

type ProgressBaseProps = {
   color: string
   className?: string
   disableAnimation?: boolean
} & ({ indeterminate?: false; value: number } | { indeterminate: true; value?: number })

const ProgressBase = ({ value, indeterminate = false, color, className, disableAnimation }: ProgressBaseProps) => {
   return (
      <div className={twMerge('h-1 w-full overflow-hidden relative', className)}>
         <div className={twJoin('absolute h-full w-full opacity-35', color)} />
         {indeterminate ? (
            <motion.div
               className={twJoin('absolute inset-y-0 left-0 w-1/2', color)}
               initial={{ x: '-100%' }}
               animate={{ x: '200%' }}
               transition={{ duration: disableAnimation ? 0 : 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
         ) : (
            <motion.div
               className={twJoin('h-full bg-blue-400', color)}
               initial={{ width: 0 }}
               animate={{ width: `${value}%` }}
               transition={{ duration: disableAnimation ? 0 : 0.5 }}
            />
         )}
      </div>
   )
}
export default ProgressBase
