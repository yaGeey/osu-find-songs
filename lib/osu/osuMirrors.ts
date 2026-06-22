import axios from 'axios'
import RateLimitManager from '../limiter/RateLimitManager'
import { getLazerToken } from './actions/osu'

const TEST_MAP_ID = 320118
const TEST_CHUNK_SIZE_BYTES = 50 * 1024 // 100 KB
const MAX_TEST_TIME_MS = 8000

export type Mirror = {
   name: string
   manager: RateLimitManager
   buildHeaders?: () => Promise<Record<string, string>>
   isProxied?: boolean
} & (
   | { downloadType: 'no-video'; buildUrl: (id: number) => string; buildUrlVideo?: never }
   | { downloadType: 'video'; buildUrl?: never; buildUrlVideo: (id: number) => string }
   | { downloadType: 'both'; buildUrl: (id: number) => string; buildUrlVideo: (id: number) => string }
)

const mirrors = [
   {
      name: 'catboy',
      downloadType: 'video',
      buildUrlVideo: (id: number) => `https://catboy.best/d/${id}`,
      manager: RateLimitManager.getInstance('catboy', { showErrors: false, blockForMsOnError: 1000 * 60 * 60 * 5 }),
   },
   {
      name: 'osuDirectMirror',
      downloadType: 'both',
      manager: RateLimitManager.getInstance('osuDirectMirror', { showErrors: false }),
      buildUrlVideo: (id: number) => `https://osu.direct/api/d/${id}`,
      buildUrl: (id: number) => `https://osu.direct/api/d/${id}?noVideo=true`,
   },
   //!! TEMP DISABLED
   // {
   //    name: 'sayobot',
   //    downloadType: 'both',
   //    manager: RateLimitManager.getInstance('sayobot', { showErrors: false }),
   //    buildUrlVideo: (id: number) => `/api/proxy?url=https://dl.sayobot.cn/beatmaps/download/full/${id}`,
   //    buildUrl: (id: number) => `https://dl.sayobot.cn/beatmaps/download/novideo/${id}`,
   // },
   // {
   //    name: 'akatsuki',
   //    downloadType: 'video',
   //    buildUrlVideo: (id: number) => `/api/proxy?url=https://akatsuki.gg/d/${id}`,
   //    manager: RateLimitManager.getInstance('akatsuki', { showErrors: false }),
   //    headers: new AxiosHeaders({ Referer: 'https://akatsuki.gg/' }),
   // },
   // {
   //    name: 'gatari',
   //    downloadType: 'no-video',
   //    buildUrl: (id: number) => `/api/proxy?url=https://osu.gatari.pw/d/${id}`,
   //    manager: RateLimitManager.getInstance('gatari', { showErrors: false }),
   // },

   {
      name: 'osu',
      downloadType: 'both',
      isProxied: true,
      manager: RateLimitManager.getInstance('osu', { showErrors: false }),
      buildUrlVideo: (id: number) => `https://osu.ppy.sh/api/v2/beatmapsets/${id}/download`,
      buildUrl: (id: number) => `https://osu.ppy.sh/api/v2/beatmapsets/${id}/download?noVideo=1`,
      buildHeaders: async () => {
         const token = await getLazerToken()
         return { Authorization: `Bearer ${token}`, Referer: 'https://osu.ppy.sh/' }
      },
   },

   //* DEAD MIRRORS
   //? bot verification
   // {
   //    name: 'beatconnect',
   //    downloadType: 'video',
   //    buildUrlVideo: (id: number) => `/api/proxy?url=https://beatconnect.io/b/${id}/`,
   //    manager: RateLimitManager.getInstance('beatconnect', { showErrors: false }),
   // },
   {
      name: 'nerinyan',
      downloadType: 'both',
      manager: RateLimitManager.getInstance('nerinyan', {
         avg: 25,
         burst: 100,
         durationMs: 60000,
         showErrors: false,
      }),
      buildUrlVideo: (id: number) => `https://api.nerinyan.moe/d/${id}?nv=0`,
      buildUrl: (id: number) => `https://api.nerinyan.moe/d/${id}?nv=1`,
   },
] satisfies Mirror[]

const testMirrorLatency = async (mirror: Mirror): Promise<number> => {
   const buildedUrl = mirror.buildUrlVideo?.(TEST_MAP_ID) ?? mirror.buildUrl?.(TEST_MAP_ID)
   if (!buildedUrl) return Infinity

   const headers = mirror.buildHeaders ? await mirror.buildHeaders() : undefined
   const url = mirror.isProxied ? `/api/proxy?url=${encodeURIComponent(buildedUrl)}` : buildedUrl

   return new Promise((resolve) => {
      const start = performance.now()
      const controller = new AbortController()

      const timeout = setTimeout(() => {
         controller.abort()
         resolve(Infinity)
      }, MAX_TEST_TIME_MS)

      axios
         .get(url, {
            signal: controller.signal,
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
               if (progressEvent.loaded >= TEST_CHUNK_SIZE_BYTES) {
                  const timeMs = performance.now() - start
                  clearTimeout(timeout)
                  controller.abort()
                  resolve(progressEvent.loaded / timeMs)
               }
            },
            timeout: MAX_TEST_TIME_MS,
            headers,
         })
         .catch((err) => {
            if (axios.isCancel(err)) return
            clearTimeout(timeout)
            resolve(Infinity)
         })
   })
}

export const getPrioritizedMirrorsFilteredByDead = async (deadMirrorNames?: string[]) => {
   const filteredMirrors = deadMirrorNames ? mirrors.filter((m) => !deadMirrorNames.includes(m.name)) : mirrors
   const results = await Promise.all(
      filteredMirrors.map(async (mirror) => {
         const bpms = await testMirrorLatency(mirror)
         return { mirror, bpms }
      }),
   )
   // console.log(results.filter((r) => r.bpms !== Infinity).sort((a, b) => b.bpms - a.bpms))
   return results
      .filter((r) => r.bpms !== Infinity)
      .sort((a, b) => b.bpms - a.bpms)
      .map((r) => r.mirror)
}

export const getDownloadData = async (mirror: Mirror, video: boolean, id: number) => {
   let rawUrl: string | null = null
   if (video) {
      if (mirror.downloadType === 'video' || mirror.downloadType === 'both') {
         rawUrl = mirror.buildUrlVideo(id)
      }
   } else {
      if (mirror.downloadType === 'no-video' || mirror.downloadType === 'both') {
         rawUrl = mirror.buildUrl(id)
      }
   }
   if (!rawUrl) return { url: null, headers: undefined }

   const url = mirror.isProxied ? `/api/proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl
   const headers = mirror.buildHeaders ? await mirror.buildHeaders() : undefined
   return { url, headers }
}
