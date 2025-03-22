import ReactDom from 'react-dom';
import { twMerge as tw } from 'tailwind-merge';
import { Button } from './Buttons';

export default function Modal({ children, isOpen, onClose, onOkay, state, okBtn, closeBtn, dialog }: {
   children: React.ReactNode,
   isOpen: boolean,
   onClose?: () => void,
   onOkay?: () => void,
   state: 'error' | 'success' | 'warning' | 'info' | 'loading',
   okBtn?: string,
   closeBtn?: string,
   dialog?: boolean
}) {
   if (!isOpen) return null;

   return (
      ReactDom.createPortal(
         <div className={`fixed top-0 left-0 w-screen h-screen bg-black/30 z-10000 text-center`}>
            <div className={tw(
               "bg-main-lighter text-balance max-w-[540px] border-4 rounded-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3.5 transition-all shadow-2xl flex flex-col",
               state === 'error' && 'border-invalid',
               state === 'success' && 'border-success',
               state === 'warning' && 'border-yellow-400',
               state === 'info' && 'border-main-border',
               state === 'loading' && 'border-main-border',
            )}>
               <div className='flex-1 p-3 flex flex-col gap-2 justify-center items-center font-semibold'>
                  {children}
               </div>
               <div className='flex gap-2 justify-center mt-3 '>
                  {state !== 'loading' && okBtn && <Button onClick={onOkay} className={tw('h-[35px]', dialog ? 'bg-main-darker' : 'bg-success font-medium shadow-none')} textClassName='font-outline'>{okBtn}</Button>}
                  {state !== 'loading' && closeBtn && <Button onClick={onClose} className={tw('h-[35px]', dialog ? 'bg-main-darker' : 'bg-invalid font-medium shadow-none')} textClassName='font-outline'>{closeBtn}</Button>}
               </div>
            </div>
         </div>,
         document.body
      )
   )
}