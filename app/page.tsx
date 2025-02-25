import Link from "next/link";
import { Button } from "@/components/Buttons";
import BgImage from "@/components/BgImage";
import Image from 'next/image'
import Head from "next/head";

export default function LandingPage() {
   return (
      <div className="flex flex-col justify-center items-center h-screen ">
         <Head>
            <title>Find songs from your osu! game 🎵</title>
            <meta name="description" content="Find songs on Spotify, YouTube. Create Spotify playlist with all your songs in one click" key='desc'/>
         </Head>
         <BgImage />
         <div className="flex flex-col justify-center items-center bg-main rounded-2xl p-10 shadow-lg border-4 border-main-border">
            <Image src='/icon.png' width={75} height={75} alt='logo'/>
            <h1 className="text-3xl text-white mt-3">Welcome to the landing page!</h1>
            <h2 className="text-2xl text-white">Choose one of options</h2>
            <div className="flex gap-4 mt-10">
               <Link href="/songs/select">
                  <Button className="text-white">Beatmaps to Spotify</Button>
               </Link>
               <Link href="/">
                  <Button className="text-white" disabled>Spotify playlist to beatmaps</Button>
               </Link>
            </div>
         </div>
      </div>
   )
}