// Renders the profile's live cards as animated SVGs: the contribution calendar (styled after
// RangoNetwork's learning calendar) and the profile views and followers badge. No dependencies.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ADV = JSON.parse(readFileSync(join(here, 'metrics.json'), 'utf8'))
const fontFace = (w) => `@font-face{font-family:'Nunito';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(join(here, 'fonts', `nunito-${w}.woff2`)).toString('base64')}) format('woff2')}`

const Z = { page: '#09090b', card0: '#18181b', card1: '#0f0f12', sm0: '#1d1d21', sm1: '#151518', border: '#3f3f46', edge: '#27272a', ink: '#f4f4f5', muted: '#a1a1aa', rose: '#dc354b' }
// Cell fill, border and bottom edge per level, from the learning calendar's dark theme.
const LEVELS = [null, ['#58343e', '#77414e', '#462732'], ['#99455b', '#ac526a', '#743348'], ['#c73854', '#dc4a66', '#8b1932'], ['#e7526e', '#f07089', '#ac2b43']]
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FONT = "Nunito, 'Trebuchet MS', Arial, sans-serif"

const r2 = (n) => Math.round(n * 100) / 100
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const tw = (s, size, w) => [...String(s)].reduce((a, ch) => a + (ADV[w]?.[ch] ?? 0.55) * size, 0)
const text = (x, y, s, { size = 14, w = 800, fill = Z.ink, anchor = 'start', ls = 0 } = {}) =>
  `<text x="${r2(x)}" y="${r2(y)}" font-family="${FONT}" font-size="${size}" font-weight="${w}" fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${ls ? ` letter-spacing="${ls}"` : ''}>${esc(s)}</text>`
const duo = (x, y, w, h, r, sm) => `<rect x="${x}" y="${y + (sm ? 3 : 4)}" width="${w}" height="${h}" rx="${r}" fill="${Z.edge}"/><rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="url(#${sm ? 'duoSm' : 'duo'})" stroke="${Z.border}"/>`
const fmtDate = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}` }

// Line icons on a 24px grid.
const ICONS = {
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  commit: '<circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6"/>',
  current: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
  longest: '<path d="M18 8l4 4-4 4M6 8l-4 4 4 4M2 12h20"/>',
  best: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
}
// 3D discs: lit face, darker solid bottom edge, white glyph on top.
const shade = (hex, t) => '#' + [16, 8, 0].map((b) => (parseInt(hex.slice(1), 16) >> b) & 255)
  .map((v) => Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t).toString(16).padStart(2, '0')).join('')
const gradients = new Map()
const disc = (cx, cy, r, color, depth = 1.5) => {
  const id = `t${color.slice(1)}`
  gradients.set(id, `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, 0.22)}"/><stop offset="1" stop-color="${shade(color, -0.12)}"/></linearGradient>`)
  return `<circle cx="${r2(cx)}" cy="${r2(cy + depth)}" r="${r}" fill="${shade(color, -0.42)}"/><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r}" fill="url(#${id})"/>` +
    `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r - 0.75}" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="1.5"/>`
}
const icon = (name, x, y, color, size = 20) => `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`
// A cartoon hop for the stat discs (as on the profile's other cards): up, a squash on landing,
// settle, then rest until the next pass 8 s later.
const HOP = `.hop{transform-box:fill-box;transform-origin:50% 100%;animation:hop 8s infinite}
@keyframes hop{0%{transform:translateY(0) scale(1,1);animation-timing-function:cubic-bezier(.2,.7,.3,1)}2.5%{transform:translateY(-6px) scale(.96,1.05);animation-timing-function:cubic-bezier(.6,0,.8,.4)}5%{transform:translateY(0) scale(1.07,.93);animation-timing-function:ease-out}6.5%{transform:translateY(0) scale(.98,1.02);animation-timing-function:ease-in-out}8%,100%{transform:translateY(0) scale(1,1)}}`

export function stats(days) {
  let longest = 0, run = 0, best = days[0]
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
    if (day.count > best.count) best = day
  }
  // Today still counts as part of the streak while it has no contributions yet.
  let i = days.length - 1
  if (i >= 0 && days[i].count === 0) i--
  let current = 0
  while (i >= 0 && days[i].count > 0) { current++; i-- }
  return { longest, current, best, active: days.filter((d) => d.count > 0).length }
}

export function renderActivity(calendar, { updated = new Date(), restricted = 0 } = {}) {
  gradients.clear()
  const weeks = calendar.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0, weekday: d.weekday })))
  const days = weeks.flat()
  if (!days.length) throw new Error('empty contribution calendar')
  const s = stats(days)
  const total = calendar.totalContributions
  const today = days.at(-1).date
  const year = today.slice(0, 4)

  const W = 1200, H = 456, P = 48
  const parts = []
  parts.push(duo(0, 0, W, H - 4, 24, false))

  // header: icon tile, title, year
  parts.push(`<g class="rise">${disc(P + 26, 64, 26, Z.rose, 3)}${icon('calendar', P + 13, 51, '#ffffff', 26)}
${text(P + 70, 62, 'Contribution Calendar', { size: 20, w: 800 })}
${text(P + 70, 84, 'Small Commits. A Stronger Streak.', { size: 14, w: 700, fill: Z.muted })}
${text(W - P, 82, year, { size: 40, w: 900, anchor: 'end', ls: -2.4 })}</g>`)

  // stat tiles, like the dashboard's streak / XP / mastery row
  const tiles = [
    ['commit', '#fb7185', '#e11d48', 'Contributions', String(total), 'Last Year'],
    ['current', '#67e8f9', '#0891b2', 'Current Streak', String(s.current), s.current === 1 ? 'Day' : 'Days'],
    ['longest', '#c084fc', '#7c3aed', 'Longest Streak', String(s.longest), s.longest === 1 ? 'Day' : 'Days'],
    ['best', '#fbbf24', '#d97706', 'Best Day', String(s.best.count), `On ${fmtDate(s.best.date)}`],
  ]
  const tileW = (W - 2 * P - 3 * 16) / 4
  tiles.forEach(([name, color, face, label, value, unit], i) => {
    const x = P + i * (tileW + 16), y = 116
    parts.push(`<g class="rise" style="animation-delay:${r2(0.08 + i * 0.07)}s">${duo(x, y, tileW, 80, 14, true)}<g class="hop" style="animation-delay:${r2(2 + i * 0.18)}s">${disc(x + 29, y + 26, 13, face, 2)}${icon(name, x + 21, y + 18, '#ffffff', 16)}</g>
${text(x + 52, y + 31, label, { size: 13, w: 800, fill: color })}
${text(x + 18, y + 64, value, { size: 26, w: 900 })}${text(x + 26 + tw(value, 26, 900), y + 64, unit, { size: 13, w: 800, fill: Z.muted })}</g>`)
  })

  // calendar
  const cell = 15, step = 20, x0 = P + 30, y0 = 248
  const gridW = (weeks.length - 1) * step + cell
  const shift = r2((W - 2 * P - 30 - gridW) / 2)
  const cx0 = x0 + Math.max(0, shift)
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const first = week.find((d) => d.date.endsWith('-01'))
    if (first) {
      const m = Number(first.date.slice(5, 7)) - 1
      if (m !== lastMonth && wi < weeks.length - 1) parts.push(text(cx0 + wi * step, y0 - 12, MONTHS[m], { size: 11, w: 800, fill: Z.muted }))
      lastMonth = m
    }
  })
  ;[[1, 'M'], [3, 'W'], [5, 'F']].forEach(([row, label]) => parts.push(text(P + 4, y0 + row * step + 11.5, label, { size: 10.5, w: 800, fill: Z.muted })))
  // the contribution cells, for the light that sweeps across them
  let lit = ''
  weeks.forEach((week, wi) => {
    // Weeks fade in left to right, a quiet sweep of about a second.
    let col = `<g class="wk" style="animation-delay:${r2(0.3 + wi * 0.02)}s">`
    for (const day of week) {
      const x = cx0 + wi * step, y = y0 + day.weekday * step
      const lv = LEVELS[day.level]
      col += lv
        ? `<rect x="${x}" y="${y + 2}" width="${cell}" height="${cell}" rx="4" fill="${lv[2]}"/><rect x="${x + 0.5}" y="${y + 0.5}" width="${cell - 1}" height="${cell - 1}" rx="4" fill="${lv[0]}" stroke="${lv[1]}"/>`
        : `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cell - 1}" height="${cell - 1}" rx="4" fill="none" stroke="#3f3f46" stroke-opacity=".65"/>`
      if (lv) lit += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4"/>`
      if (day.date === today) col += `<rect x="${x - 2.5}" y="${y - 2.5}" width="${cell + 5}" height="${cell + 5}" rx="6" fill="none" stroke="#f4f4f5" stroke-width="1.6" class="today"/>`
    }
    parts.push(col + '</g>')
  })
  // every 9 s a soft light sweeps left to right over the days with contributions
  if (lit) {
    gradients.set('scan', `<linearGradient id="scan" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".32"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`)
    parts.push(`<clipPath id="lit">${lit}</clipPath><g clip-path="url(#lit)"><rect x="${cx0 - 180}" y="${y0}" width="180" height="${7 * step}" fill="url(#scan)"><animate attributeName="x" values="${cx0 - 180};${cx0 + gridW};${cx0 + gridW}" keyTimes="0;.5;1" dur="9s" begin="2.4s" repeatCount="indefinite"/></rect></g>`)
  }

  // legend and source line
  const ly = y0 + 7 * step + 30
  parts.push(`<g class="rise" style="animation-delay:1.2s">${text(cx0, ly + 11, 'Less', { size: 11, w: 800, fill: Z.muted })}${LEVELS.map((lv, i) => {
    const x = cx0 + 34 + i * 19
    return lv ? `<rect x="${x}" y="${ly + 2}" width="13" height="13" rx="3.5" fill="${lv[2]}"/><rect x="${x}" y="${ly}" width="13" height="13" rx="3.5" fill="${lv[0]}"/>` : `<rect x="${x + 0.5}" y="${ly + 0.5}" width="12" height="12" rx="3.5" fill="none" stroke="#3f3f46"/>`
  }).join('')}${text(cx0 + 34 + 5 * 19 + 4, ly + 11, 'More', { size: 11, w: 800, fill: Z.muted })}
${text(W - P, ly + 11, `${restricted > 0 ? `${restricted} Private Contributions Included · ` : ''}${s.active} Active Days · Updated ${fmtDate(updated.toISOString().slice(0, 10))} ${updated.toISOString().slice(0, 4)}`, { size: 12, w: 700, fill: Z.muted, anchor: 'end' })}</g>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">Contribution calendar</title>
<desc id="desc">${total} contributions in the last year, ${s.active} active days, current streak ${s.current} days, longest streak ${s.longest} days.</desc>
<style>${[700, 800, 900].map(fontFace).join('\n')}
text{text-rendering:geometricPrecision}
.rise{animation:rise .6s both}.wk{animation:reveal .6s ease-out both}
.today{animation:breathe 2.4s ease-in-out 2s infinite}
${HOP}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}
@keyframes reveal{from{opacity:0}}
@keyframes breathe{50%{opacity:.35}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<defs><linearGradient id="duo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${Z.card0}"/><stop offset="1" stop-color="${Z.card1}"/></linearGradient>
<linearGradient id="duoSm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${Z.sm0}"/><stop offset="1" stop-color="${Z.sm1}"/></linearGradient>${[...gradients.values()].join('')}</defs>
${parts.join('\n')}
</svg>`
}

const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/**
 * Profile views and followers as two 3D pills. A missing number (the views counter can be
 * unreachable) drops its pill rather than showing a placeholder. Numbers count up when it loads.
 */
export function renderStats({ views = null, followers = null } = {}) {
  gradients.clear()
  const items = [['eye', '#0891b2', 'Profile Views', views], ['users', '#7c3aed', 'Followers', followers]].filter((item) => Number.isFinite(item[3]))
  if (!items.length) throw new Error('no stats to render')
  // compact: about the height of a regular README badge
  const h = 28, gap = 8, pad = 1, discR = 10, depth = 1.5, labelSize = 11.5, valueSize = 12.5
  // the icon disc shares the centre of the pill's rounded end; raised by half its edge so the
  // disc and its edge together sit in the middle
  const discX = h / 2, discY = pad + h / 2 - depth / 2, glyph = 11
  const labelX = discX + discR + 8
  const pills = items.map(([glyph, color, label, value]) => ({
    glyph, color, label, value,
    w: Math.ceil(labelX + tw(label, labelSize, 800) + 15 + tw(thousands(value), valueSize, 900) + 11),
  }))
  const W = pills.reduce((a, p) => a + p.w, 0) + gap * (pills.length - 1) + pad * 2, H = h + 3 + pad
  const base = pad + h / 2 + 4.2
  let x = pad
  const parts = pills.map((p, i) => {
    const valueX = x + labelX + tw(p.label, labelSize, 800) + 15
    // count up from zero over a second, in ten steps; the last step holds
    const counter = Array.from({ length: 10 }, (_, k) => Math.round((p.value * (k + 1)) / 10)).map((v, k) =>
      `<g visibility="hidden"><set attributeName="visibility" to="visible" begin="${r2(0.35 + k * 0.08)}s" ${k === 9 ? 'fill="freeze"' : 'dur="0.08s"'}/>${text(valueX, base, thousands(v), { size: valueSize, w: 900 })}</g>`).join('')
    const out = `<g class="rise" style="animation-delay:${r2(i * 0.1)}s">${duo(x, pad, p.w, h, h / 2, true)}${disc(x + discX, discY, discR, p.color, depth)}<g class="${p.glyph === 'eye' ? 'blink' : 'nod'}">${icon(p.glyph, r2(x + discX - glyph / 2), r2(discY - glyph / 2), '#ffffff', glyph)}</g>
${text(x + labelX, base, p.label, { size: labelSize, w: 800, fill: '#d4d4d8' })}<path d="M${r2(valueX - 7.5)} ${pad + 9}v10" stroke="${Z.border}" stroke-width="1.25" stroke-linecap="round"/>${counter}</g>`
    x += p.w + gap
    return out
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">Profile Views And Followers</title>
<desc id="desc">${pills.map((p) => `${p.label}: ${thousands(p.value)}`).join('. ')}.</desc>
<style>${[800, 900].map(fontFace).join('\n')}
text{text-rendering:geometricPrecision}
.rise{animation:rise .6s both}@keyframes rise{from{opacity:0;transform:translateY(4px)}}
.blink{transform-box:fill-box;transform-origin:center;animation:blink 5s 1.6s infinite}@keyframes blink{0%,88%,100%{transform:scaleY(1)}92%{transform:scaleY(.12)}96%{transform:scaleY(1)}}
.nod{transform-box:fill-box;transform-origin:50% 100%;animation:nod 5s 3.6s infinite}@keyframes nod{0%,10%,100%{transform:translateY(0)}4%{transform:translateY(-2px)}7%{transform:translateY(.5px)}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<defs><linearGradient id="duoSm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${Z.sm0}"/><stop offset="1" stop-color="${Z.sm1}"/></linearGradient>${[...gradients.values()].join('')}</defs>
${parts.join('\n')}
</svg>`
}
