// Shared helpers for the profile artwork: zinc cards with a solid 3D bottom edge, 3D brand icon
// tiles, Nunito at heavy weights and cyan accent stops.
import { readFileSync, mkdtempSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

export const here = dirname(fileURLToPath(import.meta.url))
export const VENDOR = join(here, 'vendor')
// Static Nunito instances, cut from the variable font on first run (needs Python fontTools + brotli).
const NUNITO = join(here, '.cache', 'nunito')
mkdirSync(NUNITO, { recursive: true })
for (const w of [600, 700, 800, 900, 950]) {
  const out = join(NUNITO, `Nunito-${w}.ttf`)
  if (!existsSync(out)) execFileSync('python3', ['-m', 'fontTools.varLib.instancer', join(VENDOR, 'Nunito-Variable.ttf'), `wght=${w}`, '-q', '-o', out])
}

export const Z = {
  page: '#09090b', card0: '#18181b', card1: '#0f0f12', sm0: '#1d1d21', sm1: '#151518',
  border: '#3f3f46', edge: '#27272a', ink: '#f4f4f5', lead: '#c4c4cb', muted: '#a1a1aa', faint: '#71717a',
  cyan: '#67e8f9', cyanInk: '#ecfeff', green: '#4ade80', amber: '#fbbf24', violet: '#c084fc', violetInk: '#f3e8ff',
  violetBg: '#3b1e60', rose: '#dc354b', blue: '#2c86f0',
}
export const SANS = "Nunito, 'Trebuchet MS', 'Arial Rounded MT Bold', Arial, sans-serif"
export const MONOF = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

const ADV = JSON.parse(execFileSync('python3', [join(here, 'measure.py'), NUNITO], { maxBuffer: 1 << 26 }).toString())
/** Width of Nunito text in px; ls is letter-spacing in px (applied after every glyph, as browsers do). */
export const tw = (s, size, w = 800, ls = 0) => [...String(s)].reduce((a, ch) => a + (ADV[w]?.[ch] ?? 0.55) * size + ls, 0)
export const mw = (s, size, ls = 0) => String(s).length * (0.6 * size + ls)
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const r2 = (n) => Math.round(n * 100) / 100
export const b64 = (path) => readFileSync(path).toString('base64')

export function doc(w, h, title, desc) {
  const used = new Map()
  const reg = (fam, wt, s) => { const k = `${fam}:${wt}`; used.set(k, (used.get(k) ?? '') + s) }
  const parts = []
  const attrs = (size, w, fill, anchor, ls, extra) => `font-size="${size}" font-weight="${w}" fill="${fill}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${ls ? ` letter-spacing="${r2(ls)}"` : ''}${extra}`
  return {
    add: (...s) => parts.push(...s),
    /** Nunito text. `spans` is an optional list of [text, fill] for accent stops. */
    t: (x, y, s, { size = 16, w = 800, fill = Z.ink, anchor = 'start', ls = 0, extra = '', spans = null } = {}) => {
      const body = spans ? spans.map(([text, f]) => { reg('nunito', w, text); return f ? `<tspan fill="${f}">${esc(text)}</tspan>` : esc(text) }).join('') : (reg('nunito', w, s), esc(s))
      return `<text x="${r2(x)}" y="${r2(y)}" font-family="${SANS}" ${attrs(size, w, fill, anchor, ls, extra)}>${body}</text>`
    },
    /** JetBrains Mono text, regular (400) or extra bold (800). */
    m: (x, y, s, { size = 13, w = 400, fill = Z.muted, anchor = 'start', ls = 0, extra = '' } = {}) => {
      reg('mono', w, s)
      return `<text x="${r2(x)}" y="${r2(y)}" font-family="${MONOF}" ${attrs(size, w, fill, anchor, ls, extra)}>${esc(s)}</text>`
    },
    reg,
    render: (defs = '', css = '') => {
      const dir = mkdtempSync(join(tmpdir(), 'rg-'))
      const faces = []
      for (const [k, chars] of used) {
        const [fam, wt] = k.split(':')
        const src = fam === 'nunito' ? join(NUNITO, `Nunito-${wt}.ttf`) : join(VENDOR, `jetbrains-mono-latin-${wt}-normal.woff2`)
        const out = join(dir, `${fam}-${wt}.woff2`)
        const text = [...new Set(chars + ' 0123456789')].join('')
        execFileSync('python3', ['-m', 'fontTools.subset', src, `--text=${text}`, '--flavor=woff2', `--output-file=${out}`, '--layout-features=kern,liga,calt,tnum', '--no-hinting'])
        faces.push(`@font-face{font-family:'${fam === 'nunito' ? 'Nunito' : 'JetBrains Mono'}';font-weight:${wt};src:url(data:font/woff2;base64,${b64(out)}) format('woff2')}`)
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>
<style>${faces.join('\n')}
text{text-rendering:geometricPrecision}
.fb{transform-box:fill-box;transform-origin:center}
${css}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<defs>${defs}</defs>
${parts.join('\n')}
</svg>`
    },
  }
}

/** RangoNetwork's duo surface: a vertical zinc gradient, a 1px border and a solid bottom edge. */
export const duoDefs = `<linearGradient id="duo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${Z.card0}"/><stop offset="1" stop-color="${Z.card1}"/></linearGradient>
<linearGradient id="duoSm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${Z.sm0}"/><stop offset="1" stop-color="${Z.sm1}"/></linearGradient>`
export const duo = (x, y, w, h, { r = 16, sm = false, stroke = Z.border, edge = Z.edge, depth = sm ? 3 : 4, fill } = {}) =>
  `<rect x="${r2(x)}" y="${r2(y + depth)}" width="${r2(w)}" height="${r2(h)}" rx="${r}" fill="${edge}"/>` +
  `<rect x="${r2(x + 0.5)}" y="${r2(y + 0.5)}" width="${r2(w - 1)}" height="${r2(h - 1)}" rx="${r}" fill="${fill ?? (sm ? 'url(#duoSm)' : 'url(#duo)')}" stroke="${stroke}"/>`

/** Pill like the landing kicker index / status chips. */
export function pill(d, x, y, label, { color = Z.cyan, ink = color, bg, border, size = 11.5, w = 900, ls = 0.9, h = 24, anchor = 'start', dot = false } = {}) {
  const textW = tw(label, size, w, ls) - ls
  const pw = textW + 22 + (dot ? 14 : 0)
  const px = anchor === 'end' ? x - pw : anchor === 'middle' ? x - pw / 2 : x
  const dotSvg = dot ? `<circle cx="${r2(px + 13)}" cy="${r2(y + h / 2)}" r="3.5" fill="${color}"/><circle cx="${r2(px + 13)}" cy="${r2(y + h / 2)}" r="3.5" fill="none" stroke="${color}" class="fb ping"/>` : ''
  return {
    width: pw,
    svg: `<g><rect x="${r2(px)}" y="${y}" width="${r2(pw)}" height="${h}" rx="${h / 2}" fill="${bg ?? color}" ${bg ? '' : 'fill-opacity="0.14"'} stroke="${border ?? color}" ${border ? '' : 'stroke-opacity="0.38"'}/>${dotSvg}${d.t(px + 11 + (dot ? 14 : 0), y + h / 2 + size * 0.36, label, { size, w, fill: ink, ls })}</g>`,
  }
}

// ---------------------------------------------------------------- 3D app-icon tiles with brand logos
export const ICONS = JSON.parse(readFileSync(join(VENDOR, 'icons.json'), 'utf8'))
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16))
const hexOf = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
export const mix = (a, b, t) => hexOf(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t))
const luma = (hex) => { const [r, g, b] = rgb(hex).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const tileDefs = new Set()

/** The 3D disc: a darker solid edge under a lit face, with a faint inner ring. (x, y, size) is the face's box. */
const discBody = (x, y, size, gid, edge, depth) => {
  const cx = r2(x + size / 2), cy = r2(y + size / 2), r = r2(size / 2)
  return `<circle cx="${cx}" cy="${r2(y + size / 2 + depth)}" r="${r}" fill="${edge}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid})"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r2(size / 2 - 0.75)}" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="1.5"/>`
}

/**
 * A round 3D icon disc: brand-coloured face with a soft light, a darker solid bottom edge and the
 * brand mark in white (or dark on very light brands). Very dark brands sit on a zinc face. Returns
 * { defs, body }; gradient defs are shared within one document.
 */
export function appIcon(slug, x, y, size, { face, glyph, depth = Math.max(3, size * 0.07) } = {}) {
  const icon = ICONS[slug]
  if (!icon) throw new Error(`unknown icon ${slug}`)
  const brand = icon.hex ? `#${icon.hex}` : '#27272a'
  const dark = luma(brand) < 0.08
  const base = face ?? (dark ? '#3f3f46' : brand)
  const top = mix(base, '#ffffff', dark ? 0.1 : 0.22), bottom = mix(base, '#000000', dark ? 0.25 : 0.12), edge = mix(base, '#000000', dark ? 0.55 : 0.42)
  const gid = `ai-${base.slice(1)}`
  const defs = tileDefs.has(gid) ? '' : `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`
  tileDefs.add(gid)
  let mark
  const g = size * 0.5, gx = x + (size - g) / 2, gy = y + (size - g) / 2
  if (icon.path) {
    const fill = glyph ?? (luma(brand) > 0.55 ? '#18181b' : '#ffffff')
    mark = `<path d="${icon.path}" fill="${fill}" transform="translate(${r2(gx)} ${r2(gy)}) scale(${r2(g / 24)})"/>`
  } else {
    const svg = icon.svg.replace(/currentColor/g, glyph ?? '#ffffff')
    mark = `<image x="${r2(gx)}" y="${r2(gy)}" width="${r2(g)}" height="${r2(g)}" href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"/>`
  }
  const body = discBody(x, y, size, gid, edge, depth) + mark
  return { defs, body }
}
export const resetIconDefs = () => tileDefs.clear()

/** The same 3D disc with a white line glyph (24 px grid, drawn with strokes) instead of a brand mark. */
export function glyphTile(lines, x, y, size, face, { depth = Math.max(3, size * 0.07), stroke = 2 } = {}) {
  const top = mix(face, '#ffffff', 0.22), bottom = mix(face, '#000000', 0.12), edge = mix(face, '#000000', 0.42)
  const gid = `ai-${face.slice(1)}`
  const defs = tileDefs.has(gid) ? '' : `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`
  tileDefs.add(gid)
  const g = size * 0.52
  const body = discBody(x, y, size, gid, edge, depth) +
    `<g transform="translate(${r2(x + (size - g) / 2)} ${r2(y + (size - g) / 2)}) scale(${r2(g / 24)})" fill="none" stroke="#ffffff" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${lines}</g>`
  return { defs, body }
}

/** Line glyphs for the glyph discs, drawn on a 24 px grid. */
export const GLYPHS = {
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M10 2v8l3-3 3 3V2"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
}
