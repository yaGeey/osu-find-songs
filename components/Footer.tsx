import { faArrowUpRightFromSquare, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getGitHubRepoLastUpdate, getGitHubRepoStarCount } from '@/lib/github'

export default async function Footer() {
   const lastUpdated = await getGitHubRepoLastUpdate()
   const stargazeCount = await getGitHubRepoStarCount()
   return (
      <footer className="mt-auto pb-3">
         <p className="text-base max-sm:text-[13px] px-1 text-center">
            Consider starring ⭐ this GitHub repo if you like this app!
         </p>
         <a
            href="https://github.com/yaGeey/osu-find-songs"
            target="_blank"
            className="text-sm max-sm:text-[13px] flex px-2 justify-center items-center text-white/60 hover:underline"
         >
            GitHub
            <FontAwesomeIcon icon={faStar} className="text-[10px] mx-1" />
            {stargazeCount || 'xx'} · Last update: {lastUpdated ? new Date(lastUpdated.date).toLocaleDateString() : 'x/xx/xx'}{' '}
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px] ml-1" />
         </a>
      </footer>
   )
}
