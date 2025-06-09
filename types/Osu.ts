export type Beatmap = {
  accuracy: number;
  ar: number;
  beatmapset_id: number;
  bpm: number;
  checksum: string;
  convert: boolean;
  count_circles: number;
  count_sliders: number;
  count_spinners: number;
  cs: number;
  deleted_at: string | null;
  difficulty_rating: number;
  drain: number;
  hit_length: number;
  id: number;
  is_scoreable: boolean;
  last_updated: string;
  max_combo: number;
  mode: string;
  owners: {
    id: number;
    username: string;
  }[];
  passcount: number;
  playcount: number;
  ranked: number;
  status: string;
  total_length: number;
  url: string;
  user_id: number;
  version: string;
};

export type BeatmapSet = {
  artist: string;
  artist_unicode: string;
  covers: {
    cover: string;
    card: string;
    list: string;
    slimcover: string;
  };
  availability: {
    download_disabled: boolean;
    more_information: string | null;
  };
  beatmaps: Beatmap[];
  bpm: number;
  can_be_hyped: boolean;
  converts: Beatmap[];
  creator: string;
  deleted_at: string | null;
  discussion_enabled: boolean;
  discussion_locked: boolean;
  favourite_count: number;
  genre: {
    id: number;
    name: string;
  };
  id: number;
  is_scoreable: boolean;
  language: {
    id: number;
    name: string;
  };
  last_updated: string;
  legacy_thread_url: string | null;
  nsfw: boolean;
  play_count: number;
  preview_url: string;
  source: string | null;
  spotlight: boolean;
  status: string;
  storyboard: boolean;
  tags: string;
  title: string;
  title_unicode: string;
  track_id: number | null;
  user_id: number;
  video: boolean;
  ranked: number;
  ranked_date: string | null;
  submitted_date: string;
  rating: number;
};
