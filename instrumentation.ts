import { type Instrumentation } from 'next'
import getLDClient from './lib/initLDServer'

export async function register() {
   if (process.env.NEXT_RUNTIME === 'nodejs') {
      if (process.env.NODE_ENV !== 'development') {
         await getLDClient()
      }
   }
}
