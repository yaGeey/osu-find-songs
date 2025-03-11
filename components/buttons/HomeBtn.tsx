import Image from "next/image"
import { useState } from "react";
import Modal from "../Modal";
import { useRouter } from "next/navigation";

export default function HomeBtn() {
   const [isHomeRedirectModalVisible, setIsHomeRedirectModalVisible] = useState(false);
   const router = useRouter();

   return (
      <>
         <div className="relative w-[30px] h-[30px]" onClick={() => setIsHomeRedirectModalVisible(true)}>
            <Image src="/icons/home.svg" fill sizes='100' alt="settings" className="hover:scale-110 transition-all"/>
         </div>
         <Modal isOpen={isHomeRedirectModalVisible} onClose={() => setIsHomeRedirectModalVisible(false)} onOkay={()=>router.push('/')} closeBtn='Stay' okBtn='Redirect' state='warning'>You are about to redirect to the landing page</Modal>
      </>
   )
}