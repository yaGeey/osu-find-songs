import SearchComponents from '@/components/Search'
import { useEffect, useState } from 'react'

export default function Search({
   onSearch,
   disabled = false,
}: {
   onSearch: React.Dispatch<React.SetStateAction<string>>
   disabled?: boolean
}) {
   const [value, setValue] = useState('')

   useEffect(() => {
      const timer = setTimeout(() => {
         onSearch(value)
      }, 400)
      return () => clearTimeout(timer)
   }, [value, onSearch])

   return <SearchComponents value={value} setValue={setValue} width={250} disabled={disabled} />
}
