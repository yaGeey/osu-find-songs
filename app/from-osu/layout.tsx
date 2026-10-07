import Overlay from '@/components/Overlay'

export default function FromOsuLayout({ children }: { children: React.ReactNode }) {
   return (
      <>
         <Overlay />
         {children}
      </>
   )
}
