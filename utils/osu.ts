'use server'
import { cookies } from 'next/headers'

export async function getBeatmap(id: string): Promise<any> {
   let token = (await cookies()).get('osuToken')?.value;
   if (!token) token = await revalidateOsuToken();

   const response = await fetch(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`,
      {
         headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
         }
      }
   )
   if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
   }
   return await response.json();
}

export async function beatmapsSearch(query: string): Promise<any> {
   let token = (await cookies()).get('osuToken')?.value;
   if (!token) token = await revalidateOsuToken();

   const response = await fetch(`https://osu.ppy.sh/api/v2/beatmapsets/search?${encodeURIComponent(query)}`,
      {
         headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
         }
      }
   )
   if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
   }
   return await response.json();
}

export async function revalidateOsuToken(): Promise<string | undefined> {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OSU_CLIENT!,
      client_secret: process.env.OSU_SECRET!,
      scope: 'public',
   });

   try {
      const response = await fetch('https://osu.ppy.sh/oauth/token', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
         },
         body: body.toString(),
      });
      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(errorText);
      }

      const data: {
         access_token: string;
         expires_in: number;
         token_type: string;
      } = await response.json();
      console.log(data);

      const storage = await cookies();
      storage.set('osuToken', data.access_token, { path: '/', expires: new Date(Date.now() + data.expires_in * 1000) });
      return data.access_token;
      
   } catch (error) {
      console.error('Error fetching token:', error);
   }
}