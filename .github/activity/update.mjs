// Fetches the profile's contribution calendar, followers and profile views, and writes the live
// cards the README loads from the output branch.
// Usage: GITHUB_TOKEN=... node .github/activity/update.mjs <out-dir>
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderActivity, renderStats } from './render.mjs'

const login = process.env.PROFILE_LOGIN || 'RangoGM'
const token = process.env.GITHUB_TOKEN
const outDir = process.argv[2] || 'dist'
if (!token) throw new Error('GITHUB_TOKEN is required')

const query = `query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    contributionsCollection {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date weekday contributionCount contributionLevel } }
      }
    }
  }
}`

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'user-agent': `${login}-activity-graph` },
  body: JSON.stringify({ query, variables: { login } }),
})
const body = await response.json()
if (!response.ok || body.errors) throw new Error(`GitHub GraphQL request failed (${response.status}): ${JSON.stringify(body.errors ?? body)}`)
const user = body.data?.user
if (!user?.contributionsCollection) throw new Error(`no contribution data for ${login}`)

/**
 * The profile views counter (komarev.com) only adds a view for requests from GitHub's image proxy
 * (user agent "github-camo"), so reading the count here does not add a view. Returns null when the
 * counter cannot be read, and the badge then shows followers only.
 */
async function profileViews() {
  try {
    const res = await fetch(`https://komarev.com/ghpvc/?username=${encodeURIComponent(login)}&style=flat&label=views`, { headers: { 'user-agent': `${login}-profile-stats` }, signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const numbers = [...(await res.text()).matchAll(/>\s*(\d{1,3}(?:,\d{3})*)\s*</g)].map((m) => Number(m[1].replace(/,/g, '')))
    return numbers.length ? numbers.at(-1) : null
  } catch {
    return null
  }
}

const views = await profileViews()
const collection = user.contributionsCollection
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'activity.svg'), renderActivity(collection.contributionCalendar, { restricted: collection.restrictedContributionsCount }))
writeFileSync(join(outDir, 'stats.svg'), renderStats({ views, followers: user.followers.totalCount }))
console.log(`wrote ${outDir}: ${collection.contributionCalendar.totalContributions} contributions, ${user.followers.totalCount} followers, ${views ?? 'unknown'} profile views`)
