import { VirtuosoGrid } from 'react-virtuoso'
import { BeatmapSet } from '@/types/Osu'
import { CardRenderer } from './CardRenderer'
import { motion } from 'framer-motion'
import { memo } from 'react'

// Окремий компонент-обгортка для анімації
// memo запобігає зайвим ререндерам, коли Virtuoso оновлює сусідні елементи
const AnimatedItem = memo(({ index, children }: { index: number; children: React.ReactNode }) => {
   // Логіка затримки (Stagger):
   // Для перших 20 елементів (видимий екран) робимо каскадну затримку.
   // Для елементів, що з'являються при скролі (index > 20), затримка мінімальна,
   // щоб користувач не чекав появи контенту при швидкому прокручуванні.
   const isInitialItem = index < 10
   const delay = isInitialItem ? (index % 5) * 0.05 : 0

   return (
      <motion.div
         // Початковий стан при монтуванні компонента Virtuoso
         initial={{ opacity: 0, y: 20, scale: 0.96 }}
         // Кінцевий стан - запускається автоматично при монтуванні
         animate={{ opacity: 1, y: 0, scale: 1 }}
         // Анімація виходу не потрібна для віртуалізації, бо елемент просто зникає
         transition={{
            duration: 0.4,
            delay: delay, // Індивідуальна затримка
            ease: 'easeOut',
            type: 'spring',
            bounce: 0, // Прибираємо bounce для списків, щоб не було "тремтіння" тексту
         }}
         // Важливо: viewport={{ once: true }} гарантує, що анімація не скинеться,
         // якщо елемент трохи вийде за межі overscan і повернеться назад.
         viewport={{ once: true }}
         className="h-full" // Гарантуємо, що обгортка займає весь простір
      >
         {children}
      </motion.div>
   )
})

AnimatedItem.displayName = 'AnimatedItem'

export default function VirtuosoCards({ sortQuery, maps }: { sortQuery: string; maps: BeatmapSet[][] }) {
   // Батьківський компонент тепер чистий від логіки анімації
   return (
      <div className="flex-1 flex flex-col overflow-hidden">
         <VirtuosoGrid
            className="scrollbar"
            listClassName="grid grid-cols-1 [@media(min-width:810px)]:grid-cols-2 gap-2.5 p-2.5"
            style={{ height: 'calc(100dvh - 48px - 156px)' }}
            data={maps}
            overscan={400} // Збільшений overscan робить скрол плавнішим, завантажуючи елементи заздалегідь
            components={{
               Header: () => <div className="h-3" />,
               Footer: () => <div className="h-3" />,
            }}
            totalCount={Math.round(maps.length / 2)}
            itemContent={(index, data) => (
               // Передаємо index для розрахунку затримки
               <AnimatedItem index={index} key={data[0].id}>
                  <CardRenderer data={data} sortQuery={sortQuery} />
               </AnimatedItem>
            )}
         />
      </div>
   )
}
