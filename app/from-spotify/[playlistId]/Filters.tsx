'use client'
import FilterSelector from "@/components/buttons/FilterSelector";
import Switch from "@/components/buttons/Switch";
import SwitchFull from "@/components/buttons/SwitchFull";
import SwitchFullDict from "@/components/buttons/SwitchFullDict";
import SwitchSort from "@/components/buttons/SwitchSort";
import Loading from "@/components/state/Loading";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { twMerge as tw } from "tailwind-merge";

export default function Filters({ onChange }: {
   onChange: (sortBy: string, searchType: 'local' | 'api', mode: string) => void,
}) {
   const pathname = usePathname()
   const router = useRouter()

   const [query, setQuery] = useState('')
   const [sortQuery, setSortQuery] = useState('')
   const [modeQuery, setModeQuery] = useState('')
   
   const [unfolded, setUnfolded] = useState(false);
   const [queryDict, setQueryDict] = useState<{ [key: string]: string }>({});
   const [searchType, setSearchType] = useState<'local' | 'api'>('api');

   // creating query 
   const createQueryString = (name: string, filter: 'gt' | 'lt' | 'eq' | '', value: string, valueIsZero='') => {
      const filtersDict = { 'gt': '>', 'lt': '<', 'eq': '=' };

      const filterString = value && value != '0' && filter ? filtersDict[filter] : '';
      const newQuery = { ...queryDict, [name]: filterString + value };
      setQueryDict(newQuery);

      let queryString = '';
      Object.entries(newQuery).forEach(([key, value]) => {
         if (!value || value == '0') return;
         if (!queryString) queryString += '?q=';
         queryString += `${key}${encodeURIComponent(value)}+`;
      });
      queryString = queryString.slice(0, -1);

      setQuery(queryString);
   };
   useEffect(() => {
      let symbol = '';
      if (sortQuery) symbol = query ? '&' : '?';
      // window.history.replaceState(null, '', pathname + query + symbol + sortQuery);
      router.replace(pathname + query + symbol + sortQuery)
   }, [query, sortQuery]);
   useEffect(() => {
      let symbol = '';
      if (modeQuery) symbol = query ? '&' : '?';
      router.replace(pathname + query + symbol + modeQuery)
   }, [query, modeQuery]);

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
               <SwitchFullDict className="font-inter" options={{ 'osu!': '0', 'osu!taiko': '1', 'osu!catch': '2', 'osu!mania': '3' }} onChange={(val) => {
                  const query = val ?'m=' + val : '';
                  setModeQuery(query);
                  onChange(sortQuery, searchType, query);
               }} />
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
               onChange={(val) => createQueryString('status', 'eq', val)}
            />
         </section>
         <section className="flex items-center gap-4 mt-3 text-[15px]">
            <h4>Sort by</h4>
            <SwitchSort options={['title', 'artist', 'difficulty', 'ranked', 'rating', 'plays', 'favorites', 'relevance']} onChange={(val, sort) => {
               if (val) {
                  const query = `sort=${val}_${sort}`;
                  setSortQuery(query);
                  onChange(query, searchType, modeQuery);
               }
            }} />
         </section>

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
                  <Switch options={['movie', 'video game', 'series', 'event']} onChange={(val) => createQueryString('source', 'eq', val)} disabled />
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
                  <h4>Updated size</h4>
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