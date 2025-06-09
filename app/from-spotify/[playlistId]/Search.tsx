import { BeatmapSet } from "@/types/Osu";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Search({
  beatmapsets,
  onChange,
}: {
  beatmapsets: BeatmapSet[][];
  onChange: (beatmapsets: BeatmapSet[][]) => void;
}) {
  function handleSearch(search: string) {
    const timer = setTimeout(() => {
      onChange(
        beatmapsets.map((beatmapset) =>
          beatmapset.filter((beatmap) => {
            if (!search.length) return true;
            const val = search.toLowerCase();
            return (
              beatmap.artist.toLowerCase().includes(val) ||
              beatmap.title.toLowerCase().includes(val) ||
              beatmap.creator.toLowerCase().includes(val)
            );
          }),
        ),
      );
    }, 400);
    return () => clearTimeout(timer);
  }

  return (
    <div className="relative">
      <input
        type="text"
        className="bg-white rounded-lg h-[34px] px-3 outline-none text-[14px] w-[250px]"
        placeholder="Search"
        onChange={(e) => handleSearch(e.target.value)}
      />
      <FontAwesomeIcon
        icon={faSearch}
        className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 text-lg"
      />
    </div>
  );
}
