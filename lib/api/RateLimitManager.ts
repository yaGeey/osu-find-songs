import PQueue from 'p-queue'
import { BaseLimiter } from './Base'
import { AxiosResponse } from 'axios'

type RateLimitManagerOptions = {
   maxConcurrency?: number
   defaultDelayMs?: number
}

export default class RateLimitManager extends BaseLimiter {
   private maxConcurrency: number

   /**
    * Creates an instance of RateLimitManager.
    * @param id Unique identifier for the limiter instance.
    * @param maxConcurrency ? Max concurency.
    * @param defaultDelayMs ? Default delay in milliseconds if no headers are present.
    */
   public constructor(id: string, options: RateLimitManagerOptions) {
      super({
         id,
         q: new PQueue({ concurrency: options.maxConcurrency || 3 }),
         remainingThreshold: 1,
         defaultDelayMs: options.defaultDelayMs || 500,
      })
      this.maxConcurrency = options.maxConcurrency || 3
   }

   public async executeBatch<T>(tasks: Array<() => Promise<T>>): Promise<(T | null)[]> {
      if (tasks.length === 0) return []

      // PROBING for limits with the first request
      let firstResult: T | null = null
      try {
         firstResult = await this.execute(tasks[0])
      } catch (e) {
         console.error(`[${this.id}] ⚠️ Probe task failed`, e)
         firstResult = null
      }

      // Dynamically adjust concurrency based on first request headers
      if (firstResult) {
         const res = firstResult as unknown as AxiosResponse
         const calculatedConcurrency = this.calculateConcurrency(res)
         if (this.getQ().concurrency !== calculatedConcurrency) {
            console.log(`[${this.id}] 📊 Adjusting Concurrency to ${calculatedConcurrency}`)
            this.getQ().concurrency = calculatedConcurrency
         }
      }

      const mainBatch = await this.processBatch(tasks.slice(1))
      return [firstResult, ...mainBatch]
   }

   /**
    * Calculates optimal concurrency based on rate limit headers.
    * @param res Axios response containing rate limit headers.
    * @returns Calculated concurrency level.
    */
   private calculateConcurrency(res: AxiosResponse): number {
      if (!res || !res.headers) return this.maxConcurrency
      const limitHeader = res.headers['x-ratelimit-limit'] || res.headers['ratelimit-limit']
      if (!limitHeader) return this.maxConcurrency

      const limit = parseInt(limitHeader, 10)
      if (isNaN(limit)) return this.maxConcurrency
      if (limit < 10) return 1
      if (limit < 50) return 2
      if (limit < 200) return Math.min(5, this.maxConcurrency)
      return this.maxConcurrency
   }
}
