import { Button } from '@/components/buttons/Buttons'
import Modal from '@/components/Modal'
import Progress from '@/components/state/Progress'
import useDownloadAll from '@/hooks/useDownloadAll'
import { BeatmapSet } from '@/types/Osu'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'

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
   return (
      <>
         {/* download all progress */}

         <Button
            onClick={() => setModal({ type: 'confirm-download' })}
            className="text-white py-0.5 px-5 bg-main-dark _invisible"
            textClassName="font-outline-sm"
            disabled={disabled}
         >
            Download all
            <FontAwesomeIcon icon={faDownload} className="ml-2" />
         </Button>

         <Modal
            isOpen={modal?.type === 'confirm-download'}
            buttons={[
               {
                  onClick: () => setModal(null),
                  text: 'Cancel',
                  className: 'bg-error',
               },
               {
                  onClick: () => {
                     setModal({ type: 'downloading' })
                     handleDownloadAll()
                  },
                  text: 'Download',
                  className: 'bg-success',
               },
            ]}
            status="info"
         >
            <p className="text-balance text-center">
               If there is more than one beatmap set for a song, the first one based on your search{' '}
               <span className="text-accent font-outline-sm">filters</span> will be downloaded
            </p>
            {/* <p className=" text-center">Download with <span className="text-highlight font-outline">video</span>? It will take up more space.</p> */}
         </Modal>
         <Modal
            isOpen={modal?.type === 'downloading' && progress !== null}
            buttons={[
               {
                  onClick: () => setModal(null),
                  text: 'Okay',
                  className: 'bg-main-dark',
               },
            ]}
            status="info"
         >
            Please wait, this may take some time. Don&apos;t close this page
         </Modal>
         <Modal
            isOpen={modal?.type === 'downloading' && progress === null}
            buttons={[
               {
                  onClick: () => setModal(null),
                  text: 'Close',
                  className: 'bg-main-dark',
               },
            ]}
            status="success"
         >
            Downloaded successfully
         </Modal>
      </>
   )
}
