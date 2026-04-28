import PQueue from 'p-queue'
import { BaseLimiter, BaseLimiterParameters } from './Base'

type RateLimitWithWindowOptions = {
   avg: number
   burst: number
   durationMs: number
} & Omit<Partial<BaseLimiterParameters>, 'remainingThreshold' | 'defaultDelayMs'>

export default class RateLimitWithWindowManager extends BaseLimiter {
   /**
    * Creates an instance of RateLimitManager with windowed rate limiting.
    * @param id Unique identifier for the limiter instance.
    * @param avg Average number of requests allowed in the time window.
    * @param burst Maximum number of concurrent requests.
    * @param durationMs Duration of the time window in milliseconds.
    * @param showErrors ? Whether to log errors.
    */
   public constructor(id: string, options: RateLimitWithWindowOptions) {
      super({
         id,
         q: new PQueue({
            concurrency: options.burst,
            interval: options.durationMs,
            intervalCap: options.avg,
         }),
         remainingThreshold: options.avg,
         showErrors: options.showErrors,
      })
   }

   public async executeBatch<T>(tasks: Array<() => Promise<T>>): Promise<(T | null)[]> {
      return this.processBatch(tasks)
   }
}
