import axios from 'axios'

export const customAxios = axios.create({
   httpAgent: new (require('http').Agent)({ keepAlive: true }),
   httpsAgent: new (require('https').Agent)({ keepAlive: true }),
})

customAxios.interceptors.response.use(
   (response) => response,
   (error) => {
      if (error.response?.status === 429 || error.response?.data.error.status === 429) {
         return Promise.reject(error)
      }

      if (axios.isAxiosError(error)) {
         console.error(`${error.response?.status} ${error.config?.method} ${error.config?.url}`, {
            message: error.message,
            data: error.response?.data,
         })
      } else {
         console.error('Unexpected error:', error)
      }
      return Promise.reject(error)
   },
)
