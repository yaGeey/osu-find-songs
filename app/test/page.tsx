'use client'
import { SpotifyBtn } from "@/components/Buttons";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
gsap.registerPlugin(useGSAP);

export default function Test() {
   const container = useRef<HTMLDivElement>(null);
   const [test, setTest] = useState(false);
   useGSAP(() => {
      if (test) gsap.to('#box-card', { x: 0, duration: 1 });
      else gsap.to('#box-card', { x: -200, duration: 1 });
   }, { scope: container, dependencies: [test] });
   return (
      <div className="m-4 absolute" ref={container}>
         <span className="text-white bg-red-400 rounded-full absolute text-sm left-5 -top-1 font-bold w-4 h-4 flex items-center justify-center">4</span>
         <Image src="/icons/Spotify.svg" width={30} height={30} alt="Spotify" />
         <SpotifyBtn disabled/>
         <SpotifyBtn onClick={()=>setTest(p=>!p)}/>
         <div id='box-card' className="box bg-amber-300 h-24 w-24"></div>
      </div>
   )
}