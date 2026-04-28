import axios from 'axios'
import RateLimitManager from '../limiter/RateLimitManager'

const TEST_MAP_ID = 320118
const TEST_CHUNK_SIZE_BYTES = 50 * 1024 // 100 KB
const MAX_TEST_TIME_MS = 3000

export type Mirror = {
   name: string
   manager: RateLimitManager
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
      manager: RateLimitManager.getInstance('catboy', { showErrors: false }),
   },
   {
      name: 'beatconnect',
      downloadType: 'video',
      buildUrlVideo: (id: number) => `/api/proxy?url=https://beatconnect.io/b/${id}/`,
      manager: RateLimitManager.getInstance('beatconnect', { showErrors: false }),
   },
   {
      name: 'sayobot',
      downloadType: 'both',
      manager: RateLimitManager.getInstance('sayobot', { showErrors: false }),
      buildUrlVideo: (id: number) => `https://dl.sayobot.cn/beatmaps/download/full/${id}`,
      buildUrl: (id: number) => `https://dl.sayobot.cn/beatmaps/download/novideo/${id}`,
   },
   // {
   //    name: 'akatsuki',
   //    downloadType: 'video',
   //    buildUrlVideo: (id: number) => `https://beatmaps.akatsuki.gg/d/${id}`,
   //    manager: RateLimitManager.getInstance('akatsuki', { showErrors: false }),
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
   {
      name: 'gatari',
      downloadType: 'no-video',
      buildUrl: (id: number) => `/api/proxy?url=https://osu.gatari.pw/d/${id}`,
      manager: RateLimitManager.getInstance('gatari', { showErrors: false }),
   },
] satisfies Mirror[]

const testMirrorLatency = async (mirror: Mirror): Promise<number> => {
   const url = mirror.buildUrlVideo?.(TEST_MAP_ID) ?? mirror.buildUrl?.(TEST_MAP_ID)
   if (!url) return Infinity

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

export const getDownloadUrl = (mirror: Mirror, video: boolean, id: number) => {
   if (video) {
      if (mirror.downloadType === 'video' || mirror.downloadType === 'both') {
         return mirror.buildUrlVideo(id)
      }
   } else {
      if (mirror.downloadType === 'no-video' || mirror.downloadType === 'both') {
         return mirror.buildUrl(id)
      }
   }
   throw new Error(`Mirror ${mirror.name} does not support the requested download type`)
}
