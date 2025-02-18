'use client'
import { createPlaylist } from '@/utils/Spotify';
import { useEffect, useState } from 'react';

export default function Test() {
   const [spotifyAuthUrl, setSpotifyAuthUrl] = useState('');

   useEffect(() => {
      const encodeRedirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!);
      const clientId = process.env.NEXT_PUBLIC_AUTH_SPOTIFY_ID;
      const scope = 'playlist-modify-public playlist-modify-private';
      const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeRedirectUri}&scope=${scope}`;
      setSpotifyAuthUrl(url);
   }, []);

   return (
      <div>
         <div>Hello </div>
         <a href={spotifyAuthUrl}>Sign in with Spotify</a>
         <button onClick={() => createPlaylist({ name: 'Test', description: 'Test description' })}>Test read</button>
      </div>
   );
}