
export default function InitialLoadPage() {
   return (
      <>
         <div className="text-white z-10 absolute top-0 w-full h-[70px] bg-main-dark-vivid/35 backdrop-blur-sm flex items-center justify-center gap-8 px-5">
            <div className="flex gap-3 items-center group">
               <h1 className="text-3xl font-medium tracking-tight group-hover:text-main-lightest transition-colors">
                  osufindsongs
               </h1>
            </div>
         </div>
         <div className="text-white z-10 absolute bottom-0 w-full h-[70px] bg-main-dark-vivid/35 backdrop-blur-sm flex items-center justify-center">
            <p className="text-base  text-center">Consider starring ⭐ this GitHub repo if you like this app!</p>
         </div>
      </>
   )
}
