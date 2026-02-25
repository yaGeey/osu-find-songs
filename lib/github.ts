'use server'

import { customAxios } from "./axios"

export async function getGitHubRepoLastUpdate() {
   const { data } = await customAxios.get(`https://api.github.com/repos/yaGeey/osu-find-songs/commits?per_page=1`, {
      headers: { Authorization: 'Bearer ' + process.env.GH_PAT },
   })
   return {
      date: new Date(data[0].commit.author.date).toLocaleString('en-US', {
         dateStyle: 'short',
         timeStyle: 'short',
      }),
      url: data[0].html_url,
   }
} 

export async function getGitHubRepoStarCount() {
   const { data } = await customAxios.get('https://api.github.com/repos/yaGeey/osu-find-songs', {
      headers: { Authorization: 'Bearer ' + process.env.GH_PAT },
   })
   return data.stargazers_count
}