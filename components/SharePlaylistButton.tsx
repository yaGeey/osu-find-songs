import { Button } from "./Buttons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-regular-svg-icons";
import { twMerge as tw } from "tailwind-merge";
import { SongDataQueried } from "@/types/types";
import { usePathname, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ToastContainer, toast } from 'react-toastify';

export default function SharePlaylistButton({ data, className }: { data: SongDataQueried[], className?: string }) {
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const ids = data.map(song => song.beatmapsetQuery.data?.id);

   const mutation = useMutation({
      mutationFn: async () => {
         const res = await fetch('/api/playlist', {
            method: 'POST',
            body: JSON.stringify({ beatmapsets: ids })
         });
         const data = await res.json();

         const shareUrl = `${pathname}?id=${data.id}`;
         window.history.replaceState(null, '', shareUrl);
         navigator.clipboard.writeText(shareUrl);
      }
   })

   function handleClick() {
      if (searchParams.has('id')) return;
      mutation.mutateAsync();
      toast('Playlist link copied to clipboard!', {
         position: "bottom-right",
         autoClose: 3000,
         hideProgressBar: true,
      });
   }
   
   return (
      <>
         <Button className={tw("bg-main-border/50", className)} onClick={handleClick} disabled>Share
            <FontAwesomeIcon icon={faShareFromSquare} className="ml-1.5 text-md mt-0.5" />
         </Button>
         <ToastContainer />
      </>
   )
}
// disabled = { searchParams.has('id')}