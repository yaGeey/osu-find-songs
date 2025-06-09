import { NextRequest, NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';

export async function GET(req: NextRequest) {
   const { searchParams } = new URL(req.url);
   const query = searchParams.get('query');

   if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
   }

   try {
      const ytmusic = new YTMusic();
      await ytmusic.initialize();
      const results = await ytmusic.search(query);
      return NextResponse.json(results, { status: 200 });
   } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
   }
}
