import axios, { AxiosResponse, AxiosError } from 'axios'
import pLimit, { LimitFunction } from 'p-limit'
import https from 'https'
import http from 'http'

// Краще використовувати імпорти замість require для типізації
export const customAxios = axios.create({
   httpAgent: new http.Agent({ keepAlive: true }),
   httpsAgent: new https.Agent({ keepAlive: true }),
})

// Інтерсептор залишаємо майже без змін, лише типізація
customAxios.interceptors.response.use(
   (response) => response,
   (err: AxiosError) => {
      // Перевірка статусів
      if (err.response?.status !== 429 && err.status !== 429) {
         if (axios.isAxiosError(err)) {
            console.error(`${err.response?.status} ${err.config?.method?.toUpperCase()} ${err.config?.url}`, {
               message: err.message,
               data: err.response?.data,
            })
         } else {
            console.error('Unexpected error:', err) // Виправлено typo "errorrr"
         }
      }
      return Promise.reject(err)
   },
)

export class RateLimitManager {
   private isPaused: boolean = false
   private queue: Array<() => void> = []
   private maxConcurrency: number = 7
   private defaultDelayMs: number = 500
   private limit: LimitFunction // Глобальний лімітер для Singleton
   private activePauseTimeout: NodeJS.Timeout | null = null

   private static instance: RateLimitManager
   private constructor() {
      this.limit = pLimit(this.maxConcurrency)
   }

   public static getInstance(): RateLimitManager {
      if (!RateLimitManager.instance) {
         RateLimitManager.instance = new RateLimitManager()
      }
      return RateLimitManager.instance
   }

   public async executeBatch<T>(tasks: Array<() => Promise<T>>, maxConcurrency = 7, defaultDelayMs = 500): Promise<T[]> {
      if (tasks.length === 0) return []

      // Оновлюємо налаштування, якщо вони змінилися
      this.maxConcurrency = maxConcurrency
      this.defaultDelayMs = defaultDelayMs
      // Оновлюємо лімітер (p-limit динамічно змінює concurrency)
      this.limit.concurrency = maxConcurrency

      // PROBING: Перший запит робимо окремо, щоб визначити ліміти
      let firstResult: T
      try {
         firstResult = await this.getRateLimited(tasks[0])
      } catch (e) {
         // Якщо навіть перший впав фатально (не 429), повертаємо помилку або обробляємо
         console.error('First task failed probing', e)
         throw e
      }

      const otherTasks = tasks.slice(1)
      const res = firstResult as unknown as AxiosResponse

      // Динамічне коригування concurrency на основі заголовків першого запиту
      const calculatedConcurrency = this.calculateConcurrency(res)
      if (this.limit.concurrency !== calculatedConcurrency) {
         console.log(`📊 Adjusting Concurrency to ${calculatedConcurrency}`)
         this.limit.concurrency = calculatedConcurrency
      }

      console.log(`Processing remaining ${otherTasks.length} tasks...`)

      // Використовуємо глобальний this.limit
      const results = await Promise.all(otherTasks.map((task) => this.limit(() => this.getRateLimited(task))))
      return [firstResult, ...results]
   }

   public async getRateLimited<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
         const execute = () => {
            fn()
               .then((result) => {
                  const res = result as unknown as AxiosResponse
                  this.handleHeaders(res)
                  resolve(result)
               })
               .catch((err: AxiosError) => {
                  if (err.response?.status === 429 || err.status === 429) {
                     this.handleRateLimit(err.response, execute)
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

   // Виніс логіку обробки заголовків окремо
   private handleHeaders(res: AxiosResponse) {
      if (!res?.headers) return

      const remaining = parseInt(res.headers['x-ratelimit-remaining'] || res.headers['ratelimit-remaining'])

      // Подвійна перевірка !this.isPaused, щоб уникнути race condition
      if (!isNaN(remaining) && remaining <= 0 && !this.isPaused) {
         this.triggerPause(this.getWaitTimeMs(res) + 100) // +100ms буфер
      }
   }

   // Виніс логіку обробки 429
   private handleRateLimit(res: AxiosResponse | undefined, retryCallback: () => void) {
      // Додаємо в чергу ПЕРЕД паузою, щоб не загубити
      this.queue.push(retryCallback)

      if (!this.isPaused) {
         const waitTime = this.getWaitTimeMs(res!) + 200 + Math.floor(Math.random() * 200) // jitter
         console.warn(`⛔ 429 Hit. Pausing for ${waitTime / 1000}s`)
         this.triggerPause(waitTime)
      }
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

      console.log(`🟢 Resuming ${this.queue.length} requests with stagger...`)

      // ВАЖЛИВО: Не запускаємо все одразу.
      // Варіант 1: Запускаємо все, але з невеликою затримкою між ними (staggering)
      // Варіант 2: Просто звільняємо чергу. Оскільки ми використовуємо глобальний this.limit,
      // але ці проміси вже "всередині" ліміту (вони pending), p-limit їх не блокує.
      // Тому треба додавати штучну затримку, щоб не отримати миттєвий бан.

      const queueSnapshot = [...this.queue]
      this.queue = []

      queueSnapshot.forEach((task, index) => {
         // Розподіляємо ретраї у часі (наприклад, кожні 100мс), щоб уникнути spike
         setTimeout(() => {
            task()
         }, index * 100)
      })
   }

   getWaitTimeMs(res: AxiosResponse): number {
      if (!res || !res.headers) return this.defaultDelayMs

      // Стандартні перевірки retry-after і т.д. залишаємо як у вас
      const retryAfter = res.headers['retry-after']
      if (retryAfter) {
         if (/^\d+$/.test(retryAfter)) return parseInt(retryAfter, 10) * 1000
         const date = new Date(retryAfter)
         if (!isNaN(date.getTime())) return Math.max(date.getTime() - Date.now(), 0)
      }

      const resetHeader = res.headers['ratelimit-reset']
      if (resetHeader) return parseInt(resetHeader, 10) * 1000

      const xResetHeader = res.headers['x-ratelimit-reset']
      if (xResetHeader) return Math.max(parseInt(xResetHeader, 10) * 1000 - Date.now(), 0)

      return this.defaultDelayMs
   }

   private calculateConcurrency(res: AxiosResponse): number {
      if (!res || !res.headers) return 5
      const limitHeader = res.headers['x-ratelimit-limit'] || res.headers['ratelimit-limit']
      if (!limitHeader) return 5
      const limit = parseInt(limitHeader, 10)

      if (limit < 50) return 1
      if (limit < 200) return 5
      return this.maxConcurrency
   }
}
