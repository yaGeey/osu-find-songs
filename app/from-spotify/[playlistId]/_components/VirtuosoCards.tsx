import { VirtuosoGrid } from 'react-virtuoso'
import OsuCardSet from './OsuCardSet'
import OsuCard from './OsuCard'
import { BeatmapSet } from '@/types/Osu'
import React, { useMemo } from 'react'

const ListContainer = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(({ style, children, ...props }, ref) => {
   return (
      <div ref={ref} {...props} className="flex flex-wrap gap-4 p-4 content-start" style={style}>
         {children}
      </div>
   )
})
ListContainer.displayName = 'ListContainer'

const ItemContainer = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(({ children, style, ...props }, ref) => {
   return (
      <div
         ref={ref}
         {...props}
         style={{
            ...style,
            minWidth: '400px',
            flex: '1 1 400px',
         }}
      >
         {children}
      </div>
   )
})
ItemContainer.displayName = 'ItemContainer'

export default function VirtuosoCards({ sortQuery, maps }: { sortQuery: string; maps: BeatmapSet[][] }) {
   return (
      <VirtuosoGrid
         className="scrollbar"
         style={{ height: 'calc(100vh - 3rem - 127px)' }}
         data={maps}
         components={{
            List: ListContainer,
            Item: ItemContainer,
            Header: () => <div className="h-4" />,
            Footer: () => <div className="h-4" />,
         }}
         overscan={300}
         totalCount={maps.length}
         itemContent={(index, data) => {
            if (data.length > 1 && data.length < 18) {
               return <OsuCardSet key={data[0].id} beatmapsets={data} sortQuery={sortQuery} className="w-full" />
            }

            return (
               <div className="h-[105px]">
                  <OsuCard key={data[0].id} beatmapset={data[0]} className="w-full shadow-sm" />
               </div>
            )
         }}
      />
   )
}
