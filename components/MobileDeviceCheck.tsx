'use client'
import { useEffect, useState } from 'react'
import Modal from './Modal'

export default function MobileDeviceCheck() {
   const [isVisible, setIsVisible] = useState(false)
   useEffect(() => {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|OperaMini/i.test(navigator.userAgent)) {
         setIsVisible(true)
      }
   }, [])
   return (
      <Modal
         isOpen={isVisible}
         buttons={[{ onClick: () => setIsVisible(false), text: 'Proceed', className: 'bg-error' }]}
         status="warning"
      >
         You are connecting from a phone! The website is not designed for mobile use, as there is no practical need for it. Expect
         interface bugs and overall instability.
      </Modal>
   )
}
