'use client'
import { twMerge as tw } from 'tailwind-merge'
import useFoStore from '@/contexts/useFoStore'

export default function SettingsPopup({ className }: { className?: string }) {
   const showSpotifyEmbeds = useFoStore((state) => state.showSpotifyEmbeds)

   return (
      <div
         className={tw(
            'transition-all z-100 absolute top-12 left-0 shadow-2xl animate-in slide-in-from-left bg-main border-4  border-main-border min-w-65 w-1/4 flex flex-col gap-4 p-4 rounded-xl rounded-t-none rounded-l-none border-t-0 border-l-0',
            className,
         )}
      >
         <section className="flex flex-col ">
            <h2 className="mb-1 font-semibold">Performance</h2>
            <section className="flex items-center gap-2">
               <input
                  type="checkbox"
                  id="performance-spotify"
                  checked={!showSpotifyEmbeds}
                  onChange={(e) => useFoStore.getState().setSpotifyEmbeds(!e.target.checked)}
                  className="w-4 h-4 accent-main-border"
               />
               <label htmlFor="performance-spotify" className="text-sm">
                  Show links instead of <em>Spotify</em> embeds
               </label>
            </section>
         </section>
      </div>
   )
}
