import axios from 'axios'
import { signLocalApiUrl } from './actions/signLocalApi'

// Axios instance for the local API server: every request URL gets HMAC-signed (exp + sig)
// with the same logic the proxy routes use — the secret stays on the server, signing happens
// through a server action right before each request is sent.
const localApiAxios = axios.create()

localApiAxios.interceptors.request.use(async (config) => {
   const path = axios.getUri({ url: config.url, params: config.params })
   config.url = await signLocalApiUrl(path)
   config.params = undefined
   return config
})

export default localApiAxios
