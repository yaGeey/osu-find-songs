import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import SpotifyProvider from "next-auth/providers/spotify";
import GitHubProvider from 'next-auth/providers/github';

// To create custom pages: https://next-auth.js.org/configuration/pages
export const OPTIONS: NextAuthOptions = {
   providers: [
      SpotifyProvider({
         clientId: process.env.AUTH_SPOTIFY_ID!,
         clientSecret: process.env.AUTH_SPOTIFY_SECRET!,
         authorization: 'https://accounts.spotify.com/authorize?scope=user-read-email,user-read-private',
      }),
   ],
   secret: process.env.SECRET,

   // by default putting in the same folder with auto generated pages -> /api/auth
   // pages: {
   //    signIn: '/auth/signin',
   //    signOut: '/auth/signout',
   //    error: '/auth/error', // Error code passed in query string as ?error=
   //    verifyRequest: '/auth/verify-request', // (used for check email message)
   //    newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
   // },
};

const handler = NextAuth(OPTIONS);
export { handler as GET, handler as POST };