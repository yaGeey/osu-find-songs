import { VirtuosoGrid } from 'react-virtuoso'
import { BeatmapSet } from '@/types/Osu'
import React from 'react'
import { CardRenderer } from './CardRenderer'

const ListContainer = ({ style, children, ref, ...props }: React.ComponentProps<'div'>) => {
   return (
      <div ref={ref} {...props} className="flex flex-wrap gap-3 p-3 content-start pb-3" style={style}>
         {children}
      </div>
   )
}
ListContainer.displayName = 'ListContainer'

const ItemContainer = ({ style, children, ref, ...props }: React.ComponentProps<'div'>) => (
   <div ref={ref} {...props} style={{ ...style, minWidth: '400px', flex: '1 1 400px' }}>
      {children}
   </div>
)
ItemContainer.displayName = 'ItemContainer'

export default function VirtuosoCards({ sortQuery, maps }: { sortQuery: string; maps: BeatmapSet[][] }) {
   return (
      <VirtuosoGrid
         className="scrollbar"
         style={{ height: 'calc(100dvh - 48px - 156px)' }}
         data={maps}
         components={{
            List: ListContainer,
            Item: ItemContainer,
            Header: () => <div className="h-3" />,
            Footer: () => <div className="h-4" />,
         }}
         overscan={200}
         height={105}
         totalCount={Math.round(maps.length / 2)}
         itemContent={(_, data) => <CardRenderer key={data[0].id} data={data} sortQuery={sortQuery} />}
      />
   )
}
