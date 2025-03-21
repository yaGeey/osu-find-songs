'use server'
import { cookies } from 'next/headers'
import { Song } from "@/types/types";
import {conditions, hardConditions, applyAlwaysConditions} from '../utils/conditions';
import { Playlist } from '@/types/Spotify';

export const findSong = async (song: Song) => {
   let token = (await cookies()).get('spotifyToken')?.value
   if (!token) token = await revalidateSpotifyToken();

   const query = `artist:${song.author} track:${song.title}`;
   const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
      headers: { Authorization: `Bearer ${token}` }
   })
   if (!response.ok) throw new Error(await response.text());
   return await response.json();
}

export const findSongQuery = async (song: Song) => {
   let token = (await cookies()).get('spotifyToken')?.value
   if (!token) token = await revalidateSpotifyToken();

   const query = `${song.author} - ${song.title}`;
   const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
      headers: { Authorization: `Bearer ${token}` }
   })
   if (!response.ok) throw new Error(await response.text());
   return await response.json(); 
}

export const searchSongWithConditions = async (song: Song): Promise<[any] | null> => {
   let modifiedSong = applyAlwaysConditions(song);
   
   for (const condition of conditions) {
      const conditionSearch = condition(modifiedSong);
      if (!conditionSearch) continue;
      else modifiedSong = conditionSearch;

      const result = await findSong(modifiedSong);
      if (result.tracks.items.length) return result.tracks.items;
      console.warn(`Song not found: ${modifiedSong.author} - ${modifiedSong.title}`);
   }

   for (const condition of hardConditions) {
      const hardSearch = condition(modifiedSong);
      
      const result = await findSongQuery(hardSearch);
      if (result.tracks.items.length) return result.tracks.items;
      console.warn(`Song not found after HARD: ${hardSearch.author} - ${hardSearch.title}`);
   }

   console.error(`!!! Song not found after all tries`);
   return null
}

export async function revalidateSpotifyToken(): Promise<string | undefined> {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AUTH_SPOTIFY_ID!,
      client_secret: process.env.AUTH_SPOTIFY_SECRET!,
   });

   try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: body.toString(),
      });
      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(errorText);
      }

      const data: {
         access_token: string;
         expires_in: number;
         token_type: string;
      } = await response.json();
      console.log(data);

      const storage = await cookies();
      storage.set('spotifyToken', data.access_token, { path: '/', expires: new Date(Date.now() + data.expires_in * 1000) });
      return data.access_token;
   } catch (error) {
      console.error('Error fetching token:', error);
   }
}

export async function getPlaylist(playlistId: string) {
   let token = (await cookies()).get('spotifyToken')?.value
   if (!token) token = await revalidateSpotifyToken();

   const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` }
   })

   if (!response.ok) throw new Error(await response.text());
   return await response.json();
}

export async function fetchMyProfile() {
   let token = (await cookies()).get('spotify_oauth_access_token')?.value
   if (!token) {
      console.error('No access token found');
      return;
   };

   const response = await fetch('https://api.spotify.com/v1/me', {
      method: "GET", headers: { Authorization: `Bearer ${token}` }
   })
   console.log(response);

   if (!response.ok) throw new Error(await response.text());
   return await response.json();
}

export async function createPlaylist({ userId, name, description, isPublic = false, collaborative = false }:
   { userId: string, name: string, isPublic?: boolean, collaborative?: boolean, description: string }): Promise<Playlist | undefined> {
   
   let token = (await cookies()).get('spotify_oauth_access_token')?.value
   if (!token) {
      console.error('No access token found');
      return;
   };

   const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, public: isPublic, collaborative, description })
   })

   if (!response.ok) throw new Error(await response.text());
   const data = await response.json();
   return data;
}

export async function AddItemsToPlaylist(playlistId: string, uris: string[]) {
   let token = (await cookies()).get('spotify_oauth_access_token')?.value
   if (!token) {
      console.error('No access token found');
      return;
   };

   if (uris.length > 100) throw new Error('Max 100 tracks per request, got '+uris.length);

   const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris, position: 0 })
   })

   if (!response.ok) throw new Error(await response.text());
   return await response.json();
}

export async function OAuthAuthorization(code: string) {
   const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NEXT_PUBLIC_URL! + '/auth/spotify/callback',
      client_id: process.env.AUTH_SPOTIFY_ID!,
      client_secret: process.env.AUTH_SPOTIFY_SECRET!,
   });

   const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
   });

   if (!response.ok) throw new Error(await response.text())
   const data = await response.json();
   
   const storage = await cookies();
   storage.set('spotify_oauth_refresh_token', data.refresh_token, { maxAge: data.expires_in });
   return data;
}

export async function fetchWithToken(url: string) {
   let token = (await cookies()).get('spotifyToken')?.value
   if (!token) token = await revalidateSpotifyToken();

   const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
   });

   if (!response.ok) throw new Error(await response.text());
   return await response.json();
}