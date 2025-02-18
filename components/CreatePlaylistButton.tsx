import { Track } from "@/types/Spotify";
import { AddItemsToPlaylist, createPlaylist } from "@/utils/Spotify";
import { useMutation, type UseQueryResult } from "@tanstack/react-query";
import React, { useState } from "react";
import Modal from "./Modal";
import { Button } from "./Buttons";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function CreatePlaylistButton({ songQueries }: { songQueries: UseQueryResult<Track[] | null, Error>[] }) {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [state, setState] = useState<'error' | 'success' | 'warning' | 'info' | 'loading'>('info');
   const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
   const [onOkayFn, setOnOkayFn] = useState<() => void>(() => { });
   const [onOkayText, setOnOkayText] = useState<string|undefined>('Okay');
   const router = useRouter();
   
   const mutation = useMutation({
      mutationFn: ({ playlistId, uris }: { playlistId: string, uris: string[] }) => AddItemsToPlaylist(playlistId, uris),
   })

   function navigateToAuth() {
      const encodeRedirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!);
      const clientId = process.env.NEXT_PUBLIC_AUTH_SPOTIFY_ID;
      const scope = 'playlist-modify-public playlist-modify-private';
      const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeRedirectUri}&scope=${scope}`;
      router.push(url)
   }

   function handleModal(
      content: React.ReactNode,
      state: 'error' | 'success' | 'warning' | 'info' | 'loading',
      onOkayFn: () => void = () => { },
      onOkayText?: string
   ) {
      setModalContent(content);
      setState(state);
      setOnOkayFn(()=>onOkayFn);
      setOnOkayText(onOkayText);
   }
   
   async function handleCreatePlaylist() {
      setIsModalOpen(true);
      if (!Cookies.get('spotify_oauth_access_token')) {
         handleModal(<h1>You must be logged in your Spotify account to continue!</h1>, 'warning', navigateToAuth, 'Login');
         return;
      }

      if (songQueries.filter(q => q.data).length !== songQueries.length) {
         handleModal(<h1>Some songs are still loading, try again later.</h1>, 'warning',);
         return;
      };
      handleModal(<h1 className="animate-pulse">Creating playlist...</h1>, 'loading');

      const playlist = await createPlaylist({ name: 'Test', description: new Date().toLocaleString() });
      if (!playlist) {
         handleModal(<h1>Failed to create playlist</h1>, 'error');
         return;
      };
      handleModal(<h1 className="animate-pulse">Putting tracks in your playlist...</h1>, 'loading');

      const allTracks = songQueries.map(q => q.data).filter(data => !!data);
      const spotifyStrict = allTracks.filter(tracks => tracks.length !== 20);
      const tracks = spotifyStrict.map(tracks => tracks[0]);

      const promises = [];
      const chunkSize = 100;
      for (let i = 0; i < tracks.length; i += chunkSize) {
         const chunk = tracks.slice(i, i + chunkSize);
         promises.push(mutation.mutateAsync({ playlistId: playlist?.id, uris: chunk.map(track => track.uri) }));
      }

      Promise.all(promises).then(() => {
         handleModal(<>
            <h1>Success! Visit your new playlist:</h1>
            <a href={playlist.external_urls.spotify}>{playlist.external_urls.spotify}</a>
         </>, 'success');
      }).catch(() => {
         handleModal(<h1>Failed to add tracks to playlist</h1>, 'error');
      });
   }

   return (
      <>
         <Button
            onClick={() => handleCreatePlaylist()}
            data-tooltip-id="tooltip-1"
            data-tooltip-content="Create playlist on your Spotify account and populate it with tracks with filter 'Exact Spotify match'"
            className="bg-main-border/50 text-white py-1.5"
         >Create Spotify playlist</Button>

         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onOkay={onOkayFn}
            state={state}
            okBtn={onOkayText}
            closeBtn="Close"
         >
            {modalContent}
         </Modal>
      </>
   )
}