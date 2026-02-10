import { useLayoutEffect, useRef } from 'react'
import { twMerge as tw, twJoin } from 'tailwind-merge'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './buttons/Buttons'
import CloseBtn from './buttons/CloseBtn'

type ModalButtonProps = {
   onClick: () => void
   children: React.ReactNode
   className?: string
}

export type ModalProps = {
   buttons: ModalButtonProps[]
   children: React.ReactNode
   isOpen: boolean
   title?: string
   status: 'error' | 'success' | 'warning' | 'info' | 'loading'
   className?: string
   setIsOpen: () => void
}

export default function Modal({ buttons, children, status, title, className, setIsOpen, isOpen }: ModalProps) {
   const dialogRef = useRef<HTMLDialogElement>(null)

   useLayoutEffect(() => {
      const dialog = dialogRef.current
      if (!dialog) return

      if (isOpen) {
         document.documentElement.style.overflow = 'hidden'
         if (!dialog.open) dialog.showModal()
      }
      return () => {
         dialog.close()
         document.body.style.overflow = ''
         document.documentElement.style.overflow = ''
      }
   }, [isOpen])

   return (
      <AnimatePresence>
         {isOpen && (
            <dialog
               ref={dialogRef}
               onCancel={(e) => {
                  e.preventDefault()
                  setIsOpen()
               }}
               className={twJoin(
                  'fixed inset-0 z-[9999] flex items-center justify-center',
                  // delete native backdrop
                  'bg-transparent w-full h-full max-w-none max-h-none backdrop:bg-transparent',
               )}
               onClick={setIsOpen}
            >
               {/* custom backdrop */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
               />

               {/* modal */}
               <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 0 }}
                  className={tw(
                     'no-jump w-full max-w-[540px] m-4 bg-triangles text-black text-balance border-4 rounded-xl p-3.5 flex flex-col text-center',
                     status === 'error' && '[--color-animated-border:var(--color-error)] border-error',
                     status === 'success' && '[--color-animated-border:var(--color-success)] border-success',
                     status === 'warning' && '[--color-animated-border:var(--color-warning)] border-warning',
                     status === 'info' && '[--color-animated-border:var(--color-main-subtle)] border-main-border',
                     status === 'loading' && '[--color-animated-border:var(--color-main-subtle)] border-main-border',
                     className,
                  )}
                  onClick={(e) => e.stopPropagation()}
               >
                  {title && <h3 className="font-medium text-xl mb-2">{title}</h3>}

                  <div className="flex-1 p-3 flex flex-col gap-2 justify-center items-center bg-main-lightest rounded-md text-balance leading-relaxed">
                     {children}
                  </div>

                  <div className="flex gap-3 justify-center mt-4 shadow-none">
                     {buttons.map(
                        (btn, index) =>
                           btn.children && (
                              <Button
                                 key={index}
                                 onClick={btn.onClick}
                                 className={tw(btn.className)}
                                 textClassName="font-outline-sm"
                              >
                                 {btn.children}
                              </Button>
                           ),
                     )}
                  </div>
               </motion.div>
            </dialog>
         )}
      </AnimatePresence>
   )
}
