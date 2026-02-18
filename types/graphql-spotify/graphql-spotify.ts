// --- 1. Базові / Повторювані типи (Helpers) ---

// Зображення (використовується в обкладинках альбомів та візуальній ідентичності)
export interface ImageSource {
   imageFormat?: string // Наприклад "WEBP"
   maxHeight?: number // Іноді просто height
   maxWidth?: number // Іноді просто width
   height?: number
   width?: number
   url: string
}

export interface ImageWrapper {
   __typename: string
   sources: ImageSource[]
   imageId?: string
   imageIdType?: string
}

export interface RgbColor {
   alpha: number
   blue: number
   green: number
   red: number
}

// Набір кольорів для різних тем
export interface ColorSet {
   backgroundBase: RgbColor
   backgroundTintedBase: RgbColor
   textBase: RgbColor
   textBrightAccent: RgbColor
   textSubdued: RgbColor
}

// Витягнуті кольори з обкладинки
export interface ExtractedColors {
   encoreBaseSetTextColor?: RgbColor
   highContrast: ColorSet
   higherContrast: ColorSet
   minContrast: ColorSet
}

// Артист (скорочена версія)
export interface ArtistWrapper {
   items: { profile: { name: string }; uri: string }[]
   totalCount?: number // Буває в contributors
}

// --- 2. Основні сутності (Core Entities) ---

// Альбом (всередині треку)
export interface AlbumOfTrack {
   artists: ArtistWrapper
   coverArt: {
      sources: ImageSource[]
   }
   name: string
   uri: string
}

// Дані треку (V2 - логічні дані)
export interface TrackDataV2 {
   __typename: 'Track' | string
   albumOfTrack: AlbumOfTrack
   artists: ArtistWrapper
   associationsV3: {
      audioAssociations: { totalCount: number }
      videoAssociations: { totalCount: number }
   }
   contentRating: { label: 'EXPLICIT' | 'NONE' }
   discNumber: number
   trackDuration: { totalMilliseconds: number }
   mediaType: string
   // trackMediaType: 'AUDIO' | string
   name: string
   playability: {
      playable: boolean
      reason: string
   }
   playcount: string // Приходить як рядок!
   trackNumber: number
   uri: string
}

// Дані сутності (V3 - візуальні/UI дані)
export interface EntityDataV3 {
   __typename: 'Entity' | string
   consumptionExperienceTrait: {
      duration: {
         nanoSeconds: number
         seconds: number
      }
   }
   identityTrait: {
      contentHierarchyParent?: {
         identityTrait: { name: string }
         uri: string
      }
      contributors: ArtistWrapper
      description?: string
      name: string
      type: string // Наприклад "Song"
   }
   uri: string
   visualIdentityTrait: {
      sixteenByNineCoverImage: null | ImageWrapper
      squareCoverImage: {
         extractedColorSet: ExtractedColors
         image: { data: ImageWrapper }
      }
   }
}

// --- 3. Обгортки айтемів (Item Wrappers) ---

export interface PlaylistItem {
   uid: string
   addedAt: { isoString: string }
   addedBy: {
      data: {
         __typename: 'User'
         avatar: string | null
         name: string
         uri: string
         username: string
      }
   }
   attributes: any[] // Зазвичай порожній масив

   // V2: Основні метадані треку
   itemV2: {
      __typename: 'TrackResponseWrapper'
      data: TrackDataV2
   }

   // V3: Розширені дані (UI, кольори, точна тривалість)
   itemV3: {
      __typename: 'EntityResponseWrapper'
      data: EntityDataV3
   }
}

// --- 4. Головний тип відповіді (Root) ---
type PlaylistContent = {
   __typename: 'PlaylistItemsPage'
   items: PlaylistItem[]
   pagingInfo: {
      limit: number
      offset: number
   }
   totalCount: number
}

export interface SpotifyPlaylistContentResponse {
   data: {
      playlistV2: {
         __typename: 'Playlist'
         content: PlaylistContent
      }
   }
}

// ==========================================
// 2. Специфічні метадані Плейлиста (Header)
// ==========================================

// Власник (Owner)
export interface User {
   data: {
      __typename: 'User'
      avatar: string | null
      name: string
      uri: string
      username: string
   }
}

// Можливості поточного юзера
export interface UserCapabilities {
   canAbuseReport: boolean
   canAdministratePermissions: boolean
   canCancelMembership: boolean
   canEditItems: boolean
   canView: boolean
}

// ==========================================
// 4. Головний тип (FetchPlaylistQuery)
// ==========================================

export interface SpotifyPlaylistMetadataResponse {
   data: {
      playlistV2: {
         __typename: 'Playlist'

         // Ідентифікатори
         uri: string
         name: string
         description: string
         format: string
         revisionId: string

         // Статистика
         followers: number
         following: boolean

         // Права та налаштування
         abuseReportingEnabled: boolean
         basePermission: string
         currentUserCapabilities: UserCapabilities

         // Метадані
         ownerV2: User
         members: {
            totalCount: number
            items: Array<{
               isOwner: boolean
               permissionLevel: string // e.g. "CONTRIBUTOR"
               user: User // Використовує ту ж структуру User
            }>
         }
         images: {
            items: Array<{
               sources: ImageSource[]
            }>
         }
         sharingInfo: {
            shareId: string
            shareUrl: string
         }
         visualIdentity: {
            squareCoverImage: {
               __typename: 'VisualIdentityImage'
               extractedColorSet: ExtractedColors
            }
         }
         watchFeedEntrypoint?: {
            entrypointUri: string
            thumbnailImage: {
               data: ImageWrapper
            }
         }

         // Список треків (Content)
         content: PlaylistItem
      }
   }
}
