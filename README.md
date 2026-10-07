<div align="center">

# [osufindsongs](https://osu.yageey.me)

_A tool that links osu! with Spotify: scan your osu! songs to get playlists, or find beatmaps from a playlist_ 🎮🎶

[![Website](https://img.shields.io/badge/🌐_Website-osu.yageey.me-blue)](https://osu.yageey.me) [![osuck](https://img.shields.io/badge/-📁_osuck-4d3249)](https://tools.osuck.net/tool/67df097dafb780368707339a) [![support](https://img.shields.io/badge/🤝_Support-KoFi-l)](https://ko-fi.com/yageey) [![os](https://img.shields.io/github/stars/yaGeey/osu-find-songs?logo=github)](https://github.com/yaGeey/osu-find-songs)

</div>

---

<p align="center">
   <strong style="font-size: 20px;">🎧 From Spotify to osu!</strong>
</p>
<div align="center">
  <img src="./public/fs.webp" width="600" alt="Spotify to osu! feature"/>
</div>

<br>

- 🎵 Pick any public Spotify playlist and the app will try to match each track to osu! beatmaps.
- 📊 You can filter, sort and search results with all the options provided by osu search queries and even custom one.
- 💾 Once you're happy with the results, you can download each beatmap individually — or grab them all in a single zip archive.

---

<p align="center">
   <strong style="font-size: 20px;">🎮 From osu! to Spotify</strong>
</p>
<div align="center">
  <img src="./public/fo2.webp" width="600" alt="osu! to Spotify feature"/>
</div>

<br>

**Transform your osu! library into Spotify playlists!**

- 🖥️ The app creates an empty playlist for you and hands you a single command to paste into your terminal. It scans your local osu!stable (lazer is on a way) Songs folder and sends nothing but each map's title and artist.
- 🔎 Every track is then matched on Spotify and the found songs are added straight to that playlist for you, in batches.
- 📈 Watch the live progress on the page and get a notification when it's ready, then open the playlist in Spotify.

---

### Try it out!

I hope you find this tool useful and fun to use. I really put soul in it.
Thanks for checking it out - and even bigger thanks if you decide to give it a try!💗
And even bigger thanks if you consider to star the repo!

ThunderBirdo featured an early version of the app in [his video](https://www.youtube.com/watch?v=0uZ4RehxDO4&t=300s&ab_channel=ThunderBirdo)

---

### Technical stuff

osufindsongs runs on Next.js on Vercel, while resource-intensive integration work is offloaded to a dedicated API microservice on a VPS. That service emulates an authentic Spotify web session with Playwright to retrieve headers, tokens and rotating query hashes, hands them to the app through HMAC-signed short-lived requests, and also acts as a signed proxy for community beatmap-mirror downloads - so credentials never reach the browser.

System observability and data integrity are maintained through a telemetry stack featuring NeonDB for serverless SQL analytics and LaunchDarkly for live sessions recordings and error logging.
![c4 diagram](public/c4.png)
