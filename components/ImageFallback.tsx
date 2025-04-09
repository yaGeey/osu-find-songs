import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

interface ImageFallbackProps extends ImageProps {
   fallbackSrc?: string;
}
export default function ImageFallback({ fallbackSrc = 'https://www.transparenttextures.com/patterns/ag-square.png', ...props }: ImageFallbackProps) {
   const { src } = props
   const [imgSrc, setImgSrc] = useState(src)

   return (
      <Image
         {...props}
         src={imgSrc}
         onError={() => {
            setImgSrc(fallbackSrc)
         }}
      />
   )
}