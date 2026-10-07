import { getActiveBanners } from '@/lib/actions/telemetry'
import Banners from './Banners'

export async function BannersContainer() {
   const res = await getActiveBanners()
   if (!res.length) return null
   return (
      <div className="flex-1 place-items-end">
         <Banners banners={res} />
      </div>
   )
}
