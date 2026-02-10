import { useEffect, useState } from 'react'
import SupportIcon from './SupportIcon'

export default function Announcement() {
   const [isVisible, setIsVisible] = useState(false)
   const localStorageKey = 'announcement_donate'
   useEffect(() => {
      let visitedTimes = localStorage.getItem('visited_times')
      const wasShown = localStorage.getItem(localStorageKey)
      if (!visitedTimes) {
         localStorage.setItem('visited_times', '1')
         visitedTimes = '1'
      } else {
         localStorage.setItem('visited_times', (parseInt(visitedTimes) + 1).toString())
      }
      if (parseInt(visitedTimes) === 2 || (!wasShown && parseInt(visitedTimes) > 1)) {
         setIsVisible(true)
         localStorage.setItem(localStorageKey, 'true')
      }
   }, [])
   if (!isVisible) return null
   return (
      <div className="absolute top-0 mx-auto pt-1 px-5 bg-main-lightest text-black border-3 border-error flex flex-row items-center">
         <SupportIcon className="size-[50px] min-h-[50px] min-w-[50px] mr-4 hover:scale-110 transition-all" />
         <p className="line-clamp-2 text-ellipsis">
            Support osufindsongs: Spotify now requires a Premium account for API access. Help me keep the app running for everyone
            if you have spare dollar! Click the icon to learn more. This message will only be shown once. Thank you 🙏
         </p>
      </div>
   )
}
