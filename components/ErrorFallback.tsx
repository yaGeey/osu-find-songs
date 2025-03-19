import { Button } from "./Buttons";

export default function ErrorCallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
   return (
      <div role="alert" className="bg-main-lighter p-4 h-screen flex flex-col justify-center items-center">
         <div className="flex flex-col justify-center items-center gap-2">
            <h2 className="text-xl font-semibold">What the....</h2>
            <p className="text-xl font-semibold">Something went wrong</p>
            <pre>No kitten image, sorry</pre>
            <Button onClick={resetErrorBoundary} className="text-black bg-main mt-5">Try again</Button>
         </div>
      </div>
   )
}