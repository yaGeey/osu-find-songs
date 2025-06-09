import Image from 'next/image';
import './Button.css';
import { ButtonHTMLAttributes, Ref } from 'react';
import { twMerge as tw } from 'tailwind-merge';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
   onClick?: () => void;
   ref?: Ref<HTMLButtonElement>;
   className?: string;
   textClassName?: string;
}

export function SpotifyBtn({ onClick, ref, className, ...props }: BtnProps) {
   return (
      <button
         onClick={onClick}
         ref={ref}
         {...props}
         className={tw('button w-[102px] h-[31px] bg-[#1ED760]  border-[#159A44] ', className)}
      >
         <Image src="/SpotifyFull.svg" width={83} height={23} alt="spotify" />
      </button>
   );
}

export function YoutubeBtn({ onClick, ref, className, ...props }: BtnProps) {
   return (
      <button
         onClick={onClick}
         ref={ref}
         {...props}
         className={tw(
            'button w-[102px] h-[31px] bg-[#FFD7D7] border-2 border-[#FFA3A3] box-border rounded-xl flex justify-center items-center',
            className,
         )}
      >
         <Image src="/youtubeFull.svg" width={78} height={17} alt="youtube" />
      </button>
   );
}

export function OtherBtn({ onClick, ref, className, ...props }: BtnProps) {
   return (
      <button
         onClick={onClick}
         ref={ref}
         {...props}
         className={tw(
            'button w-[84px] h-[23px] bg-[#FFCACACC] border-2 border-[#FF9A9A] box-border rounded-xl text-black text-sm font-medium flex justify-center items-center',
            className,
         )}
      >
         Other
      </button>
   );
}

export function OsuBtn({ onClick, ref, className, ...props }: BtnProps) {
   return (
      <button
         onClick={onClick}
         ref={ref}
         {...props}
         className={tw(
            'button text-black ring-5 cursor-pointer w-[102px] h-[31px] bg-[#FFD7D7] border-[#FFA3A3] text-md font-medium',
            className,
         )}
      >
         <Image src="icons/osu.svg" width={20} height={20} alt="osu" className="mt-[1px]" />
         Beatmap
      </button>
   );
}

export function Button({ onClick, ref, className, textClassName, children, ...props }: BtnProps) {
   return (
      <button
         onClick={onClick}
         ref={ref}
         {...props}
         className={tw(
            'button text-white px-4 py-1.5 rounded-md bg-darker border-main-border box-border flex justify-center items-center',
            className,
         )}
      >
         <span className={textClassName}>{children}</span>
      </button>
   );
}
export function SuccessBtn({ onClick, ref, className, children, ...props }: BtnProps) {
   return (
      <button
         onClick={onClick}
         ref={ref}
         {...props}
         className={tw(
            'button bg-success font-medium  text-white px-4 py-1.5 rounded-md border-main-border box-border flex justify-center items-center',
            className,
         )}
      >
         <span className="font-outline">{children}</span>
      </button>
   );
}
