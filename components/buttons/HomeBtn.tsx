import Image from 'next/image'
import { useState } from 'react'
import Modal from '../Modal'
import { useRouter } from 'next/navigation'

export default function HomeBtn() {
   const [isHomeRedirectModalVisible, setIsHomeRedirectModalVisible] = useState(false)
   const router = useRouter()

   return (
      <>
         <div className="relative w-[30px] h-[30px]" onClick={() => router.push('/')}>
            <Image src="/icons/home.svg" fill sizes="100" alt="settings" className="hover:scale-105 transition-all" />
         </div>
         {/* <Modal
            isOpen={isHomeRedirectModalVisible}
            status="warning"
            buttons={[
               {
                  onClick: () => router.push('/'),
                  children: 'Redirect',
                  className: 'bg-success',
               },
               {
                  onClick: () => setIsHomeRedirectModalVisible(false),
                  children: 'Stay',
                  className: 'bg-main-dark',
               },
            ]}
         >
            <h4>You are about to be redirected to the landing page</h4>
            <p>Your progress will not be saved</p>
         </Modal> */}
      </>
   )
}
