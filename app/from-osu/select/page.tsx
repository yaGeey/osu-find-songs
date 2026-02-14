'use client'
import { Song } from '@/types/types'
import { useSongContext } from '@/contexts/SongContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { ToastContainer } from 'react-toastify'
import Footer from '@/components/Footer'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faUpload } from '@fortawesome/free-solid-svg-icons'
import { twJoin } from 'tailwind-merge'
import { getServerToken } from '@/lib/Spotify'
// import useGetLazySpotifyTokens from '@/hooks/useGetLazySpotifyTokens'
import { sendUnknownError } from '@/lib/client-axios'

export default function SelectPage() {
   const { setSongs } = useSongContext()
   // useGetLazySpotifyTokens()
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

         const osuFile = files.find((f) => f.name.endsWith('.osu'))
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
         const imageFile = files.find((f) => f.name === bgFileName)
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

   const [message, setMessage] = useState('Click to select folder')
   const [state, setState] = useState<'idle' | 'success' | 'error'>('idle')

   return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white">
         <div className="flex flex-col justify-center items-center flex-1 text-nowrap">
            <h1 className="text-4xl tracking-tight font-semibold mb-3">Select your osu! beatmaps folder</h1>
            <h3 className="text-lg text-white/60">This may take some time</h3>
            <div
               className="text-xl flex items-center gap-2 cursor-pointer hover:underline active:text-main-white"
               onClick={async (e) => {
                  navigator.clipboard.writeText(e.currentTarget.innerText)
                  setMessage('Path copied to clipboard!')
                  await new Promise((resolve) => setTimeout(resolve, 5000))
                  setMessage('Click to select folder')
               }}
            >
               <h2>%LocalAppData%\osu!\Songs</h2>
               <FontAwesomeIcon icon={faCopy} />
            </div>
            <div
               className={twJoin(
                  'border-2 border-dashed w-full rounded-lg mt-7 p-8 text-center relative hover:brightness-125 transition-all',
                  state === 'idle' && 'border-main text-main',
                  state === 'success' && 'border-success text-success',
                  state === 'error' && 'border-error text-error',
               )}
            >
               <div>
                  <FontAwesomeIcon icon={faUpload} className="text-5xl mb-3" />
                  <div className="text-lg font-medium">{message}</div>
               </div>
               <input
                  type="file"
                  {...({ directory: '', webkitdirectory: '' } as any)}
                  onChange={async (e) => {
                     setState('idle')
                     setMessage('Loading...')
                     handleFileChange(e)
                        .then(() => {
                           setState('success')
                           setMessage('Redirecting...')
                        })
                        .catch((e) => {
                           setState('error')
                           setMessage('Failed. Check console for more details')
                           console.error(e)
                           sendUnknownError(e, 'FILE_SELECT')
                        })
                  }}
                  className="absolute opacity-0 top-0 left-0 w-full h-full"
               />
            </div>
         </div>
         <ToastContainer />
         <Footer />
      </div>
   )
}
