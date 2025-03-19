import Link from "next/link";
import { Button } from "@/components/Buttons";
import BgImage from "@/components/BgImage";
import Image from 'next/image'

export default function LandingPage() {
   return (
      <div className="flex flex-col justify-center items-center h-screen">
         <BgImage />
         <div className="relative flex flex-col justify-center items-center bg-main-lighter rounded-2xl p-10 shadow-lg border-4 border-main-border">
            <Image src='/icon.png' width={75} height={75} alt='logo' />
            <h1 className="text-3xl  mt-3">Welcome to the osu! find songs</h1>
            <h2 className="text-2xl ">Choose one of options</h2>
            <div className="flex gap-4 mt-10 w-full">
               <Link href="/from-osu/select">
                  <Button className="text-black bg-gradient-to-l from-[#1DB954] to-[#FF66AA] font-medium">Beatmaps to Spotify</Button>
               </Link>
               <Link href="/from-spotify/select">
                  <Button className="text-black bg-gradient-to-r from-[#1DB954] to-[#FF66AA] font-medium">Spotify playlist to beatmaps</Button>
               </Link>
            </div>
         </div>
      </div>
   )
}