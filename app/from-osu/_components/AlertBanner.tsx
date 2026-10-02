import { TriangleAlert } from 'lucide-react'

export default function AlertBanner({ title, children }: { title: string; children?: React.ReactNode }) {
   return (
      <div role="alert" className="flex items-start gap-2.5 rounded-xl border-2 border-error/40 bg-error/10 p-3">
         <span className="grid size-6 shrink-0 place-items-center rounded-full bg-error/15">
            <TriangleAlert size={14} className="text-error" />
         </span>
         <div className="min-w-0 text-sm">
            <p className="font-semibold text-error">{title}</p>
            {children && <p className="text-main-gray/80">{children}</p>}
         </div>
      </div>
   )
}
