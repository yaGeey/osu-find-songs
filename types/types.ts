import { Track } from './Spotify';
import { BeatmapSet } from './Osu';
import { UseQueryResult } from '@tanstack/react-query';

export type Song = {
   title: string;
   author: string;
   text: string;
   id: string;
   image: string;
};
export type SongMin = {
   title: string;
   author: string;
   text: string;
};

export type SongData = {
   beatmapset?: BeatmapSet;
   spotify?: Track[] | null;
   local: Song;
};

export type SongDataQueried = {
   beatmapsetQuery: UseQueryResult<BeatmapSet, unknown>;
   spotifyQuery: UseQueryResult<Track[] | null, unknown>;
   local: Song;
};
