'use server'
import { SpotifyPlaylistMetadataResponse, SpotifyPlaylistContentResponse } from '@/types/graphql-spotify/graphql-spotify'
import { customAxios } from '../axios'
import { SpotifySearchQueryResponse, TrackResponseWrapper } from '@/types/graphql-spotify/searchDesktop'
import { cookies } from 'next/headers'
import { getHash, updateHashes } from './hashes'
import { AxiosError, isAxiosError } from 'axios'

// TODO for graph handle error when hash is wrong - returns an json error

const playlistHash = await getHash('fetchPlaylist')

const headers = {
   'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
   // 'Client-Token': 'AACrWs7ddTvjmgdnrYlxQFvfWkiNSwh8Mc6HwHBUoN2vUXsVtD5h32bodBry1Vpk6g6biltzWEUGuyNmO',
   // 'Spotify-App-Version': '1.2.84.177.g11e44b3e', // fallback
   Origin: 'https://open.spotify.com',
   Referer: 'https://open.spotify.com/',
   'Sec-Ch-Ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
   'Sec-Ch-Ua-Mobile': '?0',
   'Sec-Ch-Ua-Platform': '"Windows"',
   'App-Platform': 'WebPlayer',
   Accept: 'application/json',
   'Content-Type': 'application/json;charset=UTF-8',
   'accept-language': 'en',
}

const buildHeaders = async () => {
   const t = await getInternalTokens()
   return {
      ...headers,
      Authorization: `Bearer ${t.accessToken}`,
      'Client-Token': t.clientToken,
      'Spotify-App-Version': t.appVersion,
   }
}

export async function getInternalTokens() {
   const storage = await cookies()
   let obj = {
      accessToken: storage.get('spotify_internal_token')?.value,
      clientToken: storage.get('spotify_client_token')?.value,
   } satisfies Partial<Awaited<ReturnType<typeof getInternalTokenFromServer>>>
   if (!obj.accessToken || !obj.clientToken) obj = await getInternalTokenFromServer()
   return obj as Awaited<ReturnType<typeof getInternalTokenFromServer>>
}

type TokenResponse = {
   access: { clientId: string; accessToken: string; accessTokenExpirationTimestampMs: number }
   client: { expires_at: number; token: string; version: string }
}

type SpotifyApiError = {
   errors: Array<{
      message: string
      extensions: {
         code: string
      }
   }>
}
async function getInternalTokenFromServer() {
   const { data } = await customAxios.get<TokenResponse>(`${process.env.SPOTIFY_TOKEN_SERVER_URL}/token`, {
      headers: { Authorization: process.env.SPOTIFY_TOKEN_SERVER_SECRET },
      context: 'get internal token',
   })

   // set cookies
   const storage = await cookies()
   storage.set('spotify_internal_token', data.access.accessToken, {
      path: '/',
      httpOnly: true,
      expires: new Date(data.access.accessTokenExpirationTimestampMs - 5 * 60 * 1000),
   })
   storage.set('spotify_client_token', data.client.token, {
      path: '/',
      httpOnly: true,
      expires: new Date(data.client.expires_at - 5 * 60 * 1000),
   })
   storage.set('spotify_app_version', data.client.version, {
      path: '/',
      httpOnly: true,
      maxAge: 10 * 365 * 24 * 60 * 60, // no expiration
   })

   return { accessToken: data.access.accessToken, clientToken: data.client.token, appVersion: data.client.version }
}

async function getInnerGraphApi<T>(operationName: string, variables: Record<string, any>, hash: string, retries = 2) {
   try {
      const { data } = await customAxios.post<T>(
         'https://api-partner.spotify.com/pathfinder/v2/query',
         {
            variables,
            operationName,
            extensions: {
               persistedQuery: {
                  version: 1,
                  sha256Hash: hash,
               },
            },
         },
         {
            headers: await buildHeaders(),
            context: `spotify innerapi`,
            ignoredErrors: [400],
         },
      )
      return data
   } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
         const errorData = err.response.data as SpotifyApiError
         // hash is outdated, update and retry
         if (
            (errorData.errors.every((e) => e.extensions.code === 'GRAPHQL_UNKNOWN_OPERATION_NAME') || err.status === 412) &&
            retries > 0
         ) {
            await updateHashes([operationName])
            return getInnerGraphApi(operationName, variables, await getHash(operationName), retries - 1)
         }
      }
      throw err
   }
}

export async function getPlaylistPage(playlistId: string, offset = 0, limit = 50) {
   const { data } = await getInnerGraphApi<SpotifyPlaylistContentResponse>(
      'fetchPlaylistContents',
      {
         uri: `spotify:playlist:${playlistId}`,
         offset,
         limit,
      },
      playlistHash,
   )
   const content = data.playlistV2.content
   const nextOffset = offset + limit < content.totalCount ? offset + limit : null
   return { items: content.items, nextOffset, total: content.totalCount }
}

export async function getPlaylistMetadata(playlistId: string) {
   const { data } = await getInnerGraphApi<SpotifyPlaylistMetadataResponse>(
      'fetchPlaylist',
      {
         uri: `spotify:playlist:${playlistId}`,
         enableWatchFeedEntrypoint: true,
         offset: 0,
         limit: 25,
      },
      playlistHash,
   )
   return data.playlistV2
}

export async function searchTopTracks(query: string) {
   const { data } = await getInnerGraphApi<SpotifySearchQueryResponse>(
      'searchDesktop',
      {
         includeArtistHasConcertsField: false,
         includeAudiobooks: true,
         includeAuthors: false,
         includePreReleases: true,
         limit: 10,
         numberOfTopResults: 5,
         offset: 0,
         searchTerm: query,
      },
      await getHash('searchDesktop'),
   )
   const items = data.searchV2.topResultsV2.itemsV2

   const tracks = items.filter(
      (i): i is { item: TrackResponseWrapper; matchedFields?: string[] } => i.item.__typename === 'TrackResponseWrapper',
   )

   // if track not found log error (changed type name)
   const types = items.map((i) => i.item.__typename).join(', ')
   if (tracks.length === 0 && types.length) throw new Error(`Spotify innerAPI: ${query} track not found. Types: {${types}}`)

   return tracks.map((i) => i.item.data)
}

export async function getPlaylistPages(playlistId: string) {
   const limit = 50
   let offset = 0
   let totalCount = 1

   const items = []
   while (offset < totalCount) {
      const { data } = await getInnerGraphApi<SpotifyPlaylistContentResponse>(
         'fetchPlaylistContents',
         {
            uri: `spotify:playlist:${playlistId}`,
            offset,
            limit,
         },
         playlistHash,
      )
      const content = data.playlistV2.content

      offset += content.pagingInfo.limit
      totalCount = content.totalCount
      items.push(...content.items)

      const delay = Math.floor(Math.random() * 1000) + 800
      await new Promise((r) => setTimeout(r, delay))
   }
   return { items, total: totalCount }
}

export async function createPlaylist({ name, description }: { name: string; description: string }) {
   const customHeaders = {
      ...(await buildHeaders()),
      Accept: 'application/json',
   }

   const { data } = await customAxios.post<{ uri: string; revision: string }>(
      'https://spclient.wg.spotify.com/playlist/v2/playlist',
      {
         ops: [
            {
               kind: 'UPDATE_LIST_ATTRIBUTES',
               updateListAttributes: {
                  newAttributes: {
                     values: {
                        name,
                        description,
                     },
                  },
               },
            },
         ],
      },
      { headers: customHeaders, context: 'create playlist' },
   )

   // TODO handle dynamic user id (get it from server)
   await customAxios.post(
      'https://spclient.wg.spotify.com/playlist/v2/user/313ylfw2p3xrcb5nsyubpkcxs4t4/rootlist/changes',
      {
         deltas: [
            {
               ops: [
                  {
                     kind: 'ADD',
                     add: {
                        addFirst: true,
                        items: [
                           {
                              uri: data.uri,
                              attributes: { timestamp: Date.now().toString() },
                           },
                        ],
                     },
                  },
               ],
               info: { source: { client: 'WEBPLAYER' } },
            },
         ],
      },
      { headers: customHeaders, context: 'add playlist to rootlist' },
   )
   return data
}

export async function addToPlaylist(playlistUri: string, tracksUris: string[]) {
   await getInnerGraphApi(
      'addToPlaylist',
      {
         newPosition: {
            fromUid: null,
            moveType: 'BOTTOM_OF_PLAYLIST',
         },
         playlistItemUris: tracksUris,
         playlistUri,
      },
      await getHash('addToPlaylist'),
   )
}
