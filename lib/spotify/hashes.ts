'use server'
import { customAxios } from '../axios';

type Response = { requested: Record<string, string>; all: Record<string, string> }

const hashes: Record<string, string> = {}

export async function getHash(opName: string) {
   if (!hashes[opName]) {
      const { data } = await customAxios.get<Response>(`${process.env.SPOTIFY_TOKEN_SERVER_URL}/hashes?names=` + opName, {
         headers: { Authorization: process.env.SPOTIFY_TOKEN_SERVER_SECRET },
      })
      if (data.all) Object.assign(hashes, data.all)
      else await updateHashes([opName])
   }
   if (!hashes[opName]) {
      throw new Error(`Hash for operation "${opName}" could not be found even after update.`)
   }
   return hashes[opName]
}

export async function updateHashes(opNames: string[]) {
   const { data } = await customAxios.put<Response>(`${process.env.SPOTIFY_TOKEN_SERVER_URL}/hashes?names=` + opNames.join(','), {
      headers: { Authorization: process.env.SPOTIFY_TOKEN_SERVER_SECRET },
   })
   Object.entries(data.all).forEach(([name, hash]) => (hashes[name] = hash))
   return opNames.length ? data.requested : data.all
}
