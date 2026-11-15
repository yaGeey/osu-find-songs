import { TriangleAlert } from 'lucide-react'

export default function AlertBanner({ title, children }: { title: string; children?: React.ReactNode }) {
   return (
      <div role="alert" className="flex items-start gap-2.5 3xl:gap-3.5 4xl:gap-4 rounded-xl border-2 border-error/40 bg-error/10 p-3 3xl:p-5 4xl:p-6">
         <span className="grid size-6 3xl:size-8 4xl:size-9 shrink-0 place-items-center rounded-full bg-error/15">
            <TriangleAlert size={14} className="text-error 3xl:size-4 4xl:size-5" />
         </span>
         <div className="min-w-0 text-sm 3xl:text-base 4xl:text-lg">
            <p className="font-semibold text-error">{title}</p>
            {children && <p className="text-main-gray/80">{children}</p>}
         </div>
      </div>
   )
}
