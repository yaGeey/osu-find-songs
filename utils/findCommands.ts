import { MusicBrainzApi } from 'musicbrainz-api';
import { revalidateOsuToken, getBeatmap } from "@/utils/osu";
import axios from "axios";
import { Song } from '@/types/types';
import { searchSongWithConditions } from './Spotify';

export const findSongsSpotify = async (songs: Song[]) => {
      let finded = 0;
      for (const song of songs) {
         const url = await searchSongWithConditions(song);
         if (url) {
            // setSongLinks((p) => [...p, url[0].external_urls.spotify]);
            finded++;
         }
         // console.log(url);
      }
      console.log(finded, songs.length);
   }

export const findSongsYoutube = async (songs: Song[]) => {
   console.log('findSongsYoutube')
   for (const song of songs) {
      // const response = await fetch(`/api?query=${encodeURIComponent(song.text)}`);
      // console.log(await response.json());
      const res = await axios.get(`/api?query=${encodeURIComponent(song.text)}`)
      console.log(res)
   }
}

export const findDetailedInfo = async (songs: Song[]) => {
   const mbApi = new MusicBrainzApi({
      appName: 'osu-find-songs',
      appVersion: '0.1.0',
      appContactInfo: 'user@mail.org',
   });

   for (const song of songs) {
      const query = `query=artist:"${song.author}" AND release:"${song.title}"`;

      const result = await mbApi.search('release-group', { query });
      const links = await mbApi.search('url', { query });
      console.log(result, links);
   }
}

export const findBeatmaps = async (songs: Song[]) => {
   for (const song of songs) {
      const beatmap = await getBeatmap(song.id);
      console.log(beatmap);
   }
}