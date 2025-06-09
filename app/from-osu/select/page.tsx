"use client";
import BgImage from "@/components/BgImage";
import { Song } from "@/types/types";
import { useSongContext } from "@/contexts/SongContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";

export default function SelectPage() {
  const { setSongs } = useSongContext();
  const router = useRouter();

  useEffect(() => {
    if (Cookies.get("showSpotifyEmbeds") === undefined)
      Cookies.set("showSpotifyEmbeds", "true");
    if (Cookies.get("showYouTubeEmbeds") === undefined)
      Cookies.set("showYouTubeEmbeds", "true");
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    toast.loading("Loading beatmaps...", { delay: 1000 });
    const files = e.target.files;
    if (files && files?.length != 0) {
      const songsMap = new Map<string, Song>();
      Array.from(files).forEach((file) => {
        let song = file.webkitRelativePath
          .split("/")
          .slice(1, -1)[0]
          .split(" ");

        // check if beatmapset folder
        const id =
          song.length > 0 && !isNaN(parseInt(song[0])) ? song.shift() : null;
        if (!id) return;
        // if (songsMap) return;

        // getting bg image
        const potentialImage = file.webkitRelativePath.split("/")[2];
        let image;
        if (potentialImage.includes("png") || potentialImage.includes("jpg")) {
          image = URL.createObjectURL(file);
        }
        if (!image) return;

        song = song.join(" ").split(" - ");
        const songKey = `${song[0]} - ${song[1]}`;
        songsMap.set(songKey, {
          author: song[0],
          title: song[1],
          text: songKey,
          image,
          id,
        });
      });
      setSongs(Array.from(songsMap.values()));
      router.push("/from-osu");
    } else {
      alert("Please select a valid osu! beatmaps directory");
    }
  }

  return (
    <>
      <BgImage />
      <div className="absolute mx-auto top-1/2 -translate-y-1/2 left-0 right-0 w-fit font-inter">
        <div className="bg-dialog-after animate-border bg-main-lighter px-10 py-6  p-3 rounded-xl select-none cursor-pointer shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300 flex flex-col justify-center items-center">
          <h1 className="font-medium text-xl">
            Click to browse your <span className="font-bold">osu!</span>{" "}
            beatmaps folder
          </h1>
          <em className="text-black/80 ">
            C:/Users/.../AppData/Local/osu!/Songs
          </em>
          <h3 className="text-sm mt-2">
            ⚠️ This may take some time depending on the number of beatmaps ⚠️
          </h3>
          {/* @ts-expect-error */}
          <input
            directory=""
            webkitdirectory=""
            type="file"
            onChange={handleFileChange}
            className="opacity-0 absolute top-0 left-0 w-full h-full"
          />
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
