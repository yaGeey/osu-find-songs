import { LinearProgress } from '@mui/material'

export default function Progress({ isLoading, value }: { isLoading: boolean; value: number }) {
   return (
      <>
         {isLoading ? (
            <div className="fixed top-0 h-0.75 z-100000 w-screen text-highlight">
               <LinearProgress variant="determinate" value={value} color="inherit" />
            </div>
         ) : (
            <div className="h-0.75 fixed top-0 bg-darker w-screen z-1000"></div>
         )}
      </>
   )
}
