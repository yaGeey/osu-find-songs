'use client'
import BgImage from "@/components/BgImage";
import { Button } from "@/components/Buttons";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
         <div className="flex flex-col justify-center items-center bg-main rounded-2xl px-10 py-7 shadow-lg border-4 border-main-border">
            <div className='flex gap-12'>
               <div className="flex flex-col justify-evenly">
                  <h1 className="text-2xl text-white font-medium">Select Spotify playlist</h1>
                  <input
                     placeholder='Spotify playlist link'
                     pattern="https://open.spotify.com/playlist/.*"
                     onChange={(e) => setValue(e.target.value)}
                     ref={inputRef}
                     className="bg-white/50 border-3 border-main-border rounded-md px-2 py-1 [&:not(:placeholder-shown)]:bg-white/80 valid:[&:not(:placeholder-shown)]:border-success invalid:[&:not(:placeholder-shown)]:border-invalid transition-all outline-0"
                  ></input>
               </div>
               <Image src="/instruction.png" alt='' width={200} height={200} className="rounded-xl"/>
            </div>
            {/* <Link href="/from-osu/select"> */}
               <Button className="text-black bg-success font-medium mt-8" disabled={!value || !inputRef.current?.validity.valid} onClick={handleClick}>Find beatmaps</Button>
            {/* </Link> */}
         </div>
      </div>
   )
}