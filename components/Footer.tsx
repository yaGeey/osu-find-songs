import { faArrowUpRightFromSquare, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getGitHubRepoLastUpdate, getGitHubRepoStarCount } from '@/lib/actions/github'
import { Heart, ExternalLink } from 'lucide-react'

export default async function Footer() {
   const lastUpdated = await getGitHubRepoLastUpdate()
   const stargazeCount = await getGitHubRepoStarCount()
   return (
      <footer className="mt-auto pb-3">
         <p className="text-base max-sm:text-[13px] px-1 text-center">
            Love the app? Leave a star on{' '}
            <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" className="hover:underline">
               GitHub
            </a>{' '}
            ★ or{' '}
            <a href="https://ko-fi.com/yageey" target="_blank" className="hover:underline">
               buy me a coffee!
            </a>
         </p>
         <p className="text-sm max-sm:text-[13px] flex px-2 justify-center items-center text-white/60 gap-5">
            <a
               href="https://github.com/yaGeey/osu-find-songs"
               target="_blank"
               className="hover:underline flex items-center justify-center gap-1"
            >
               GitHub ★ {stargazeCount || 'xx'} · Last update:{' '}
               {lastUpdated ? new Date(lastUpdated.date).toLocaleDateString() : 'x/xx/xx'} <ExternalLink size={13} />
            </a>
            <a
               href="https://ko-fi.com/yageey"
               target="_blank"
               className="hover:underline flex items-center justify-center gap-1"
            >
               Ko-Fi
               <Heart size={13} />
            </a>
         </p>
      </footer>
   )
}
