import { twMerge as tw } from 'tailwind-merge'

export default function CursorBtn({
   setIsDisabled,
   isDisabled,
}: {
   setIsDisabled: (value: boolean) => void
   isDisabled: boolean
}) {
   return (
      <button
         onClick={() => {
            setIsDisabled(!isDisabled)
         }}
         className={tw('cursor-pointer stroke-success', isDisabled && 'pointer-events-none stroke-black/50')}
      >
         <svg
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="min-w-[17px] hover:brightness-110 transition-all"
         >
            <path
               d="M1 11.434L6.50289 15.3588C6.98436 15.7022 7.65704 15.555 7.95113 15.0419L16 1"
               strokeWidth="2"
               strokeLinecap="round"
            />
         </svg>
      </button>
   )
}
