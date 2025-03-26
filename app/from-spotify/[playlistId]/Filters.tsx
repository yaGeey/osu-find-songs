'use client'
import FilterSelector from "@/components/switches/FilterSelector";
import Switch from "@/components/switches/Switch";
import SwitchFullDict from "@/components/switches/SwitchFullDict";
import SwitchSort from "@/components/switches/SwitchSort";
import { useEffect, useState } from "react";
import { twMerge as tw } from "tailwind-merge";
import { parseAsInteger, useQueryState } from "nuqs";
import { Tooltip } from "react-tooltip";
// TODO If =1 then res: 1 - 1.99 

export default function Filters({ onChange, foundString, onSortButtonClick }: {
   onChange: (sortBy: string, searchType: 'local' | 'api', mode: string) => void,
   foundString?: string,
   onSortButtonClick?: () => void,
}) {
   const [q, setQ] = useQueryState('q', { defaultValue: '' })
   const [m, setM] = useQueryState('m', { defaultValue: '' })
   const [s, setS] = useQueryState('s', { defaultValue: '' })
   const [sort, setSort] = useQueryState('sort', { defaultValue: '' })
   // useEffect(() => { if (sort) setSort('') }, []) //? don't work, don't know why it's not clearing

   const [unfolded, setUnfolded] = useState(false);
   const [queryDict, setQueryDict] = useState<{ [key: string]: string }>({});
   const [searchType, setSearchType] = useState<'local' | 'api'>('api');

   // creating query 
   const createQueryString = (name: string, operator: '<' | '=' | '>' | '', value: string) => {
      const operatorRes = value && value != '0' && operator ? operator : '';
      const newQuery = { ...queryDict, [name]: operatorRes + value };
      setQueryDict(newQuery);

      const queryString = Object.entries(newQuery).flatMap(([key, value]) => {
         if (!value || value == '0' || value == '') return [];
         return `${key}${value}`;
      }).join(' ');
      setQ(queryString);
   };

   return (
      <div className={tw("bg-main-darker z-110 sticky top-[56px] px-5 py-2 text-white shadow-tight text-nowrap", unfolded && 'pb-5')}>

         {/* Main filters */}
         <div className="flex items-center justify-between text-[15px]">
            <section className="flex items-center gap-4">
               <h4>Star rating</h4>
               <FilterSelector min={0} max={10} type="number" onChange={(val, filter) => createQueryString('star', filter, val)} />
            </section>
            <div className="flex items-center gap-4  text-[15px]">
               <h4>Mode</h4>
               <SwitchFullDict className="font-inter" options={{ 'osu!': '0', 'osu!taiko': '1', 'osu!catch': '2', 'osu!mania': '3' }} onChange={(val) => setM(val)} />
            </div>
            <button className="selected bg-darker rounded-full px-4 py-1.5" onClick={() => setUnfolded(p => !p)}>
               More filters {unfolded ? <span className="writing-mode-vertical-lr">&lt;</span> : <span className="writing-mode-vertical-rl">&gt;</span>}
            </button>
         </div>
         <section className="flex items-center gap-4 mt-3 text-[15px]">
            <h4>State</h4>
            <SwitchFullDict
               className='ml-3.5 font-inter'
               required
               defaultValue='has leaderboard'
               options={{ 'any': 'any', 'has leaderboard': '', 'ranked': 'ranked', 'loved': 'loved', 'approved': 'approved', 'pending': 'pending' }}
               onChange={(val) => setS(val)}
            />
         </section>
         <section className="flex items-center gap-4 mt-3 text-[15px]">
            <h4>Sort by</h4>
            <SwitchSort
               options={['title', 'artist', 'difficulty', 'ranked', 'rating', 'plays', 'favorites', 'relevance']}
               onChange={(val, sort) => { if (val) setSort(`${val}_${sort}`) }}
               defaultOption={sort.split('_')[0]}
               defaultSort={sort.split('_')[1] as 'asc' | 'desc'}
            />
            {/* <button onClick={onSortButtonClick}>Sort locally</button> */}
         </section>
         {foundString && <div className="absolute animate-in fade-in right-6 bottom-2 text-white/70 font-outline-sm tracking-wider text-base hidden lg:block">{foundString} <span className="text-sm">found</span></div>}


         {/* Additional filters */}
         {unfolded && <div className="flex items-start justify-evenly lgx:justify-between mt-6 text-[15px]">

            <div className="flex flex-col gap-2.5 w-[290px]">
               <div>
                  <h2 className="font-medium text-base">Song characteristics</h2>
                  <hr className="text-main-border border-1"></hr>
               </div>
               <section className="flex items-center justify-between">
                  <h4>Length</h4>
                  <FilterSelector min={0} max={1800} step={10} type="number" onChange={(val, filter) => createQueryString('length', filter, val)} />
               </section>
               <section className="flex items-center justify-between">
                  <h4>BPM</h4>
                  <FilterSelector min={0} max={500} step={10} type="number" onChange={(val, filter) => createQueryString('bpm', filter, val)} />
               </section>
               <section className="flex items-center justify-between">
                  <h4>Source</h4>
                  <Switch options={['movie', 'video game', 'series', 'event']} onChange={(val) => createQueryString('source', '=', val)} disabled />
               </section>
            </div>

            <div className="flex flex-col gap-2.5 w-[300px]">
               <div>
                  <h2 className="font-medium text-base">Beatmap characteristics</h2>
                  <hr className="text-main-border border-1"></hr>
               </div>
               <section className="flex items-center justify-between">
                  <h4>Approach rate</h4>
                  <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('ar', filter, val)} />
               </section>
               <section className="flex items-center justify-between">
                  <h4>Circle size</h4>
                  <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('cs', filter, val)} />
               </section>
               <section className="flex items-center justify-between">
                  <h4>Overall difficulty</h4>
                  <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('od', filter, val)} />
               </section>
               <section className="flex items-center justify-between">
                  <h4>HP drain rate</h4>
                  <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('hp', filter, val)} />
               </section>
            </div>

            <div className="flex-col gap-2.5 w-[310px] hidden lgx:flex">
               <div>
                  <h2 className="font-medium text-base">Date characteristics</h2>
                  <hr className="text-main-border border-1"></hr>
               </div>
               <section className="flex items-center justify-between">
                  <h4>Created at</h4>
                  <FilterSelector type="date" onChange={(val, filter) => createQueryString('created', filter, val)} disabled />
               </section>
               <section className="flex items-center justify-between">
                  <h4>Updated at</h4>
                  <FilterSelector type="date" onChange={(val, filter) => createQueryString('updated', filter, val)} disabled />
               </section>
               <section className="flex items-center justify-between">
                  <h4>Ranked at</h4>
                  <FilterSelector type="date" onChange={(val, filter) => createQueryString('ranked', filter, val)} disabled />
               </section>
            </div>

         </div>}
      </div>
   )
}