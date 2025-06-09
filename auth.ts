import NextAuth from 'next-auth';
import Spotify from 'next-auth/providers/spotify';
// import GitHub from "next-auth/providers/github"

const { AUTH_SPOTIFY_ID = '', AUTH_SPOTIFY_SECRET = '' } = process.env;
if (!AUTH_SPOTIFY_ID || !AUTH_SPOTIFY_SECRET) {
   throw new Error('Missing environment variables for Spotify auth');
}

export const {
   handlers: { GET, POST },
   auth,
   signIn,
   signOut,
} = NextAuth({
   providers: [
      Spotify({
         clientId: AUTH_SPOTIFY_ID,
         clientSecret: AUTH_SPOTIFY_SECRET,
      }),
   ],
});
