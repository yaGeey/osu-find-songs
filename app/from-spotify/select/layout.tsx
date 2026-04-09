import { Metadata } from 'next'
import Overlay from '@/components/Overlay'

export const metadata: Metadata = {
   title: 'Select Spotify playlist',
}
export default function SelectPageLayout({ children }: { children: React.ReactNode }) {
   return (
      <>
         <Overlay />
         {children}
      </>
   )
}
