import axios, { AxiosResponse, isAxiosError } from 'axios'
import PQueue from 'p-queue'
import { sendUnknownError } from '@/lib/errorHandling'
// TODO розрібратись з тайпскриптом
class SingletonInstance<T> {
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

type BaseLimiterInternal = {
   id: string
   q: PQueue
}
export type BaseLimiterParameters = {
   defaultDelayMs?: number
   remainingThreshold?: number
   showErrors?: boolean
   waitTimeThresholdMs?: number
   blockForMsOnError?: number
}

export abstract class BaseLimiter extends SingletonInstance<BaseLimiter> {
   protected q: PQueue
   protected defaultDelayMs: number
   protected remainingThreshold: number
   protected showErrors: boolean
   protected waitTimeThresholdMs: number
   protected blockForMsOnError?: number

   protected maxRetries = 2
   protected blockedUntil = 0

   /**
    * @param id Unique identifier for the limiter instance.
    * @param q PQueue instance to manage rate limiting.
    * @param defaultDelayMs Default delay in milliseconds if no headers are present.
    * @param remainingThreshold Remaining requests to trigger a pause (strictly less than).
    * @param showErrors Whether to log errors.
    */
   protected constructor({
      id,
      q,
      defaultDelayMs = 500,
      remainingThreshold = 5,
      showErrors = true,
      waitTimeThresholdMs = 1000 * 10,
      blockForMsOnError,
   }: BaseLimiterParameters & BaseLimiterInternal) {
      super(id)
      this.q = q
      this.defaultDelayMs = defaultDelayMs
      this.remainingThreshold = remainingThreshold
      this.showErrors = showErrors
      this.waitTimeThresholdMs = waitTimeThresholdMs
      this.blockForMsOnError = blockForMsOnError
   }
   abstract executeBatch<T>(tasks: Array<() => Promise<T>>): Promise<(T | null)[]>

   protected pauseQueue(ms: number) {
      this.q.pause()
      setTimeout(() => this.q.start(), ms)
   }

   protected async processBatch<T>(tasks: Array<() => Promise<T>>, priorityOffset: number = 0): Promise<(T | null)[]> {
      const promises = tasks.map((task, i) => this.execute(task, -(priorityOffset + i)))
      const results = await Promise.allSettled(promises)

      //FIXME bad practice. Maybe we should throw an error
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
   public async execute<T>(task: () => Promise<T>, priority: number = 0, attempt: number = 0): Promise<T> {
      if (Date.now() < this.blockedUntil) {
         throw new Error(`Queue ${this.id} paused until ${new Date(this.blockedUntil).toISOString()}. Skipping task.`)
      }
      return this.q.add(
         async () => {
            try {
               const result = await task()

               if (result && typeof result === 'object' && 'headers' in result) {
                  const response = result as unknown as AxiosResponse
                  const remaining = parseInt(response.headers['x-ratelimit-remaining'] || response.headers['ratelimit-remaining'])
                  if (!isNaN(remaining) && remaining < this.remainingThreshold && !this.q.isPaused) {
                     const ms = this.getWaitTimeMs(response) + 100
                     if (ms > this.waitTimeThresholdMs) {
                        this.blockedUntil = Date.now() + ms
                        throw new Error(`Queue ${this.id} blocked for ${ms}ms — wait exceeds threshold. Task discarded.`)
                     }
                     console.warn(`[${this.id}] 🚦 Pausing queue due to low remaining (${remaining}) for ${ms / 1000}s`)
                     this.pauseQueue(ms)
                  }
               }

               return result
            } catch (err) {
               if (isAxiosError(err) && (err?.response?.status === 429 || err?.status === 429)) {
                  if (this.blockForMsOnError) {
                     this.blockedUntil = Date.now() + this.blockForMsOnError
                  }

                  const nextAttempt = attempt + 1
                  if (nextAttempt > this.maxRetries) {
                     throw err
                  }

                  const baseMs = err.response ? this.getWaitTimeMs(err.response) + 100 : this.defaultDelayMs
                  const backoffMs = baseMs * Math.pow(2, attempt)

                  if (!this.q.isPaused) {
                     console.error(`[${this.id}] ⛔ 429. Retrying in ${backoffMs}ms (attempt ${nextAttempt}/${this.maxRetries})`)
                     this.pauseQueue(backoffMs)
                  }
                  // Retry with higher priority
                  return this.execute(task, 1, nextAttempt)
               }
               sendUnknownError(err, `${this.id}_LIMITER`, this.showErrors)
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
