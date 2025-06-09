import axios from 'axios';

export async function wikiSearchExact(query: string) {
   const { data } = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(query)}`,
   );
   const resData = data.query.pages[Object.keys(data.query.pages)[0]];
   return resData.extract;
}
export async function wikiSearchMusicianTitle(query: string) {
   const { data } = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}`,
   );
   const [searchQuery, titles, _, urls] = data;
   const title = titles.find((title: string) => title.includes('musician') || title.includes('artist')) || titles[0];
   return { title, url: urls[titles.indexOf(title)] };
}
