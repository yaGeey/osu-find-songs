'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound } from 'lucide-react'
import { twMerge as tw } from 'tailwind-merge'
import { lastfmPeriods, LastfmPeriod } from '@/types/lastfm'

const periodLabels: Record<LastfmPeriod, string> = {
   overall: 'overall',
   '7day': '7 days',
   '1month': '1 month',
   '3month': '3 months',
   '6month': '6 months',
   '12month': '12 months',
}

export default function SelectPage() {
   const [period, setPeriod] = useState<LastfmPeriod>('overall')
   const [error, setError] = useState<string | null>(null)
   const [isLoading, setIsLoading] = useState(false)
   const router = useRouter()

   useEffect(() => {
      const resetLoading = () => setIsLoading(false)
      const resetWhenVisible = () => {
         if (document.visibilityState === 'visible') resetLoading()
      }

      resetLoading()
      window.addEventListener('pageshow', resetLoading)
      window.addEventListener('focus', resetLoading)
      document.addEventListener('visibilitychange', resetWhenVisible)

      return () => {
         window.removeEventListener('pageshow', resetLoading)
         window.removeEventListener('focus', resetLoading)
         document.removeEventListener('visibilitychange', resetWhenVisible)
      }
   }, [])

   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const username = String(formData.get('username') || '').trim()

      if (!username) {
         setError('Enter a Last.fm username')
         return
      }

      setError(null)
      setIsLoading(true)
      router.push(`/from-lastfm/${encodeURIComponent(username)}?period=${period}&s=any`)
   }

   return (
      <div className="flex min-h-screen flex-col items-center justify-center p-5 text-white">
         <form onSubmit={submit} className="flex flex-1 flex-col items-center justify-center sm:text-nowrap mt-1 w-full max-w-[620px]">
            <h1 className="mb-3 text-4xl font-semibold tracking-tight max-sm:text-2xl">Select a Last.fm profile</h1>
            <h3 className="text-lg text-white/60 max-sm:text-sm">*Public listening data only, no login required</h3>
            <h2 className="mb-3 mt-7 text-center text-xl max-sm:text-base">Enter a Last.fm username and choose a top tracks period</h2>

            <div className="relative w-full">
               <input
                  name="username"
                  placeholder="Last.fm username"
                  autoComplete="off"
                  disabled={isLoading}
                  onChange={() => {
                     if (error) setError(null)
                  }}
                  className={tw(
                     'w-full rounded-lg border-3 border-main-darker bg-gray-100 py-2 pl-2 pr-9 text-black outline-0 transition-all hover:brightness-115',
                     'disabled:border-success disabled:brightness-100',
                     error ? 'border-error' : 'valid:[&:not(:placeholder-shown)]:border-success',
                  )}
               />
               <UserRound className="absolute right-2 top-1/2 size-5 -translate-y-1/2 text-black/80" />
            </div>

            <div className="mt-3 flex w-full flex-wrap justify-center gap-2">
               {lastfmPeriods.map((option) => (
                  <button
                     key={option}
                     type="button"
                     onClick={() => setPeriod(option)}
                     disabled={isLoading}
                     className={tw(
                        'rounded-lg border-2 border-main-darker bg-main-dark px-3 py-1.5 text-sm transition-all hover:brightness-115',
                        period === option ? 'border-success text-success' : 'text-white/80',
                     )}
                  >
                     {periodLabels[option]}
                  </button>
               ))}
            </div>

            <button
               type="submit"
               disabled={isLoading}
               className="mt-4 rounded-lg border-3 border-main-darker bg-main-dark-vivid px-5 py-2 text-white transition-all enabled:hover:brightness-115 disabled:border-success disabled:text-success"
            >
               Find beatmaps
            </button>

            <div className="h-6">
               {isLoading && <span className={tw('text-center w-full text-success')}>Loading..</span>}
               {error && !isLoading && <span className={tw('text-center w-full text-error')}>{error}</span>}
            </div>
         </form>
      </div>
   )
}
