'use client'
import FilterSelector from "@/components/buttons/FilterSelector";
import Switch from "@/components/buttons/Switch";
import SwitchFull from "@/components/buttons/SwitchFull";
import SwitchSort from "@/components/buttons/SwitchSort";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { twMerge as tw } from "tailwind-merge";

export default function Filters({ onChangeSort }: {
   onChangeSort: (query: string, searchType:'local'|'api') => void,
}) {
   const pathname = usePathname()
   const router = useRouter()

   const [query, setQuery] = useState('')
   const [sortQuery, setSortQuery] = useState('')
   
   const [unfolded, setUnfolded] = useState(false);
   const [queryDict, setQueryDict] = useState<{ [key: string]: string }>({});
   const [searchType, setSearchType] = useState<'local' | 'api'>('api');

   // creating query 
   const createQueryString = (name: string, filter: 'gt' | 'lt' | 'eq' | '', value: string) => {
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

   return (
      <div className={tw("bg-main-darker z-110 sticky top-[56px] px-5 py-2 text-white shadow-tight text-nowrap", unfolded && 'pb-5')}>

         {/* Main filters */}
         <div className="flex items-center justify-between text-[15px]">
            <section className="flex items-center gap-4">
               <h4>Star rating</h4>
               <FilterSelector min={0} max={10} type="number" onChange={(val, filter) => createQueryString('star', filter, val)} />
            </section>
            <section className="flex items-center gap-4">
               <h4 >State</h4>
               <SwitchFull options={['ranked', 'loved', 'approved', 'pending']} onChange={(val) => createQueryString('status', 'eq', val)} />
            </section>
            <button className="selected bg-darker rounded-full px-4 py-1.5" onClick={() => setUnfolded(p => !p)}>
               More filters {unfolded ? <span className="writing-mode-vertical-lr">&lt;</span> : <span className="writing-mode-vertical-rl">&gt;</span>}
            </button>
         </div>
         <div className="flex items-center gap-4 mt-4 text-[15px]">
            <h4>Sort by</h4>
            <SwitchSort options={['title', 'artist', 'difficulty', 'ranked', 'rating', 'plays', 'favorites', 'relevance']} onChange={(val, sort) => {
               if (val) {
                  const query = `sort=${val}_${sort}`;
                  setSortQuery(query);
                  onChangeSort(query, searchType);
               }
            }} />
            {/* <SwitchFull required options={['local', 'osu! search']} defaultValue={0} onChange={(val) => setSearchType(val=='local' ? 'local' : 'api')} /> */}
         </div>

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