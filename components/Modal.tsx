import ReactDom from 'react-dom'
import { twMerge as tw } from 'tailwind-merge'
import { Button } from './buttons/Buttons'

type ModalButtonProps = {
   onClick: () => void
   text?: string
   className?: string
}

export default function Modal({
   buttons,
   children,
   isOpen,
   status,
}: {
   buttons: ModalButtonProps[]
   children: React.ReactNode
   isOpen: boolean
   status: 'error' | 'success' | 'warning' | 'info' | 'loading'
}) {
   if (!isOpen) return null

   return ReactDom.createPortal(
      <div className={`fixed top-0 left-0 w-screen h-screen bg-black/30 z-10000 text-center`}>
         <div
            className={tw(
               'overflow-hidden bg-triangles text-black _animate-border _[--color-animated-body:var(--color-main-light)] text-balance max-w-[540px] border-4 rounded-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3.5 transition-all shadow-2xl flex flex-col',
               status === 'error' && '[--color-animated-border:var(--color-error)] border-error',
               status === 'success' && '[--color-animated-border:var(--color-success)] border-success',
               status === 'warning' && '[--color-animated-border:var(--color-warning)] border-warning',
               status === 'info' && '[--color-animated-border:var(--color-main-subtle)] border-main-border',
               status === 'loading' && '[--color-animated-border:var(--color-main-subtle)] border-main-border',
            )}
         >
            <div className="flex-1 p-3 flex flex-col gap-2 justify-center items-center font-medium">{children}</div>
            <div className="flex gap-2 justify-center mt-3 shadow-none">
               {buttons.map(
                  (btn, index) =>
                     btn.text && (
                        <Button
                           key={index}
                           onClick={btn.onClick}
                           className={tw('h-[35px]', btn.className)}
                           textClassName="font-outline-sm"
                        >
                           {btn.text}
                        </Button>
                     ),
               )}
            </div>
         </div>
      </div>,
      document.body,
   )
}
