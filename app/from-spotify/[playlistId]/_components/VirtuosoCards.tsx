import { VirtuosoGrid } from 'react-virtuoso'
import OsuCardSet from './OsuCardSet'
import OsuCard from './OsuCard'
import { BeatmapSet } from '@/types/Osu'
import React from 'react'

export default function VirtuosoCards({ sortQuery, maps }: { sortQuery: string; maps: BeatmapSet[][] }) {
   // Virtuoso containers
   const ListContainer = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
      ({ style, children, ...props }, ref) => {
         return (
            <div
               ref={ref}
               {...props}
               className="flex flex-wrap gap-4 p-4"
               style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '1rem',
                  ...style,
                  // style={{ alignContent: 'flex-start' }}
               }}
            >
               {children}
            </div>
         )
      },
   )
   const ItemContainer = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
      ({ children, style, ...props }, ref) => {
         return (
            <div
               ref={ref}
               {...props}
               style={{
                  flexGrow: 1,
                  ...style,
                  minWidth: '400px',
               }}
            >
               {children}
            </div>
         )
      },
   )

   return (
      <VirtuosoGrid
         className="scrollbar"
         style={{ height: 'calc(100vh - 3rem - 127px)' }} // Virtuoso потребує контейнера з визначеною висотою (header 3rem + filters 127px)
         data={maps}
         components={{
            List: ListContainer,
            Item: ItemContainer,
            Header: () => <div className="h-4" />,
            Footer: () => <div className="h-4" />,
         }}
         overscan={250}
         totalCount={maps.length}
         itemContent={(index, data) =>
            data.length > 1 && data.length < 18 ? (
               <OsuCardSet
                  key={data[0].id + index}
                  beatmapsets={data}
                  sortQuery={sortQuery}
                  className="w-full animate-in fade-in duration-500" // ItemContainer - flex-grow -> w-full
               />
            ) : (
               <div className="h-[105px]">
                  <OsuCard key={data[0].id} beatmapset={data[0]} className="w-full animate-in fade-in duration-500 shadow-sm" />
               </div>
            )
         }
      />
   )
}
