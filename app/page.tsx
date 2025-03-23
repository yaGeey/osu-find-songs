'use client'
import Link from "next/link";
import { Button } from "@/components/buttons/Buttons";
import BgImage from "@/components/BgImage";
import Image from 'next/image'
import { useEffect } from "react";
// import { useState } from "react";
// import { twMerge as tw } from "tailwind-merge";

export default function LandingPage() {
   // const [src, setSrc] = useState<string>('/bg.svg')
   // const [isVisible, setIsVisible] = useState<boolean>(false)
   // function handleMouseEnter(img: string) {
   //    setTimeout(() => {
   //       setSrc(img)
   //       setIsVisible(true)
   //    }, 1000)
   // }
   // function handleMouseLeave() {
   //    setIsVisible(false)
   //    setTimeout(() => {
   //       setSrc('/bg.svg')
   //    }, 700)
   // }
   useEffect(() => {
      if (localStorage.getItem('songs_context')) {
         localStorage.removeItem('songs_context')
      }
   }, [])
   return (
      <div className="flex flex-col justify-center items-center h-screen">
         <BgImage />
         {/* <BgImage image={src} className={tw("duration-700 transition-all",
            isVisible ? 'opacity-100' : 'opacity-0'
         )} /> */}
         <div className="bg-dialog relative flex flex-col justify-center items-center bg-main-lighter rounded-2xl p-10 shadow-lg border-4 border-main-border">
            <Image src='/icon.png' width={75} height={75} alt='logo' />
            <h1 className="text-3xl  mt-3">Welcome to osu! find songs</h1>
            <h2 className="text-2xl ">Choose one of the options</h2>
            <div className="flex gap-4 mt-10 w-full">
               <Link href="/from-osu/select">
                  {/* onMouseEnter={() => handleMouseEnter('/from-osu.png')} onMouseLeave={handleMouseLeave} */}
                  <Button className="text-black bg-gradient-to-l from-[#1DB954] to-[#FF66AA] font-medium" >Beatmaps to Spotify</Button>
               </Link>
               <Link href="/from-spotify/select">
                  {/* onMouseEnter={() => handleMouseEnter('/from-spotify.png')} onMouseLeave={handleMouseLeave} */}
                  <Button className="text-black bg-gradient-to-r from-[#1DB954] to-[#FF66AA] font-medium">Spotify playlist to beatmaps</Button>
               </Link>
            </div>
         </div>
      </div>
   )
}