'use client'
import { LocalBeatmap } from '@/types/types'
import { useLocalBeatmapsContext } from '@/contexts/SongContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { ToastContainer } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faUpload } from '@fortawesome/free-solid-svg-icons'
import { twJoin, twMerge } from 'tailwind-merge'
import { sendUnknownError } from '@/lib/errorHandling'

type LocalOsuMetadata = Omit<LocalBeatmap, 'imageURL'> & { bgFileName: string | null }
type OsuMetadataFromFile = Omit<LocalOsuMetadata, 'id'>

export default function SelectPage() {
   const { setLocalBeatmaps } = useLocalBeatmapsContext()
   const router = useRouter()

   function parseOsuFile(file: File): Promise<OsuMetadataFromFile> {
      return new Promise((resolve, reject) => {
         const reader = new FileReader()
         reader.onload = () => {
            const content = reader.result as string
            const lines = content.split(/\r?\n/)
            const result: Partial<OsuMetadataFromFile> = {}

            for (let i = 0; i < lines.length; i++) {
               const line = lines[i].trim()

               if (line.startsWith('Title:')) result.title = line.replace('Title:', '').trim()
               if (line.startsWith('Artist:')) result.artist = line.replace('Artist:', '').trim()
               if (line.startsWith('Creator:')) result.creator = line.replace('Creator:', '').trim()
               if (line.startsWith('[Difficulty]')) break
            }

            if (!result.title || !result.artist) {
               reject(new Error('Missing required metadata in .osu file'))
               return
            }
            resolve(result as OsuMetadataFromFile)
         }
         reader.onerror = () => reject(reader.error)
         reader.readAsText(file)
      })
   }

   async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const files = e.target.files
      if (!files || files.length === 0) throw new Error('No files selected')

      const beatmaps: LocalBeatmap[] = []

      // grouping files by folders
      const folders = new Map<string, File[]>()
      for (const file of files) {
         const parts = file.webkitRelativePath.split('/')
         if (parts.length <= 1) continue
         const folderName = parts[1]
         if (!folders.has(folderName)) {
            folders.set(folderName, [])
         }
         folders.get(folderName)!.push(file)
      }

      // getting data
      for (const [folderName, files] of folders) {
         try {
            const mapParts = folderName.split(' ')

            // check if folder is a map folder
            const id = mapParts.length > 0 && !isNaN(parseInt(mapParts[0])) ? mapParts.shift() : null
            if (!id) continue

            const osuFile = files.find((f) => f.name.endsWith('.osu'))
            if (!osuFile) continue

            const metadata = await parseOsuFile(osuFile)

            const mapName = mapParts.join(' ').split(' - ')
            beatmaps.push({
               artist: mapName[0],
               title: mapName[1].replace('[no video]', '').trim(),
               creator: metadata.creator,
               id,
            })
         } catch (err) {
            console.warn(`Skipping folder "${folderName}" due to read/parse error`, err)
         }
      }
      setLocalBeatmaps(beatmaps)
      router.push('/from-osu')
   }

   const [message, setMessage] = useState('Click to select folder')
   const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

   return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white">
         <div className="flex flex-col justify-center items-center flex-1 text-nowrap">
            <h1 className="text-4xl tracking-tight font-semibold mb-3">Select your osu! beatmaps folder</h1>
            <h3 className="text-lg text-white/60">
               This may take some time, or the app may even crash if you have too many maps
            </h3>
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
                  (state === 'idle' || state === 'loading') && 'border-main text-main',
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
                     setState('loading')
                     setMessage('Loading...')
                     handleFileChange(e)
                        .then(() => {
                           setState('success')
                           setMessage('Redirecting...')
                        })
                        .catch((e) => {
                           setState('error')
                           if (e instanceof Error && e.message === 'No files selected') {
                              setMessage('No files selected. Are you sure you selected the folder?')
                              return
                           }
                           setMessage('Failed. Check console for more details')
                           console.error(e)
                           sendUnknownError(e, 'FILE_SELECT')
                        })
                  }}
                  className={twMerge(
                     'absolute opacity-0 top-0 left-0 w-full h-full',
                     state === 'loading' && 'cursor-not-allowed pointer-events-none',
                  )}
               />
            </div>
         </div>
         <ToastContainer />
      </div>
   )
}
