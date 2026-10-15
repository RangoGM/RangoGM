// Local preview of the activity card. The live one is drawn by .github/workflows/activity.yml from
// GitHub's contribution calendar; this builds a similar calendar from a snapshot of public commit dates.
// Usage: node design/preview-activity.mjs [out.svg]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderActivity, renderStats } from '../.github/activity/render.mjs'
const here = dirname(fileURLToPath(import.meta.url))
const rows = readFileSync(join(here, 'vendor', 'public-commit-dates.txt'), 'utf8').trim().split('\n')
const per = new Map(); for (const d of rows) per.set(d, (per.get(d) ?? 0) + 1)
const end = new Date('2026-10-15T00:00:00Z')
const start = new Date(end); start.setUTCDate(start.getUTCDate() - 364 - end.getUTCDay())
const counts = [...per.values()].sort((a, b) => a - b)
const q = (p) => counts[Math.floor(p * (counts.length - 1))]
const level = (n) => n === 0 ? 'NONE' : n <= q(0.25) ? 'FIRST_QUARTILE' : n <= q(0.5) ? 'SECOND_QUARTILE' : n <= q(0.75) ? 'THIRD_QUARTILE' : 'FOURTH_QUARTILE'
const weeks = []; let total = 0
for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
  if (d.getUTCDay() === 0) weeks.push({ contributionDays: [] })
  const date = d.toISOString().slice(0, 10), n = per.get(date) ?? 0
  total += n
  weeks.at(-1).contributionDays.push({ date, weekday: d.getUTCDay(), contributionCount: n, contributionLevel: level(n) })
}
const out = process.argv[2] || join(here, 'out', 'activity-preview.svg')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, renderActivity({ totalContributions: total, weeks }, { updated: end }))
// Sample numbers; the live badge reads the real ones.
writeFileSync(join(dirname(out), 'stats-preview.svg'), renderStats({ views: 1284, followers: 12 }))
