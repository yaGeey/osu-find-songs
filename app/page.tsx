'use client'
import Link from 'next/link'
import { Button } from '@/components/buttons/Buttons'
import BgImage from '@/components/BgImage'
import Image from 'next/image'
import { useEffect } from 'react'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { faStar } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
const GH_REPO = 'https://api.github.com/repos/yaGeey/osu-find-songs'

export default function LandingPage() {
   useEffect(() => {
      if (localStorage.getItem('songs_context')) {
         localStorage.removeItem('songs_context')
      }
   }, [])

   const { data: lastUpdated } = useQuery({
      queryKey: ['lastUpdated'],
      queryFn: async () => {
         const { data } = await axios(`${GH_REPO}/commits?per_page=1`)
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
         const { data } = await axios(GH_REPO)
         return data.stargazers_count
      },
   })
   return (
      <div className="flex flex-col justify-center items-center h-screen">
         <BgImage />
         <div className="bg-dialog relative flex flex-col justify-center items-center bg-main-lighter rounded-2xl p-10 shadow-lg border-4 border-main-border">
            <Image src="/icon.png" width={75} height={75} alt="logo" />
            <h1 className="text-3xl  mt-3">Welcome to osu! find songs</h1>
            <h2 className="text-2xl ">Choose one of the options</h2>
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
                  <a href={GH_REPO} target="_blank">
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
