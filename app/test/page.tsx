'use client'
import { Button, SpotifyBtn } from "@/components/Buttons";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import { fetchMyProfile } from "@/utils/Spotify";
import { useRouter } from "next/navigation";
gsap.registerPlugin(useGSAP);

export default function Test() {
   const container = useRef<HTMLDivElement>(null);
   const router = useRouter();
   const [test, setTest] = useState(false);
   useGSAP(() => {
      if (test) gsap.to('#box-card', { x: 0, duration: 1 });
      else gsap.to('#box-card', { x: -200, duration: 1 });
   }, { scope: container, dependencies: [test] });

   async function handleFetch() {
      const data = await fetchMyProfile();
      console.log(data);
   }

   function navigateToAuth() {
      const encodeRedirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!);
      const clientId = process.env.NEXT_PUBLIC_AUTH_SPOTIFY_ID;
      const scope = 'playlist-modify-public playlist-modify-private';
      const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeRedirectUri}&scope=${scope}`;
      router.push(url)
   }

   return (
      <div className="m-4 absolute" ref={container}>
         <span className="text-sm"> Test text</span>
         <span className="text-white bg-red-400 rounded-full absolute text-sm left-5 -top-1 font-bold w-4 h-4 flex items-center justify-center">4</span>
         <Image src="/icons/Spotify.svg" width={30} height={30} alt="Spotify" />
         <SpotifyBtn onClick={handleFetch} />
         <Button onClick={navigateToAuth} > Login spotify </Button>
         <SpotifyBtn onClick={()=>setTest(p=>!p)}/>
         <div id='box-card' className="box bg-amber-300 h-24 w-24"></div>
      </div>
   )
}