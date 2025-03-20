'use client'
import BgImage from "@/components/BgImage";
import { Button } from "@/components/Buttons";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";

export default function SelectPage() {
   const [value, setValue] = useState('')
   const inputRef = useRef<HTMLInputElement>(null)
   const router = useRouter();

   function handleClick() {
      const parts = value.split('/')
      const id = parts[parts.length - 1].split('?')[0]
      router.push('/from-spotify/' + id)
   }

   return (
      <div className="flex flex-col justify-center items-center h-screen font-inter">
         <BgImage />
         <div className="flex flex-col justify-center items-center bg-main-lighter rounded-2xl px-10 py-7 shadow-lg border-4 border-main-border">
            <div className="flex flex-col gap-4 justify-center items-center">
               <h1 className="text-2xl text-black font-medium">Select Spotify playlist</h1>
               <em className="text-black/80 ">Right-click the playlist → Share → Copy link to playlist</em>
               <div className="relative w-full">
                  <input
                     placeholder='Spotify playlist link'
                     pattern="https://open.spotify.com/playlist/.*"
                     onChange={(e) => setValue(e.target.value)}
                     ref={inputRef}
                     className="bg-white/50 border-3 w-full border-main-border rounded-md pl-2 py-1 pr-8 [&:not(:placeholder-shown)]:bg-white/80 valid:[&:not(:placeholder-shown)]:border-success invalid:[&:not(:placeholder-shown)]:border-invalid transition-all outline-0"
                  ></input>
                  <FontAwesomeIcon icon={faSpotify} className="absolute top-1/2 transform -translate-y-1/2 right-2 text-lg text-black/80"/>
               </div>
            </div>
            <Button className="bg-success font-medium mt-8" disabled={!value || !inputRef.current?.validity.valid} onClick={handleClick} textClassName="font-outline">Find beatmaps</Button>
         </div>
      </div>
   )
}