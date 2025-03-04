'use client'
import Image from "next/image";
import FilterSelector from "@/components/buttons/FilterSelector";
import Switch from "@/components/buttons/Switch";
import SwitchFull from "@/components/buttons/SwitchFull";
import { useCallback, useEffect, useState } from "react";
import { twMerge as tw } from "tailwind-merge";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

export default function TestUIPage() {
   const [unfolded, setUnfolded] = useState(false);
   const params = useParams();
   const pathname = usePathname()
   const { playlistId } = params;

   const [query, setQuery] = useState({ star: '', ar: '', cs: '', od: '', hp: '', bpm: '', length: '', source: '', created: '', updated: '', ranked: '' });
   useEffect(() => {
      const queryString = localStorage.getItem('searchParams');
      if (!queryString) return;
      //!! POPUP Do you want to load the previous search filters?
      // const searchParams = new URLSearchParams(queryString);
   }, []);

   const createQueryString = (name: string, filter: 'gt' | 'lt' | 'eq' | '', value: string) => {
      const filtersDict = { 'gt': '>', 'lt': '<', 'eq': '=' };

      const filterString = value && value != '0' && filter ? filtersDict[filter] : '';
      const newQuery = { ...query, [name]: filterString + value };
      setQuery(newQuery);

      let queryString = '';
      Object.entries(newQuery).forEach(([key, value]) => {
         if (!value || value == '0') return;
         if (!queryString) queryString += '?q=';
         queryString += `${key}${encodeURIComponent(value)}+`;
      });
      queryString = queryString.slice(0, -1);

      window.history.replaceState(null, '', pathname + queryString);
      localStorage.setItem('searchParams', queryString);
   };

   return (
      <div className="overflow-y-hidden max-h-screen min-w-[600px] min-h-[670px] font-inter">
         <div className="fixed -z-10 brightness-[.8] top-0 left-0 w-full h-full">
            <Image
               src='/bg.svg'
               alt="bg"
               width={0} height={0}
               sizes="100vw"
               quality={100}
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
         </div>
         <header className="bg-main shadow-md w-screen h-14 flex justify-between items-center px-4 gap-3">
         </header>

         <main className="flex justify-center items-center h-[calc(100vh-4rem)]">
            <div className="w-4/5 h-full bg-darker">
               <div className={tw("bg-main-darker px-5 py-2 text-white shadow-lg", unfolded && 'pb-5')}>

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

                  {/* Additional filters */}
                  {unfolded && <div className="flex items-start justify-between mt-6 text-[15px]">

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
                           <Switch options={['movie', 'video game', 'series', 'event']} onChange={(val) => createQueryString('source', 'eq', val)} disabled/>
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

                     <div className="flex flex-col gap-2.5 w-[310px]">
                        <div>
                           <h2 className="font-medium text-base">Date characteristics</h2>
                           <hr className="text-main-border border-1"></hr>
                        </div>
                        <section className="flex items-center justify-between">
                           <h4>Created at</h4>
                           <FilterSelector type="date" onChange={(value) => console.log(value)} disabled />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>Updated size</h4>
                           <FilterSelector type="date" onChange={(value) => console.log(value)} disabled />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>Ranked at</h4>
                           <FilterSelector type="date" onChange={(value) => console.log(value)} disabled />
                        </section>
                     </div>

                  </div>}
               </div>
            </div>
         </main>
      </div>
   )
}