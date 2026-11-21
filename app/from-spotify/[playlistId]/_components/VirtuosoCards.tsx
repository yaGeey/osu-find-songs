import { VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso'
import { BeatmapSet } from '@/types/Osu'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CardRenderer } from './CardRenderer'
import { Queries } from '../page'

const ENTER_WINDOW_MS = 600

const ListContainer = ({ style, children, ref, ...props }: React.ComponentProps<'div'>) => {
   return (
      <div
         ref={ref}
         {...props}
         className="grid grid-cols-1 [@media(min-width:810px)]:grid-cols-2 gap-2.5 p-2.5"
         style={style}
      >
         {children}
      </div>
   )
}
ListContainer.displayName = 'ListContainer'

const ListHeader = () => <div className="h-3" />
const ListFooter = () => <div className="h-3" />
const gridComponents = { List: ListContainer, Header: ListHeader, Footer: ListFooter }
const gridStyle = { height: 'calc(100dvh - 48px - 156px)' }
const computeItemKey = (_index: number, data: BeatmapSet[]) => data[0].id

function VirtuosoCards({ queries, maps }: { queries: Queries; maps: BeatmapSet[][] }) {
   const gridRef = useRef<VirtuosoGridHandle>(null)
   const resetKey = JSON.stringify(queries)
   const generation = useMemo(() => (maps.length ? maps.map((m) => m[0].id).join() : 'empty'), [maps])
   const [enteredGeneration, setEnteredGeneration] = useState<string | null>(null)
   const isEntering = enteredGeneration !== generation

   useEffect(() => {
      const timeout = setTimeout(() => setEnteredGeneration(generation), ENTER_WINDOW_MS)
      return () => clearTimeout(timeout)
   }, [generation])

   useEffect(() => {
      gridRef.current?.scrollToIndex(0)
   }, [resetKey])

   const itemContent = useCallback(
      (index: number, data: BeatmapSet[]) => (
         <motion.div
            // resetKey in the key forces a remount only on sort/filter/search changes, so the
            // entrance stagger replays for all visible cards. Appends and scrolling keep the
            // id-based reuse from computeItemKey (no image re-decode on those).
            key={`${resetKey}:${data[0].id}`}
            initial={isEntering ? { opacity: 0, y: 8, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
               type: 'spring',
               duration: 0.5,
               bounce: 0.3,
               delay: Math.min(index, 12) * 0.03,
            }}
         >
            <CardRenderer data={data} sortQuery={queries.sort} />
         </motion.div>
      ),
      [isEntering, resetKey],
   )

   return (
      <VirtuosoGrid
         ref={gridRef}
         className="scrollbar"
         style={gridStyle}
         data={maps}
         components={gridComponents}
         computeItemKey={computeItemKey}
         overscan={{ main: 400, reverse: 200 }}
         itemContent={itemContent}
         increaseViewportBy={{ top: 200, bottom: 400 }}
      />
   )
}

export default memo(VirtuosoCards)
