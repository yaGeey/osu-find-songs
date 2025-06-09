import Head from 'next/head';

export default function CustomHead({ title, desc, url, imgURL }: { title: string; desc: string; url?: string; imgURL?: string }) {
   return (
      <Head>
         <title>{title}</title>
         <meta name="description" content={desc} key="desc" />

         <meta property="og:title" content={title} key="og_title" />
         <meta property="og:description" content={desc} key="og_desc" />
         <meta property="og:image" content={imgURL || 'https://osu-find-songs.vercel.app/icon.png'} key="og_image" />
         <meta property="og:url" content={url || 'https://osu-find-songs.vercel.app'} key="og_url" />

         <meta name="twitter:title" content={title} key="tw_title" />
         <meta name="twitter:description" content={desc} key="tw_desc" />
         <meta name="twitter:url" content={imgURL || 'https://osu-find-songs.vercel.app/icon.png'} key="tw_url" />
         <meta name="twitter:card" content="summary" key="tw_card" />
      </Head>
   );
}
