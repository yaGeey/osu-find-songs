import { twMerge as tw } from 'tailwind-merge';

export default function GroupSeparator({
   children,
   ref,
   selected = false,
   onClick,
   className,
}: {
   children: React.ReactNode;
   ref?: React.Ref<HTMLDivElement>;
   selected?: boolean;
   onClick?: () => void;
   className?: string;
}) {
   return (
      <div
         className={tw(
            'select-none relative bg-gradient-to-b from-[#0e0c19] to-[#131123]/90 text-white flex px-5 text-[1.3rem] tracking-widest items-center w-[500px] min-h-[90px] border-[5px] border-[#000] rounded-lg transition-all duration-300 ease-in-out hover:brightness-145 hover:-mt-1 hover:mb-2',
            selected && 'bg-[#2b2007] mb-2',
            className,
         )}
         ref={ref}
         onClick={onClick}
      >
         {children}
      </div>
   );
}
