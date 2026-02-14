'use client'
import { faArrowUpRightFromSquare, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQuery } from '@tanstack/react-query'
import clientAxios from '@/lib/client-axios'

export default function Footer() {
   const isBot = typeof navigator !== 'undefined' && /bot|crawler|spider|crawling/i.test(navigator.userAgent)

   const { data: lastUpdated } = useQuery({
      queryKey: ['lastUpdated'],
      queryFn: async () => {
         const { data } = await clientAxios(`https://api.github.com/repos/yaGeey/osu-find-songs/commits?per_page=1`)
         return {
            date: new Date(data[0].commit.author.date).toLocaleString('en-US', {
               dateStyle: 'short',
               timeStyle: 'short',
            }),
            url: data[0].html_url,
         }
      },
      enabled: !isBot,
   })
   const { data: stargazeCount } = useQuery({
      queryKey: ['stargazeCount'],
      queryFn: async () => {
         const { data } = await clientAxios('https://api.github.com/repos/yaGeey/osu-find-songs')
         return data.stargazers_count
      },
      enabled: !isBot,
   })
   return (
      <footer className="mt-auto pb-3">
         <p className="text-base max-sm:text-[13px] px-1 text-center">Consider staring ⭐ a GitHub repo if you like this app!</p>
         <a
            href="https://github.com/yaGeey/osu-find-songs"
            target="_blank"
            className="text-sm max-sm:text-[13px] flex px-2 justify-center items-center text-white/60 hover:underline"
         >
            GitHub
            <FontAwesomeIcon icon={faStar} className="text-[10px] mx-1" />
            {stargazeCount || 'xx'} · Last update: {lastUpdated ? lastUpdated.date.split(', ')[0] : 'x/xx/xx'}{' '}
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px] ml-1" />
         </a>
      </footer>
   )
}
