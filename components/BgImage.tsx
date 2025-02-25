'use client'
import { useState, useMemo } from 'react';
import Image from 'next/image';

const links = ['https://i.imgur.com/puys3Ds.jpeg', 'https://i.imgur.com/dtQYupf.png', 'https://i.imgur.com/kA8hBvT.png', 'https://i.imgur.com/7Ya0zny.jpeg'];

export default function BgImage({ image }: { image?: string }) {
   const [isLoaded, setIsLoaded] = useState(false);
   const number = useMemo(() => Math.floor(Math.random() * links.length), []) 
   return (
      <div className="fixed -z-10 brightness-[.4] top-0 left-0 w-full h-full">
         <Image
            src={image || links[number]}
            alt="bg"
            width={0} height={0}
            sizes="100vw"
            quality={100}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onLoad={() => setIsLoaded(true)}
            suppressHydrationWarning
         />
         {!isLoaded && <div className="absolute top-0 left-0 w-full h-full bg-main-border"></div>}
      </div>
   );
}