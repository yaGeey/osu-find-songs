import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
   const baseUrl = 'https://osu.yageey.me'

   return [
      {
         url: baseUrl,
         lastModified: new Date(),
         changeFrequency: 'weekly',
         priority: 1,
      },
      {
         url: `${baseUrl}/from-osu/select`,
         lastModified: new Date(),
         changeFrequency: 'monthly',
         priority: 0.8,
      },
      {
         url: `${baseUrl}/from-spotify/select`,
         lastModified: new Date(),
         changeFrequency: 'monthly',
         priority: 0.8,
      },
   ]
}
