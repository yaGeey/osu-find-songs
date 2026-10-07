'use server'

import { cacheLife } from 'next/cache'
import { customAxios } from '../serverAxios'

// Base URL for the GitHub REST API. Overridable for E2E tests; defaults to prod.
const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com'

export async function getGitHubRepoLastUpdate() {
   'use cache'
   cacheLife('hours')
   const { data } = await customAxios.get(`${GITHUB_API_BASE}/repos/yaGeey/osu-find-songs/commits?per_page=1`, {
      headers: { Authorization: 'Bearer ' + process.env.GH_PAT },
      context: 'github',
      ignoredErrors: [403, 429],
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
   'use cache'
   cacheLife('hours')
   const { data } = await customAxios.get(`${GITHUB_API_BASE}/repos/yaGeey/osu-find-songs`, {
      headers: { Authorization: 'Bearer ' + process.env.GH_PAT },
      context: 'github',
      ignoredErrors: [403, 429],
   })
   return data.stargazers_count
}
