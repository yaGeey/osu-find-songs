'use client'
import BgImage from '@/components/BgImage'
import { Song } from '@/types/types'
import { useSongContext } from '@/contexts/SongContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { ToastContainer, toast } from 'react-toastify'
import { getServerToken } from '@/lib/Spotify'

// prettier-ignore
export default function SelectPage() {
   const { setSongs } = useSongContext()
   const router = useRouter()

   useEffect(() => {
      if (Cookies.get('showSpotifyEmbeds') === undefined) Cookies.set('showSpotifyEmbeds', 'true')
      if (Cookies.get('showYouTubeEmbeds') === undefined) Cookies.set('showYouTubeEmbeds', 'true')
   }, [])

   function readFileAsText(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
         const reader = new FileReader()
         reader.onload = () => resolve(reader.result as string)
         reader.onerror = () => reject(reader.error)
         reader.readAsText(file)
      })
   }

   async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      await getServerToken()
   
      const files = e.target.files
      if (!files || files.length === 0) throw new Error('No files selected')
      
      const songs: Song[] = []
      const fileList = Array.from(files)
      
      // grouping files by folders
      const folders = new Map<string, File[]>()
      for (const file of fileList) {
         const parts = file.webkitRelativePath.split('/')
         const folderName = parts[1]
         if (!folders.has(folderName)) {
            folders.set(folderName, [])
         }
         folders.get(folderName)!.push(file)
      }

      // getting data
      for (const [folderName, files] of folders) {
         const songParts = folderName.split(' ')

         // check if folder is map folder
         const id = songParts.length > 0 && !isNaN(parseInt(songParts[0])) ? songParts.shift() : null
         if (!id) continue

         const osuFile = files.find(f => f.name.endsWith('.osu'))
         if (!osuFile) continue

         // getting file content -> bg filename
         const content = await readFileAsText(osuFile)
         const lines = content.split('\n') 
         let bgFileName: null | string = null

         lines.forEach((line, i) => {
            if (!bgFileName && line.trim().startsWith('//Background and Video events')) {
               const bgLine = lines[i + 1]
               const match = bgLine.match(/"(.*?)"/)
               if (match) bgFileName = match[1]
            }
         })
         if (!bgFileName) continue
         
         // searching bg file
         const imageFile = files.find(f => f.name === bgFileName)
         if (!imageFile) continue
         const image = URL.createObjectURL(imageFile)

         const songName = songParts.join(' ').split(' - ')
         const songKey = `${songName[0]} - ${songName[1]}`
         songs.push({
            author: songName[0],
            title: songName[1],
            text: songKey,
            image,
            id,
         })
      }
      setSongs(songs)
      router.push('/from-osu')
   }

   return (
      <>
         <BgImage />
         <div className="absolute mx-auto top-1/2 -translate-y-1/2 left-0 right-0 w-fit font-inter">
            <div className="overflow-hidden animate-border rounded-2xl px-10 py-7 shadow-lg select-none cursor-pointer hover:shadow-lg hover:brightness-110 transition-all duration-300 flex flex-col justify-center items-center">
               <h1 className="font-medium text-xl">
                  Click to browse your osu! beatmaps folder
               </h1>
               <span className="text-main-border">C:/Users/.../AppData/Local/osu!/Songs</span>
               <h3 className="text-sm mt-2">⚠️ This may take some time depending on the number of beatmaps ⚠️</h3>
               {/* @ts-expect-error */}
               <input directory=""
                  webkitdirectory=""
                  type="file"
                  onChange={(e) => {
                     toast.promise(handleFileChange(e), {
                        pending: 'Loading beatmaps...',
                        error: {
                           render({ data }) {
                              console.error(data)
                              return 'Please select a valid osu! beatmaps directory'
                           },
                           autoClose: false,
                           hideProgressBar: true,
                        },
                     })
                  }}
                  className="opacity-0 absolute top-0 left-0 w-full h-full"
               />
            </div>
         </div>
         <ToastContainer />
      </>
   )
}
