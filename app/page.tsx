import Link from "next/link";
import { Button } from "@/components/Buttons";

export default function LandingPage() {
   return (
      <div className="flex flex-col justify-center items-center h-screen bg-main">
         <h1 className="text-3xl text-white">Welcome to the landing page!</h1>
         <h2 className="text-2xl text-white">Шо хоч</h2>
         <div className="flex gap-4 mt-10">
            <Link href="/playlist/select">
               <Button className="text-white">Find beatmaps links</Button>
            </Link>
            <Link href="/">
               <Button className="text-white" disabled>Spotify playlist to beatmaps</Button>
            </Link>
         </div>
      </div>
   )
}