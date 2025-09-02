type ExternalUrls = {
   spotify: string
}

type Image = {
   height: number
   width: number
   url: string
}

export type ArtistFull = {
   external_urls: ExternalUrls
   href: string
   id: string
   name: string
   type: 'artist'
   uri: string
}

export type AlbumFull = {
   album_type: 'single' | 'album' | 'compilation'
   artists: ArtistFull[]
   available_markets: string[]
   external_urls: ExternalUrls
   href: string
   id: string
   images: Image[]
   is_playable: boolean
   name: string
   release_date: string
   release_date_precision: 'year' | 'month' | 'day'
   total_tracks: number
   type: 'album'
   uri: string
}

type ExternalIds = {
   isrc: string
}

export type TrackFull = {
   album: Album
   artists: ArtistFull[]
   available_markets: string[]
   disc_number: number
   duration_ms: number
   explicit: boolean
   external_ids: ExternalIds
   external_urls: ExternalUrls
   href: string
   id: string
   is_local: boolean
   is_playable: boolean
   name: string
   popularity: number
   preview_url: string | null
   track_number: number
   type: 'track'
   uri: string
}
export type Album = Omit<AlbumFull, 'available_markets' | 'artists' | 'href' | 'id' | 'total_tracks' | 'uri' | 'is_playable'>
export type Artist = Omit<ArtistFull, 'id' | 'type' | 'uri'>
export type Track= {
   album: Album
   artists: Artist[]
   duration_ms: number
   external_urls: ExternalUrls
   name: string
   popularity: number
   uri: string
}

export type Playlist = {
   collaborative: boolean
   description: string
   external_urls: {
      spotify: string
   }
   followers: {
      href: string | null
      total: number
   }
   href: string
   id: string
   images: any[]
   name: string
   owner: {
      href: string
      id: string
   }
   primary_color: string | null
   public: boolean
   snapshot_id: string
   tracks: {
      href: string
      items: Track[]
      limit: number
      next: string | null
      offset: number
      previous: string | null
      total: number
   }
   type: string
   uri: string
}

export type PageItem = {
   added_at: string
   added_by: {
      external_urls: ExternalUrls
      href: string
      id: string
      type: string
      uri: string
   }
   is_local: boolean
   primary_color: string | null
   track: TrackFull
   video_thumbnail: {
      url: string
   }
}

export type PlaylistPage = {
   href: string
   items: PageItem[]
   limit: number
   next: string | null
   offset: number
   previous: string | null
   total: number
}

export type SpotifyError = {
   error: {
      status: number
      message: string
   }
}

export type SpotifyAuthResponse = {
   access_token: string
   expires_in: number
   token_type: string
   refresh_token?: string
}