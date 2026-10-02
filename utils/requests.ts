import axios from 'axios'

export function getMessageFromError(error: unknown): string {
   if (axios.isAxiosError(error)) {
      const errString = String(error.response?.data?.message || error.response?.data?.error || error.message)
      if (!errString.includes(String(error.response?.status))) return `${error.response?.status} - ${errString}`
      else return errString
   } else if (error instanceof Error) {
      return error.message
   } else if (typeof error === 'string') {
      return error
   } else return 'An unknown error occurred'
}
