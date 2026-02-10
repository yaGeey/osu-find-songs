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
}: {
   disabled?: boolean
   maps: BeatmapSet[][]
   progress: number | null
   handleDownloadAll: () => void
}) {
   const [isOpen, setIsOpen] = useState(false)
   const [step, setStep] = useState<ModalStep>('confirm')

   const openModal = () => {
      setStep('confirm')
      setIsOpen(true)
   }
   const closeModal = () => {
      setIsOpen(false)
   }
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
                     If there is more than one beatmap set for a song, the first one based on your search{' '}
                     <span className="underline">filters</span> will be downloaded
                  </p>
               ),
               buttons: [
                  { onClick: closeModal, children: 'Cancel', className: 'bg-error w-30' },
                  { onClick: handleStartDownload, children: 'Download', className: 'bg-success w-30' },
               ],
            }

         case 'downloading':
            if (progress !== null) {
               return {
                  title: 'Download All Beatmaps',
                  status: 'info' as const,
                  children: "Please wait, this may take some time. Don't close this page",
                  buttons: [{ onClick: closeModal, children: 'Okay' }],
               }
            } else
               return {
                  title: 'Download All Beatmaps',
                  status: 'success' as const,
                  children: 'Downloaded successfully',
                  buttons: [{ onClick: closeModal, children: 'Okay' }],
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
         <Button
            onClick={openModal}
            className="text-white py-0.5 px-5 bg-main-dark _invisible"
            textClassName="font-outline-sm"
            disabled={disabled}
         >
            Download all
            <FontAwesomeIcon icon={faDownload} className="ml-2" />
         </Button>

         <Modal
            isOpen={isOpen}
            setIsOpen={closeModal}
            title={content.title}
            status={content.status}
            buttons={content.buttons}
            className="w-150 h-50"
         >
            {content.children}
         </Modal>
      </>
   )
}
