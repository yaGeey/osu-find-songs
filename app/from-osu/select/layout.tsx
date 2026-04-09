import { Metadata } from 'next'
import Overlay from '@/components/Overlay'

export const metadata: Metadata = {
   title: 'Select your osu! beatmaps directory',
}
export default function SelectPageLayout({ children }: { children: React.ReactNode }) {
   return (
      <>
         <Overlay />
         {children}
      </>
   )
}
