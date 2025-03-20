'use client'
import { useState } from 'react';
import Image from 'next/image';
import { twMerge as tw } from 'tailwind-merge';

const links = ['https://i.imgur.com/puys3Ds.jpeg', 'https://i.imgur.com/dtQYupf.png', 'https://i.imgur.com/kA8hBvT.png', 'https://i.imgur.com/7Ya0zny.jpeg'];

export default function BgImage({ image, brightness = 4, className }: { image?: string, brightness?: number, className?: string }) {
   const [isLoaded, setIsLoaded] = useState(false);
   const [number] = useState(() => Math.floor(Math.random() * links.length));
   return (
      <div className={tw("fixed -z-10 top-0 left-0 w-full h-full brightness-[.4]", brightness && `brightness-[.${brightness}]`, className)}>
         <Image
            // src={image || links[number]}
            src={image || '/bg.svg'}
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