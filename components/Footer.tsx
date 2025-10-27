'use client'
import { faArrowUpRightFromSquare, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export default function Footer() {
   // GitHub
   const { data: lastUpdated } = useQuery({
      queryKey: ['lastUpdated'],
      queryFn: async () => {
         const { data } = await axios(`https://api.github.com/repos/yaGeey/osu-find-songs/commits?per_page=1`)
         return {
            date: new Date(data[0].commit.author.date).toLocaleString('en-US', {
               dateStyle: 'short',
               timeStyle: 'short',
            }),
            url: data[0].html_url,
         }
      },
   })
   const { data: stargazeCount } = useQuery({
      queryKey: ['stargazeCount'],
      queryFn: async () => {
         const { data } = await axios('https://api.github.com/repos/yaGeey/osu-find-songs')
         return data.stargazers_count
      },
   })
   return (
      <div className="mt-auto mb-8">
         <p className="text-lg">Consider staring ⭐ a GitHub repo if you like this app!</p>
         {lastUpdated && stargazeCount && (
            <a
               href="https://github.com/yaGeey/osu-find-songs"
               target="_blank"
               className="flex px-2 justify-center items-center text-base text-white/60 animate-in fade-in duration-500 hover:underline"
            >
               GitHub
               <FontAwesomeIcon icon={faStar} className="text-[10px] mx-1" />
               {stargazeCount} · Last update: {lastUpdated.date.split(', ')[0]}{' '}
               <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px] ml-1" />
            </a>
         )}
      </div>
   )
}
