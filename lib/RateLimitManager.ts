import axios, { AxiosResponse, AxiosError } from 'axios'
import pLimit, { LimitFunction } from 'p-limit'

type RateLimitManagerOptions = {
   maxConcurrency?: number
   defaultDelayMs?: number
}

export class RateLimitManager {
   private isPaused: boolean = false
   private queue: Array<() => void> = []
   private maxConcurrency: number
   private defaultDelayMs: number
   private limit: LimitFunction
   private activePauseTimeout: NodeJS.Timeout | null = null

   private id: string // Для логів
   private static instances = new Map<string, RateLimitManager>()
   private constructor(id: string, options: RateLimitManagerOptions) {
      this.id = id
      this.maxConcurrency = options.maxConcurrency || 5
      this.defaultDelayMs = options.defaultDelayMs || 500
      this.limit = pLimit(this.maxConcurrency)
   }

   public static getInstance(id: string, options: RateLimitManagerOptions): RateLimitManager {
      if (!RateLimitManager.instances.has(id)) {
         RateLimitManager.instances.set(id, new RateLimitManager(id, options))
      }
      const instance = RateLimitManager.instances.get(id)!
      if (options.maxConcurrency && instance.maxConcurrency !== options.maxConcurrency) {
         instance.maxConcurrency = options.maxConcurrency
         instance.limit.concurrency = options.maxConcurrency
      }
      return instance
   }

   public async executeBatch<T>(tasks: Array<() => Promise<T>>): Promise<(T | null)[]> {
      if (tasks.length === 0) return []

      // PROBING: Перший запит робимо окремо, щоб визначити ліміти
      let firstResult: T | null = null
      try {
         firstResult = await this.getRateLimited(tasks[0])
      } catch (e) {
         // Якщо навіть перший впав фатально (не 429), повертаємо помилку або обробляємо
         console.error(`[${this.id}] ⚠️ Probe task failed`, e)
         firstResult = null
      }

      // Динамічне коригування concurrency на основі заголовків першого запиту
      if (firstResult) {
         const res = firstResult as unknown as AxiosResponse
         const calculatedConcurrency = this.calculateConcurrency(res)
         if (this.limit.concurrency !== calculatedConcurrency) {
            console.log(`[${this.id}] 📊 Adjusting Concurrency to ${calculatedConcurrency}`)
            this.limit.concurrency = calculatedConcurrency
         }
      }

      const otherTasks = tasks.slice(1)
      console.log(`[${this.id}] Processing remaining ${otherTasks.length} tasks...`)

      // Використовуємо глобальний this.limit
      const results = await Promise.all(
         otherTasks.map((task) =>
            this.limit(() =>
               this.getRateLimited(task).catch((err) => {
                  console.error(`[${this.id}] Task failed`, err)
                  return null
               }),
            ),
         ),
      )
      return [firstResult, ...results]
   }

   public async getRateLimited<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
         const execute = () => {
            fn()
               .then((result) => {
                  const res = result as unknown as AxiosResponse
                  if (res?.headers) {
                     const remaining = parseInt(res.headers['x-ratelimit-remaining'] || res.headers['ratelimit-remaining'])
                     // Подвійна перевірка !this.isPaused, щоб уникнути race condition
                     if (!isNaN(remaining) && remaining <= 0 && !this.isPaused) {
                        this.triggerPause(this.getWaitTimeMs(res) + 100)
                     }
                  }
                  resolve(result)
               })
               .catch((err: AxiosError) => {
                  if (err.response?.status === 429 || err.status === 429) {
                     this.queue.push(execute)

                     if (!this.isPaused) {
                        const waitTime = this.getWaitTimeMs(err.response!) + 200 + Math.floor(Math.random() * 200) // jitter
                        console.warn(`[${this.id}] ⛔ 429. Pausing for ${waitTime / 1000}s`)
                        this.triggerPause(waitTime)
                     }
                  } else {
                     reject(err)
                  }
               })
         }

         if (this.isPaused) {
            this.queue.push(execute)
         } else {
            execute()
         }
      })
   }

   private triggerPause(ms: number) {
      if (this.isPaused) return // Вже на паузі
      this.isPaused = true

      // Очищаємо попередній таймер, якщо він раптом є
      if (this.activePauseTimeout) clearTimeout(this.activePauseTimeout)

      this.activePauseTimeout = setTimeout(() => {
         this.isPaused = false
         this.activePauseTimeout = null
         this.processQueue()
      }, ms)
   }

   private processQueue() {
      if (this.isPaused || this.queue.length === 0) return

      console.log(`[${this.id}] 🟢 Resuming ${this.queue.length} requests with stagger...`)

      // ВАЖЛИВО: Не запускаємо все одразу.
      // Варіант 1: Запускаємо все, але з невеликою затримкою між ними (staggering)
      // Варіант 2: Просто звільняємо чергу. Оскільки ми використовуємо глобальний this.limit,
      // але ці проміси вже "всередині" ліміту (вони pending), p-limit їх не блокує.
      // Тому треба додавати штучну затримку, щоб не отримати миттєвий бан.

      const queueSnapshot = [...this.queue]
      this.queue = []

      // Staggered execution
      queueSnapshot.forEach((task, index) => {
         setTimeout(() => task(), index * 100)
      })
   }

   getWaitTimeMs(res: AxiosResponse): number {
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

   private calculateConcurrency(res: AxiosResponse): number {
      if (!res || !res.headers) return Math.min(3, this.maxConcurrency)
      const limitHeader = res.headers['x-ratelimit-limit'] || res.headers['ratelimit-limit']
      if (!limitHeader) return Math.min(3, this.maxConcurrency)
      const limit = parseInt(limitHeader, 10)

      if (limit < 50) return 1
      if (limit < 200) return Math.min(5, this.maxConcurrency)
      return this.maxConcurrency
   }
}
