'use client'
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Page() {
   const searchParams = useSearchParams();
   const router = useRouter();

   useEffect(() => {
      const code = searchParams.get('code');
      if (!code) {
         router.push('/');
         return;
      }

      // Redirect to the server-side route to handle the OAuth callback
      router.push(`/api/auth/spotify/callback?code=${code}`);
   }, [searchParams, router]);

   return <div>Authorizing...</div>;
}