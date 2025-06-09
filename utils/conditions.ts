import { Song } from "@/types/types";

export const conditions = [
  (s: Song) => s,
  (s: Song) => {
    if (s.title.includes("(") && s.title.includes(")"))
      return { ...s, title: s.title.replace(/\s*\(.*?\)\s*/g, "") };
    else return null;
  },
  (s: Song) => {
    if (s.title.includes("[") && s.title.includes("]"))
      return { ...s, title: s.title.replace(/\s*\[.*?\]\s*/g, "") };
    else return null;
  },
  (s: Song) => {
    if (s.author.includes("feat"))
      return { ...s, author: s.author.replace(/\s*feat.*/i, "") };
    else return null;
  },
  (s: Song) => {
    if (s.author.includes("ft"))
      return { ...s, author: s.author.replace(/\s*ft.*/i, "") };
    else return null;
  },
];

export const hardConditions = [
  (s: Song) => ({ ...s, author: "" }),
  (s: Song) => ({ ...s, title: "" }),
];

export const always_conditions = [
  (s: Song) => {
    if (s.title.includes("(TV Size)"))
      return { ...s, title: s.title.replace("(TV Size)", "").trim() };
    else return null;
  },
];

export const applyAlwaysConditions = (song: Song) => {
  for (const condition of always_conditions) {
    song = condition(song) || song;
  }
  return song;
};
