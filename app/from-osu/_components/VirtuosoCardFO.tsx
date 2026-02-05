import React from 'react'
import { Virtuoso } from 'react-virtuoso'
import GroupSeparator from './GroupSeparator'
import { CombinedSingleSimple } from '@/types/types'
import useFoStore from '@/contexts/useFoStore'
import Card from './Card'
import { ListItem } from '../page'

type RowItem = { type: 'group'; key: string } | { type: 'card'; data: CombinedSingleSimple }

export default function VirtuosoCardFO({ data }: { data: ListItem[] }) {
   return (
      <Virtuoso
         data={data}
         components={{
            Header: () => <div className="h-3" />,
         }}
         itemContent={(_, item) => <Row item={item} />}
         className="scrollbar-default w-full"
         style={{ height: 'calc(100dvh - 48px)' }}
         overscan={200}
         defaultItemHeight={85}
      />
   )
}

function Row({ item }: { item: RowItem }) {
   const current = useFoStore((state) => state.current)
   const sortFnName = useFoStore((state) => state.sortFnName)
   const selectedGroup = useFoStore((state) => state.selectedGroup)

   function handleCardClick(t: CombinedSingleSimple) {
      if (current?.local.id === t.local.id) useFoStore.setState({ current: null })
      else useFoStore.setState({ current: t })
   }

   return (
      <div className="flex justify-end w-full">
         {item.type === 'group' ? (
            <GroupSeparator
               className="-mt-3"
               selected={item.key === selectedGroup}
               onClick={() => useFoStore.setState({ selectedGroup: item.key === selectedGroup ? null : item.key })}
            >
               {item.key}
            </GroupSeparator>
         ) : item.type === 'card' ? (
            <Card
               data={item.data}
               sortFn={sortFnName}
               className="-mt-3 "
               selected={current?.local.id === item.data.local.id}
               onClick={handleCardClick}
            />
         ) : null}
      </div>
   )
}

const ListContainer = ({ style, children, ref, ...props }: React.ComponentProps<'div'>) => {
   return (
      <div ref={ref} {...props} className="flex justify-end w-full" style={style}>
         {children}
      </div>
   )
}
ListContainer.displayName = 'ListContainer'
