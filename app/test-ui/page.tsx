'use client'

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export default function ExampleClientComponent() {
   const router = useRouter()
   const pathname = usePathname()
   const searchParams = useSearchParams()

   // Get a new searchParams string by merging the current
   // searchParams with a provided key/value pair
   const createQueryString = useCallback(
      (name: string, value: string) => {
         console.log(searchParams.toString(), new URLSearchParams(searchParams.toString()))
         const params = new URLSearchParams(searchParams.toString())
         params.set('q', value)

         console.log(params.toString())
         return params.toString()
      },
      [searchParams]
   )

   return (
      <>
         <p>Sort By</p>

         {/* using useRouter */}
         <button
            onClick={() => {
               // <pathname>?sort=asc
               router.replace(pathname + '?q=' + encodeURIComponent('star>5 ar=10'))
            }}
         >
            ASC
         </button>

         {/* using <Link> */}
         <button
            onClick={() => {
               // <pathname>?sort=asc
               router.replace(pathname + '?' + createQueryString('sort', 'desc'))
            }}
         >
            desc
         </button>
      </>
   )
}