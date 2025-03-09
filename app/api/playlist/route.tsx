import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Playlist from '@/lib/models/Playlist';

export async function POST(req: NextRequest) {
   try {
      await dbConnect();
      const data = await req.json();
      const playlist = new Playlist(data);
      await playlist.save();
      return NextResponse.json({ data, id: playlist._id });
   } catch(err) {
      return NextResponse.json({ error: err }, {status: 500});
   }
}

export async function GET(req: NextRequest) {
   try {
      await dbConnect();
      const playlists = await Playlist.findById(req.nextUrl.searchParams.get('id'));
      return NextResponse.json(playlists);
   } catch(err) {
      console.warn(err);
      return NextResponse.json({ error: err }, { status: 500 });
   }
}