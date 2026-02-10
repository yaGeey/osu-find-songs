import { VirtuosoGrid } from 'react-virtuoso'
import { BeatmapSet } from '@/types/Osu'
import React from 'react'
import { CardRenderer } from './CardRenderer'

const ListContainer = ({ style, children, ref, ...props }: React.ComponentProps<'div'>) => {
   return (
      <div ref={ref} {...props} className="grid grid-cols-1 [@media(min-width:810px)]:grid-cols-2 gap-2.5 p-2.5" style={style}>
         {children}
      </div>
   )
}
ListContainer.displayName = 'ListContainer'

export default function VirtuosoCards({ sortQuery, maps }: { sortQuery: string; maps: BeatmapSet[][] }) {
   return (
      <VirtuosoGrid
         className="scrollbar"
         style={{ height: 'calc(100dvh - 48px - 156px)' }}
         data={maps}
         components={{
            List: ListContainer,
            Header: () => <div className="h-3" />,
            Footer: () => <div className="h-3" />,
         }}
         overscan={200}
         totalCount={Math.round(maps.length / 2)}
         itemContent={(_, data) => <CardRenderer key={data[0].id} data={data} sortQuery={sortQuery} />}
      />
   )
}
