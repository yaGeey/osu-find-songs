import { Button } from '@/components/buttons/Buttons'
import Modal, { ModalProps } from '@/components/Modal'
import { BeatmapSet } from '@/types/Osu'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'react'

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
   const [modal, setModal] = useState<null | { type: string; data?: any }>(null)

   const modalConfig = useMemo((): Omit<ModalProps, 'isOpen'> | undefined => {
      const def = {
         title: 'Download All Beatmaps',
         className: 'w-150 h-50',
         setIsOpen: () => setModal(null),
      }
      const closeBtn = {
         onClick: () => setModal(null),
         children: 'Okay',
         className: 'bg-main-dark',
      }
      switch (modal?.type) {
         case 'confirm-download':
            return {
               ...def,
               status: 'info',
               buttons: [
                  {
                     onClick: () => setModal(null),
                     children: 'Cancel',
                     className: 'bg-error w-30',
                  },
                  {
                     onClick: () => {
                        setModal({ type: 'downloading' })
                        handleDownloadAll()
                     },
                     children: 'Download',
                     className: 'bg-success w-30',
                  },
               ],
               children: (
                  <p>
                     If there is more than one beatmap set for a song, the first one based on your search{' '}
                     <span className="underline ">filters</span> will be downloaded
                  </p>
               ),
            }
         case 'downloading':
            if (progress !== null) {
               return {
                  ...def,
                  buttons: [closeBtn],
                  children: "Please wait, this may take some time. Don't close this page",
                  status: 'info',
               }
            } else {
               return {
                  ...def,
                  status: 'success',
                  children: 'Downloaded successfully',
                  buttons: [closeBtn],
               }
            }
      }
   }, [modal])
   return (
      <>
         <Button
            onClick={() => setModal({ type: 'confirm-download' })}
            className="text-white py-0.5 px-5 bg-main-dark _invisible"
            textClassName="font-outline-sm"
            disabled={disabled}
         >
            Download all
            <FontAwesomeIcon icon={faDownload} className="ml-2" />
         </Button>

         {modalConfig && (
            <Modal
               isOpen={true}
               setIsOpen={modalConfig.setIsOpen}
               title={modalConfig.title}
               status={modalConfig.status}
               buttons={modalConfig.buttons}
               className={modalConfig.className}
            >
               {modalConfig.children}
            </Modal>
         )}
      </>
   )
}
