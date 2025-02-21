import ReactDom from 'react-dom';
import { twMerge as tw } from 'tailwind-merge';
import { Button } from './Buttons';

export default function Modal({ children, isOpen, onClose, onOkay, state, okBtn, closeBtn = 'Close' }: {
   children: React.ReactNode,
   isOpen: boolean,
   onClose: () => void,
   onOkay?: () => void,
   state: 'error' | 'success' | 'warning' | 'info' | 'loading',
   okBtn?: string,
   closeBtn?: string
}) {
   if (!isOpen) return null;

   return (
      ReactDom.createPortal(
         <div className={`fixed top-0 left-0 w-screen h-screen bg-black/30 z-100`}>
            <div className={tw(
               "bg-main border-4 rounded-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3.5 transition-all shadow-2xl flex flex-col",
               state === 'error' && 'border-rose-500/50',
               state === 'success' && 'border-green-400/50',
               state === 'warning' && 'border-yellow-500/50',
               state === 'info' && 'border-main-border',
               state === 'loading' && 'border-main-border',
            )}>
               <div className='flex-1 p-3 flex flex-col gap-2 justify-center items-center font-semibold'>
                  {children}
               </div>
               <div className='flex gap-2 justify-center mt-3'>
                  {state !== 'loading' && okBtn && <Button onClick={onOkay} className='h-[35px] bg-green-600/60'>{okBtn}</Button>}
                  {state !== 'loading' && closeBtn && <Button onClick={onClose} className='h-[35px] bg-red-600/50'>{closeBtn}</Button>}
               </div>
            </div>
         </div>,
         document.body
      )
   )
      
}