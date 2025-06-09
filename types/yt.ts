export type Thumbnail = {
   url: string
   width: number
   height: number
}

export type Artist = {
   artistId: string
   name: string
}

export type Video = {
   type: 'VIDEO'
   videoId: string
   name: string
   artist: Artist
   duration: number
   thumbnails: Thumbnail[]
}

export type Album = {
   type: 'ALBUM'
   albumId: string
   playlistId: string
   artist: Artist
   year: number
   name: string
   thumbnails: Thumbnail[]
}

export type Playlist = {
   type: 'PLAYLIST'
   playlistId: string
   name: string
   artist: Artist
   thumbnails: Thumbnail[]
}

export type ArtistProfile = {
   type: 'ARTIST'
   artistId: string
   name: string
   thumbnails: Thumbnail[]
}

export type Song = {
   type: 'SONG'
   videoId: string
   name: string
   artist: Artist
   album: string | null
   duration: number
   thumbnails: Thumbnail[]
}

export type Media = Video | Album | Playlist | ArtistProfile | Song
