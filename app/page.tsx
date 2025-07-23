'use client'
import Link from 'next/link'
import { Button } from '@/components/buttons/Buttons'
import BgImage from '@/components/BgImage'
import Image from 'next/image'
import { useEffect } from 'react'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { faStar, faCircleQuestion } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export default function LandingPage() {
   useEffect(() => {
      if (localStorage.getItem('songs_context')) {
         localStorage.removeItem('songs_context')
      }
   }, [])

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
      <div className="flex flex-col justify-center items-center h-screen">
         <BgImage />
         <div className="bg-dialog relative flex flex-col justify-center items-center bg-main-lighter rounded-2xl p-10 shadow-lg border-4 border-main-border">
            <Image src="/icon.png" width={75} height={75} alt="logo" />
            <h1 className="text-3xl  mt-3">Welcome to osu! find songs</h1>
            <h2 className="text-2xl ">
               Choose one of the options
               <a
                  href="https://www.reddit.com/r/osugame/comments/1m5ruu2/i_fixed_a_web_app_that_allows_users_to_find_songs/"
                  target="_blank"
               >
                  <FontAwesomeIcon icon={faCircleQuestion} className="ml-1.5 text-base mb-1" />
               </a>
            </h2>
            <div className="flex gap-4 mt-10 w-full">
               <Link href="/from-osu/select">
                  <Button className="text-black bg-gradient-to-l from-[#1DB954] to-[#FF66AA] font-medium">
                     Beatmaps to Spotify
                  </Button>
               </Link>
               <Link href="/from-spotify/select">
                  <Button className="text-black bg-gradient-to-r from-[#1DB954] to-[#FF66AA] font-medium">
                     Spotify playlist to beatmaps
                  </Button>
               </Link>
            </div>
            {lastUpdated && stargazeCount && (
               <div className="absolute bottom-0 w-full flex px-2 justify-center text-xs text-main-border/80">
                  <a href="https://github.com/yaGeey/osu-find-songs" target="_blank">
                     GitHub
                     <FontAwesomeIcon icon={faStar} className="text-[10px] mx-0.5" />
                     {stargazeCount} · Last updated: {lastUpdated.date}
                     <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px] ml-1" />
                  </a>
               </div>
            )}
         </div>
      </div>
   )
}
