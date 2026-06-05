import { Button } from '@/components/buttons/Buttons'
import Modal from '@/components/Modal'
import { BeatmapSet } from '@/types/Osu'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'

type ModalStep = 'confirm' | 'downloading' | 'success'

export default function DownloadAllBtn({
   disabled,
   maps,
   progress,
   handleDownloadAll,
   loadingText,
}: {
   disabled?: boolean
   maps: BeatmapSet[][]
   progress: number | null
   handleDownloadAll: () => void
   loadingText?: string | null
}) {
   const [isOpen, setIsOpen] = useState(false)
   const [step, setStep] = useState<ModalStep>('confirm')

   const closeModal = () => setIsOpen(false)
   const handleStartDownload = () => {
      setStep('downloading')
      handleDownloadAll()
   }

   const renderModalContent = () => {
      switch (step) {
         case 'confirm':
            return {
               title: 'Download All Beatmaps',
               status: 'info' as const,
               children: (
                  <p>
                     The estimated total size of the maps is <span className="font-medium text-xl">{maps.length * 11} MB</span>.
                     {maps.length > 100 && <span className="font-medium"> This may take a very long time.</span>} Are you sure you
                     want to proceed downloading? No videos will be included. If multiple beatmap sets exist for a song, the first
                     one matching your search <span className="underline">filters</span> will be downloaded
                  </p>
               ),
               buttons: [
                  { onClick: handleStartDownload, children: 'Download', className: 'w-31' },
                  { onClick: closeModal, children: 'Later', className: 'w-31 bg-transparent border-none text-black' },
               ],
            }
         case 'downloading':
            if (progress !== null) {
               return {
                  title: 'Download All Beatmaps',
                  status: 'info' as const,
                  children: (
                     <div>
                        <p>Please wait, this may take some time. Don&apos;t close this page</p>
                        <p>{loadingText}</p>
                     </div>
                  ),
                  buttons: [{ onClick: closeModal, children: 'Okay', className: 'w-31' }],
               }
            } else
               return {
                  title: 'Download All Beatmaps',
                  status: 'success' as const,
                  children: 'Downloaded successfully',
                  buttons: [{ onClick: closeModal, children: 'Okay', className: 'w-31' }],
               }

         default:
            return {
               title: '',
               status: 'info' as const,
               children: null,
               buttons: [],
            }
      }
   }
   const content = renderModalContent()

   return (
      <>
         <div className="relative w-fit group">
            <Button
               className="text-white py-0.5 px-5 bg-main-dark opacity-0 group-hover:opacity-100 transition-opacity"
               textClassName="font-outline-sm "
               disabled={disabled}
               onClick={() => setIsOpen(true)}
            >
               Download all
               <FontAwesomeIcon icon={faDownload} className="ml-2 group-hover:visible" />
            </Button>
            <FontAwesomeIcon icon={faDownload} className="absolute right-5 top-1.5 text-xl group-hover:invisible" />
         </div>

         <Modal
            isOpen={isOpen}
            setIsOpen={closeModal}
            title={content.title}
            status={content.status}
            buttons={content.buttons}
            className="w-150"
         >
            {content.children}
         </Modal>
      </>
   )
}
