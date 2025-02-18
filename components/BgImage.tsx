import Image from 'next/image';

export default function BgImage({ image }: { image?: string }) {
   return (
      <div className="fixed -z-10 brightness-[.4] top-0 left-0 w-full h-full">
         <Image
            src={image || '/bg.png'}
            alt="bg"
            width={0} height={0}
            sizes="100vw"
            quality={100}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
         />
      </div>
   );
}