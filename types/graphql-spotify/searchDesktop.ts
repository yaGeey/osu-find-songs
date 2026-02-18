export type SpotifySearchQueryResponse = {
   data: {
      searchV2: SpotifySearchV2
   }
   extensions: {
      requestIds: Record<string, Record<string, string>>
   }
}

// --- Main Search Structure ---

export interface SpotifySearchV2 {
   chipOrder: {
      items: { typeName: string }[]
   }
   albumsV2: {
      __typename: 'AlbumOrPrereleasePage'
      totalCount: number
      items: AlbumResponseWrapper[]
   }
   artists: {
      items: ArtistResponseWrapper[]
      totalCount: number
   }
   tracksV2: {
      items: {
         item: TrackResponseWrapper
         matchedFields: string[]
      }[]
      totalCount: number
   }
   playlists: {
      items: PlaylistResponseWrapper[]
      totalCount: number
   }
   podcasts: {
      items: PodcastResponseWrapper[]
      totalCount: number
   }
   episodes: {
      items: EpisodeResponseWrapper[]
      totalCount: number
   }
   audiobooks: {
      items: unknown[] // Empty in JSON
      totalCount: number
   }
   users: {
      items: unknown[] // Empty in JSON
      totalCount: number
   }
   genres: {
      items: GenreResponseWrapper[]
      totalCount: number
   }
   topResultsV2: {
      featured: unknown[]
      itemsV2: {
         item:
            | TrackResponseWrapper
            | ArtistResponseWrapper
            | AlbumResponseWrapper
            | PlaylistResponseWrapper
            | PodcastResponseWrapper
            | EpisodeResponseWrapper // Union of wrappers
         matchedFields?: string[]
      }[]
   }
}

// --- Wrappers ---

export type AlbumResponseWrapper = {
   __typename: 'AlbumResponseWrapper'
   data: SpotifyAlbum
}

export type ArtistResponseWrapper = {
   __typename: 'ArtistResponseWrapper'
   data: SpotifyArtist
}

export type TrackResponseWrapper = {
   __typename: 'TrackResponseWrapper'
   data: SpotifyTrack
}

export type PlaylistResponseWrapper = {
   __typename: 'PlaylistResponseWrapper'
   data: SpotifyPlaylist
}

export type PodcastResponseWrapper = {
   __typename: 'PodcastResponseWrapper'
   data: SpotifyPodcast
}

export type EpisodeResponseWrapper = {
   __typename: 'EpisodeResponseWrapper'
   data: SpotifyEpisode
}

export type GenreResponseWrapper = {
   __typename: 'GenreResponseWrapper'
   data: SpotifyGenre
}

export type UserResponseWrapper = {
   __typename: 'UserResponseWrapper'
   data: SpotifyUser
}

// --- Entities ---

export interface SpotifyAlbum {
   __typename: 'Album'
   uri: string
   name: string
   type: 'ALBUM' | 'SINGLE' | 'COMPILATION'
   date: {
      year: number
      isoString?: string
   }
   coverArt: {
      extractedColors?: {
         colorDark: { hex: string; isFallback: boolean }
      }
      sources: SpotifyImageSource[]
   }
   playability: {
      playable: boolean
      reason: 'PLAYABLE' | 'PaymentRequired' | string
   }
   artists: {
      items: {
         uri: string
         profile: { name: string }
      }[]
   }
   visualIdentity?: {
      squareCoverImage: SpotifyVisualIdentityImage
   }
}

export interface SpotifyArtist {
   __typename: 'Artist'
   uri: string
   profile: {
      name: string
   }
   visualIdentity?: {
      squareCoverImage?: SpotifyVisualIdentityImage
   }
   visuals?: {
      avatarImage?: {
         extractedColors?: {
            colorDark: { hex: string; isFallback: boolean }
         }
         sources: SpotifyImageSource[]
      }
   }
}

export interface SpotifyTrack {
   __typename: 'Track'
   id: string
   uri: string
   name: string
   duration: { totalMilliseconds: number }
   trackMediaType: 'AUDIO' | 'VIDEO'
   contentRating: { label: 'NONE' | 'EXPLICIT' | string }
   playability: {
      playable: boolean
      reason: 'PLAYABLE' | string
   }
   albumOfTrack: {
      uri: string
      name: string
      id: string
      coverArt: {
         extractedColors?: {
            colorDark: { hex: string; isFallback: boolean }
         }
         sources: SpotifyImageSource[]
      }
      visualIdentity?: {
         squareCoverImage: SpotifyVisualIdentityImage
      }
   }
   artists: {
      items: {
         uri: string
         profile: { name: string }
      }[]
   }
   associationsV3?: {
      audioAssociations: { totalCount: number }
      videoAssociations: { totalCount: number }
   }
}

export interface SpotifyPlaylist {
   __typename: 'Playlist'
   uri: string
   name: string
   description: string
   format: string
   attributes: { key: string; value: string }[]
   images: {
      items: {
         extractedColors?: {
            colorDark: { hex: string; isFallback: boolean }
         }
         sources: SpotifyImageSource[]
      }[]
   }
   ownerV2: UserResponseWrapper
   visualIdentity?: {
      squareCoverImage: SpotifyVisualIdentityImage
   }
}

export interface SpotifyPodcast {
   __typename: 'Podcast'
   uri: string
   name: string
   mediaType: 'AUDIO' | 'MIXED' | 'VIDEO'
   publisher: { name: string }
   coverArt: {
      extractedColors?: {
         colorDark: { hex: string; isFallback: boolean }
      }
      sources: SpotifyImageSource[]
   }
   topics?: {
      items: {
         __typename: 'PodcastTopic'
         title: string
         uri: string
      }[]
   }
}

export interface SpotifyEpisode {
   __typename: 'Episode'
   uri: string
   name: string
   description: string
   mediaTypes: string[]
   duration: { totalMilliseconds: number }
   releaseDate: {
      isoString: string
      precision: 'MINUTE' | 'DAY' | string
   }
   contentRating: { label: 'NONE' | 'EXPLICIT' | string }
   restrictions: { paywallContent: boolean }
   playedState: {
      playPositionMilliseconds: number
      state: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
   }
   coverArt: {
      extractedColors: {
         colorDark: { hex: string; isFallback: boolean }
      }
      sources: SpotifyImageSource[]
   }
   podcastV2: PodcastResponseWrapper
   videoPreviewThumbnail: null | unknown
   gatedEntityRelations: unknown[]
   visualIdentity?: {
      squareCoverImage: SpotifyVisualIdentityImage
   }
}

export interface SpotifyUser {
   __typename: 'User'
   uri: string
   name?: string
   username?: string
   avatar: {
      sources: SpotifyImageSource[]
   } | null
}

export interface SpotifyGenre {
   __typename: 'Genre'
   uri: string
   name: string
   image: {
      extractedColors: {
         colorDark: { hex: string; isFallback: boolean }
      }
      sources: SpotifyImageSource[]
   }
}

// --- Visuals & Color Palette (The Big strict part) ---

export interface SpotifyImageSource {
   url: string
   width: number | null
   height: number | null
}

export interface SpotifyVisualIdentityImage {
   __typename: 'VisualIdentityImage'
   extractedColorSet: {
      encoreBaseSetTextColor: ColorRGBA
      highContrast: ColorSet
      higherContrast: ColorSet
      minContrast: ColorSet
      backgroundTintedBase: ColorRGBA
      textBase: ColorRGBA
      textBrightAccent: ColorRGBA
      textSubdued: ColorRGBA
   }
}

// Standard Color Structures found in Spotify JSON
export type ColorRGBA = {
   alpha: number
   red: number
   green: number
   blue: number
}

export type ColorSet = {
   backgroundBase: ColorRGBA
   backgroundTintedBase: ColorRGBA
   textBase: ColorRGBA
   textBrightAccent: ColorRGBA
   textSubdued: ColorRGBA
}
