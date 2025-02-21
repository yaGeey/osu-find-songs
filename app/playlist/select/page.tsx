'use client'
import BgImage from "@/components/BgImage";
import { Song } from "@/types/types";
import { useSongContext } from "@/contexts/SongContext";
import { useRouter } from "next/navigation";

export default function SelectPage() {
   const { setSongs } = useSongContext();
   const router = useRouter();

   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const files = e.target.files;
      if (files && files?.length != 0) {
         const songsMap = new Map<string, Song>();
         Array.from(files).forEach((file) => {
            let song = file.webkitRelativePath.split("/").slice(1, -1)[0].split(" ");

            // check if beatmapset folder
            const id = song.length > 0 && !isNaN(parseInt(song[0])) ? song.shift() : null;
            if (!id) return;
            // if (songsMap) return;

            // getting bg image
            const potentialImage = file.webkitRelativePath.split("/")[2];
            let image;
            if (potentialImage.includes('png') || potentialImage.includes('jpg')) {
               image = URL.createObjectURL(file);
            };
            if (!image) return;

            song = song.join(" ").split(" - ");
            const songKey = `${song[0]} - ${song[1]}`;
            songsMap.set(songKey, {
               author: song[0],
               title: song[1],
               text: songKey,
               image,
               id,
            });
         });
         setSongs(Array.from(songsMap.values()));
         router.push('/playlist');
      } else {
         alert('Please select a valid osu! beatmaps directory');
      }
   }
   
   return (
      <>
         <BgImage />
         <div className="absolute mx-auto top-1/2 -translate-y-1/2 left-0 right-0 w-fit">
            <div className="animate-pulse-size duration-8000 delay-3000 absolute top-0 left-0 w-full h-full bg-main rounded-xl"></div>
            <div className="bg-main px-10 py-6 hover:px-12 hover:py-8 text-lg border-main-border border-4 p-3 rounded-xl select-none cursor-pointer brightness-115 shadow-md hover:shadow-lg hover:brightness-130 font-semibold transition-all duration-300 flex flex-col justify-center items-center">
               <h1>Choose your <span className="font-bold">osu!</span> beatmaps directory</h1>
               <h3 className="text-base text-black/60">.../osu!/Songs</h3>
               <h3 className="text-base mt-2">❗ This can take a lot of time depending on amount of maps ❗</h3>
               {/* @ts-ignore */}
               <input directory="" webkitdirectory="" type="file" onChange={handleFileChange} className="opacity-0 absolute top-0 left-0 w-full h-full" />
            </div>
         </div>
      </>
   )
}