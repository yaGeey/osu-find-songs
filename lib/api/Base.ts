import { AxiosResponse, isAxiosError } from 'axios'
import PQueue from 'p-queue'
import { sendUnknownError } from '../client-axios'
// TODO розрібратись з тайпскриптом
export class SingletonInstance<T> {
   protected id: string
   private static instances = new Map<string, any>()
   protected constructor(id: string) {
      this.id = id
   }
   public static getInstance<U extends SingletonInstance<U>, Args extends any[]>(
      this: new (id: string, ...args: Args) => U,
      id: string,
      ...args: Args
   ): U {
      if (!SingletonInstance.instances.has(id)) {
         SingletonInstance.instances.set(id, new this(id, ...args))
      }
      return SingletonInstance.instances.get(id) as U
   }
}

type BaseLimiterOptions = {
   id: string
   q: PQueue
   defaultDelayMs?: number
   remainingThreshold: number
}

export abstract class BaseLimiter extends SingletonInstance<BaseLimiter> {
   private q: PQueue
   getQ(): PQueue {
      return this.q
   }
   protected defaultDelayMs: number
   protected remainingThreshold: number

   /**
    * @param id Unique identifier for the limiter instance.
    * @param q PQueue instance to manage rate limiting.
    * @param defaultDelayMs Default delay in milliseconds if no headers are present.
    * @param remainingThreshold Remaining requests to trigger a pause (strictly less than).
    */
   protected constructor({ id, q, defaultDelayMs = 500, remainingThreshold }: BaseLimiterOptions) {
      super(id)
      this.q = q
      this.defaultDelayMs = defaultDelayMs
      this.remainingThreshold = remainingThreshold
   }
   abstract executeBatch<T>(tasks: Array<() => Promise<T>>): Promise<(T | null)[]>

   protected async pauseQueue(ms: number) {
      this.q.pause()
      setTimeout(() => this.q.start(), ms)
   }

   protected async processBatch<T>(tasks: Array<() => Promise<T>>): Promise<(T | null)[]> {
      const promises = tasks.map((task) => this.execute(task))
      const results = await Promise.allSettled(promises)

      return results.map((result, i) => {
         if (result.status === 'fulfilled') return result.value
         else {
            console.error(`✗ Task ${i} failed:`, result.reason?.message || result.reason)
            return null
         }
      })
   }

   /**
    * Executes a single task with rate limiting applied.
    * @param task The asynchronous task to execute.
    * @param priority Optional priority for the task in the queue (default is 0, higher = bigger).
    * @returns Promise with a result.
    */
   public async execute<T>(task: () => Promise<T>, priority: number = 0): Promise<T> {
      return this.q.add(
         async () => {
            try {
               const result = await task()
               const res = result as unknown as AxiosResponse

               if (res?.headers) {
                  const remaining = parseInt(res.headers['x-ratelimit-remaining'] || res.headers['ratelimit-remaining'])
                  if (!isNaN(remaining) && remaining < this.remainingThreshold && !this.q.isPaused) {
                     const ms = this.getWaitTimeMs(res) + 100
                     console.warn(`[${this.id}] 🚦 Pausing queue due to low remaining (${remaining}) for ${ms / 1000}s`)
                     this.pauseQueue(ms)
                  }
               }

               return result
            } catch (err) {
               if (isAxiosError(err) && (err?.response?.status === 429 || err?.status === 429)) {
                  if (!this.q.isPaused && err.response) {
                     const ms = this.getWaitTimeMs(err.response) + 100
                     console.error(`[${this.id}] ⛔ 429. Retrying in ${ms}ms`)
                     this.pauseQueue(ms)
                  }
                  // Retry with higher priority
                  return this.execute(task, 1)
               }
               sendUnknownError(err, `${this.id}_LIMITER`)
               throw err || new Error('Task failed with undefined error')
            }
         },
         { priority },
      )
   }

   /**
    * Parse rate limit headers to determine wait time.
    * @param res AxiosResponse with headers
    * @returns ms to wait
    */
   protected getWaitTimeMs(res: AxiosResponse): number {
      if (!res || !res.headers) return this.defaultDelayMs

      const retryAfter = res.headers['retry-after'] // seconds / data
      if (retryAfter) {
         if (/^\d+$/.test(retryAfter)) return parseInt(retryAfter, 10) * 1000
         const date = new Date(retryAfter)
         if (!isNaN(date.getTime())) return Math.max(date.getTime() - Date.now(), 0)
      }

      const resetHeader = res.headers['ratelimit-reset'] // seconds
      if (resetHeader) return parseInt(resetHeader, 10) * 1000

      const xResetHeader = res.headers['x-ratelimit-reset'] // timestamp
      if (xResetHeader) return Math.max(parseInt(xResetHeader, 10) * 1000 - Date.now(), 0)

      return this.defaultDelayMs
   }
}
