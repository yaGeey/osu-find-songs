'use client'
export default function ErrorBackdrop() {
   return (
      <div className={`absolute top-0 left-0 w-full h-full flex justify-center items-center z-50 [backdrop-filter:blur(1.5px)]`}>
         <span className="text-red-700 text-6xl mb-1.5">&times;</span>
      </div>
   )
}