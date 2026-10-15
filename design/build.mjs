// RangoGM profile artwork built from RangoNetwork's own components.
// Usage: node design/build.mjs [outDir]   (writes to assets/ by default)
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { here, VENDOR, Z, MONOF, tw, r2, b64, esc, doc, duo, duoDefs, pill, appIcon, glyphTile, GLYPHS, ICONS, resetIconDefs, mix } from './lib.mjs'

const OUT = process.argv[2] || join(here, '..', 'assets')
mkdirSync(OUT, { recursive: true })
// ONLY=hero,tech node design/build.mjs rebuilds just the files whose names contain those words.
const ONLY = (process.env.ONLY ?? '').split(',').filter(Boolean)
const save = (name, make) => {
  if (ONLY.length && !ONLY.some((part) => name.includes(part))) return
  const svg = make()
  writeFileSync(join(OUT, name), svg)
  console.log(name.padEnd(32), (Buffer.byteLength(svg) / 1024).toFixed(1), 'KB')
}

// ================================================================== HERO
// The sign-in page's ASCII liquid (components/auth/ascii-background.tsx: asciify's fluid ramp and
// field) as a seamless 8 s loop at 60 frames a second. There is no card: the liquid keeps flowing
// behind the name, "Building..." and the typed CLI line, dimmed there; a soft dark halo that
// follows the letters keeps them clear of it, and the text lights the liquid around it a little cyan.
const RAMP = ' .:+-=xICA$FY#@'
function liquidFrame(cols, rows, cellW, cellH, tau, mask) {
  const width = cols * cellW, height = rows * cellH, aspect = width / height
  const T = 2 * Math.PI * tau
  // Every time term is periodic in the loop: the folds travel one full wavelength per loop, the
  // warps and the cloud sway around asciify's values instead of drifting away.
  const tCol = 1.56 + 0.5 * Math.cos(T), tRow = 2.04 + 0.5 * Math.sin(T + 1), tTilt = 1.2 + 0.4 * Math.sin(T + 2), tCloud = 1.08 + 0.6 * Math.sin(T)
  const out = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++) {
    const py = ((r + 0.5) * cellH) / height - 0.5
    const rowWarp = 0.22 * Math.sin(py * 5.2 + tRow), tilt = py * 3.1 + tTilt
    for (let c = 0; c < cols; c++) {
      const near = mask[r * cols + c]
      if (near <= 0) continue
      const px = (((c + 0.5) * cellW) / width - 0.5) * aspect
      const warp = 0.19 * Math.sin(px * 3.5 + tCol)
      const qx = px + rowWarp + 0.15 * Math.sin(px * 2.4 - tilt), qy = py + warp
      const ripple = Math.sin(py * 5 + warp * 5)
      const rx = qx * 0.8 + 0.18, ry = qy * 1.1
      const folds = 0.5 + 0.5 * Math.sin(Math.hypot(rx, ry) * 14 - qx * 2.8 + ripple * 1.4 - T)
      const cloud = 0.5 + 0.5 * Math.sin(qx * 3.6 - qy * 2.9 + tCloud)
      const value = (folds * folds * (0.48 + cloud * 0.32) - 0.075) / 0.72
      out[r * cols + c] = Math.round(Math.max(0, Math.min(1, value)) * near * (RAMP.length - 1))
    }
  }
  return out
}

/** A frame row as tspans, one per stretch of glyphs; 16+ blank cells (such as the card) start a new one. */
function asciiRow(line, x0, y, cellW) {
  let out = ''
  for (const run of line.matchAll(/\S(?:\S| {1,15}(?=\S))*/g)) out += `<tspan x="${r2(x0 + run.index * cellW)}" y="${r2(y)}">${esc(run[0])}</tspan>`
  return out
}

function hero() {
  resetIconDefs()
  const W = 1200, H = 400
  const name = 'Dat Tran Gia'
  const d = doc(W, H, `${name} — Building...`, `${name} inside an animated ASCII liquid that parts around the name, "Building..." and a terminal typing network, Kubernetes, Terraform and security commands.`)
  // the liquid: 7 x 13 px cells across the whole banner
  const cellW = 7, cellH = 13, cols = 171, rows = 30, ox = (W - cols * cellW) / 2, oy = 5
  const font = 11.667 // JetBrains Mono advances 0.6em: 7 px columns

  // The text, centred: the name, "Building..." over a progress track, and the CLI line, which
  // types from a fixed start so its longest command is centred.
  const nameSize = 104, nameLs = -5
  const nameW = tw(name, nameSize, 950, nameLs) - nameLs
  const prompt = 'dat@hcmc:~$ '
  const cmds = ['show ip ospf neighbor', 'kubectl get pods -A', 'terraform validate', 'npm run security:check']
  const buildSize = 24, cliSize = 21, cliCh = 0.6 * cliSize
  const cliW = (prompt.length + Math.max(...cmds.map((c) => c.length)) + 1) * cliCh
  const bw = 'Building'.length * 0.6 * buildSize, buildW = bw + 3 * 0.6 * buildSize
  const nameX = (W - nameW) / 2, buildX = (W - buildW) / 2, cliX = Math.round((W - cliW) / 2)
  const nameY = 167, buildY = 231, trackY = 249, cliY = 304, trackW = Math.round(cliW), trackX = (W - trackW) / 2
  const mx = W / 2, my = 200, rx = 400, ry = 142

  // Behind the text the liquid dims to `floor`, so the middle still moves, but quietly. The dim
  // region is a soft ellipse whose edge laps in and out twice a loop.
  const smooth = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c) }
  const region = new Float32Array(cols * rows), turn = new Float32Array(cols * rows)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c + 0.5) * cellW + ox, y = (r + 0.5) * cellH + oy, i = r * cols + c
    // distance outside the ellipse (negative inside)
    region[i] = (Math.hypot((x - mx) / rx, (y - my) / ry) - 1) * ry
    turn[i] = Math.atan2((y - my) / ry, (x - mx) / rx)
  }
  const floor = 0.28
  const maskAt = (tau) => {
    const mask = new Float32Array(cols * rows)
    for (let i = 0; i < mask.length; i++) {
      const edge = 6 * Math.sin(2 * Math.PI * 2 * tau + 3 * turn[i])
      mask[i] = floor + (1 - floor) * smooth((region[i] - edge + 20) / 70)
    }
    return mask
  }

  // 60 frames a second over the 8 s loop. Only the current frame is displayed (display, not
  // visibility), so a browser lays out one frame at a time rather than all 480 when it loads.
  const fps = 60, dur = 8, N = fps * dur
  const key = (k) => Math.round((k / N) * 1e5) / 1e5
  let frames = ''
  for (let f = 0; f < N; f++) {
    const grid = liquidFrame(cols, rows, cellW, cellH, f / N, maskAt(f / N))
    const show = f === 0 ? `values="inline;none" keyTimes="0;${key(1)}"` : `values="none;inline;none" keyTimes="0;${key(f)};${key(f + 1)}"`
    let frame = `<text xml:space="preserve" display="${f === 0 ? 'inline' : 'none'}"><animate attributeName="display" ${show} calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/>`
    for (let r = 0; r < rows; r++) {
      let line = ''
      for (let c = 0; c < cols; c++) line += RAMP[grid[r * cols + c]]
      frame += asciiRow(line, ox, oy + r * cellH + 10, cellW)
    }
    frames += frame + '</text>'
  }
  // The ramp's glyphs carry their own alpha (ramp-font.py), as in the sign-in page's glyph atlas;
  // the grey fill only shows where a browser can't draw colour glyphs.
  const rampFont = join(mkdtempSync(join(tmpdir(), 'rg-')), 'ramp.woff2')
  execFileSync('python3', [join(here, 'ramp-font.py'), join(VENDOR, 'jetbrains-mono-latin-400-normal.woff2'), rampFont, RAMP, '0.5'])

  let defs = `<clipPath id="panel"><rect width="${W}" height="${H}" rx="24"/></clipPath>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".62" stop-color="${Z.page}" stop-opacity="0"/><stop offset="1" stop-color="${Z.page}" stop-opacity=".8"/></radialGradient>
<radialGradient id="spill" gradientUnits="userSpaceOnUse" cx="${mx}" cy="${my}" r="270" gradientTransform="translate(${mx} ${my}) scale(2.2 1) translate(${-mx} ${-my})"><stop offset="0" stop-color="${Z.cyan}"/><stop offset=".55" stop-color="${mix(Z.cyan, '#ffffff', 0.3)}"/><stop offset="1" stop-color="#ffffff"/></radialGradient>
<linearGradient id="nameInk" gradientUnits="userSpaceOnUse" x1="${r2(nameX)}" y1="0" x2="${r2(nameX + nameW)}" y2="0"><stop offset="0" stop-color="#f4f4f5"/><stop offset=".42" stop-color="#f4f4f5"/><stop offset=".5" stop-color="${Z.cyan}"/><stop offset=".58" stop-color="#f4f4f5"/><stop offset="1" stop-color="#f4f4f5"/><animateTransform attributeName="gradientTransform" type="translate" values="-${r2(nameW)} 0;-${r2(nameW)} 0;${r2(nameW)} 0" keyTimes="0;.55;1" dur="7s" begin="1.8s" repeatCount="indefinite"/></linearGradient>
<clipPath id="track"><rect x="${trackX}" y="${trackY}" width="${trackW}" height="4" rx="2"/></clipPath>
<filter id="halo" x="-6%" y="-40%" width="112%" height="180%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="3" result="grow"/><feGaussianBlur in="grow" stdDeviation="5" result="soft"/><feFlood flood-color="${Z.page}" flood-opacity=".94"/><feComposite in2="soft" operator="in" result="halo"/><feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="trackLight" x1="0" x2="1"><stop offset="0" stop-color="${Z.cyan}" stop-opacity="0"/><stop offset=".5" stop-color="${Z.cyan}"/><stop offset="1" stop-color="${Z.cyan}" stop-opacity="0"/></linearGradient>`

  // terminal typing: each command types, holds, clears; one cursor follows
  const slot = 3.4, total = slot * cmds.length, cmdX = cliX + prompt.length * cliCh
  const cur = { kt: [0], x: [cmdX] }
  let typed = ''
  cmds.forEach((c, i) => {
    const start = i * slot, clear = start + slot - 0.3
    const kt = [0], vw = [0]
    for (let k = 0; k <= c.length; k++) { const t = start + 0.35 + k * 0.055; kt.push(r2((t / total) * 1e4) / 1e4); vw.push(r2(k * cliCh)); cur.kt.push(r2((t / total) * 1e4) / 1e4); cur.x.push(r2(cmdX + k * cliCh)) }
    kt.push(r2((clear / total) * 1e4) / 1e4); vw.push(0); kt.push(1); vw.push(0)
    cur.kt.push(r2((clear / total) * 1e4) / 1e4); cur.x.push(cmdX)
    defs += `<clipPath id="cmd${i}"><rect x="${r2(cmdX)}" y="${cliY - 19}" height="26" width="0"><animate attributeName="width" values="${vw.join(';')}" keyTimes="${kt.join(';')}" dur="${total}s" calcMode="discrete" repeatCount="indefinite"/></rect></clipPath>`
    typed += `<g clip-path="url(#cmd${i})">${d.m(cmdX, cliY, c, { size: cliSize, fill: Z.ink })}</g>`
  })
  cur.kt.push(1); cur.x.push(cmdX)

  // liquid, its cyan light near the text, vignette and frame
  d.add(`<g clip-path="url(#panel)"><rect width="${W}" height="${H}" fill="${Z.page}"/>
<g font-family="Ramp, ${MONOF}" font-size="${font}" fill="#4a4a50" style="animation:fadeIn 1.2s both">${frames}</g>
<rect width="${W}" height="${H}" fill="url(#spill)" style="mix-blend-mode:multiply"/>
<rect width="${W}" height="${H}" fill="url(#vig)"/></g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="none" stroke="${Z.edge}"/>`)

  // the text, straight on the liquid, inside its halo
  d.add(`<g style="animation:rise .8s .2s both"><g filter="url(#halo)">${d.t(nameX, nameY, name, { size: nameSize, w: 950, fill: 'url(#nameInk)', ls: nameLs })}
${d.m(buildX, buildY, 'Building', { size: buildSize, fill: Z.ink })}${[0, 1, 2].map((k) => `<g opacity=".2">${d.m(buildX + bw + k * 0.6 * buildSize, buildY, '.', { size: buildSize, fill: Z.cyan })}<animate attributeName="opacity" values=".2;1;1;.2" keyTimes="0;.2;.6;1" dur="1.5s" begin="${r2(k * 0.25)}s" repeatCount="indefinite"/></g>`).join('')}
<rect x="${trackX}" y="${trackY}" width="${trackW}" height="4" rx="2" fill="#27272a"/>
<g clip-path="url(#track)"><rect x="${trackX - 160}" y="${trackY}" width="160" height="4" fill="url(#trackLight)"><animate attributeName="x" values="${trackX - 160};${trackX + trackW}" dur="2.8s" repeatCount="indefinite"/></rect></g>
${d.m(cliX, cliY, 'dat@hcmc', { size: cliSize, fill: Z.green })}${d.m(cliX + 8 * cliCh, cliY, ':~$', { size: cliSize, fill: Z.cyan })}${typed}
<rect x="${r2(cmdX)}" y="${cliY - 17}" width="${r2(cliCh)}" height="22" rx="1.5" fill="${Z.cyan}"><animate attributeName="x" values="${cur.x.join(';')}" keyTimes="${cur.kt.join(';')}" dur="${total}s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="1s" calcMode="discrete" repeatCount="indefinite"/></rect></g></g>`)
  d.reg('mono', 400, 'Building.dat@hcmc:~$' + cmds.join(''))

  return d.render(defs, `@font-face{font-family:'Ramp';src:url(data:font/woff2;base64,${b64(rampFont)}) format('woff2')}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}@keyframes fadeIn{from{opacity:0}}`)
}

// ================================================================== SHARED HOP
// A cartoon hop for icon discs: up, a squash on landing, settle, then rest until the loop comes
// round. Each disc starts a little later than the one before, so the hop runs across a card as a
// wave every 8 s.
const HOP = `.hop{transform-box:fill-box;transform-origin:50% 100%;animation:hop 8s infinite}
@keyframes hop{0%{transform:translateY(0) scale(1,1);animation-timing-function:cubic-bezier(.2,.7,.3,1)}2.5%{transform:translateY(-8px) scale(.96,1.05);animation-timing-function:cubic-bezier(.6,0,.8,.4)}5%{transform:translateY(0) scale(1.07,.93);animation-timing-function:ease-out}6.5%{transform:translateY(0) scale(.98,1.02);animation-timing-function:ease-in-out}8%,100%{transform:translateY(0) scale(1,1)}}`

// ================================================================== SHARED SECTION HEADER
function header(d, x, y, kicker, title, { accent = Z.cyan } = {}) {
  return d.t(x, y, kicker, { size: 12.5, w: 900, fill: Z.muted, ls: 2.2 }) +
    d.t(x - 1, y + 38, '', { size: 30, w: 900, fill: Z.ink, ls: -1.2, spans: [[title, null], ['.', accent]] })
}


// ================================================================== NOW BUILDING
// Drawn like RangoNetwork's lesson scenes: a topology (the lessons' device icons for the people and
// their networks, each service's own icon for the platform), packets hopping along links that
// light up, devices pinging as packets land, speech bubbles, marks and tags, step chips and a
// status line. One 18 s loop: a commit passes CI's security checks, goes to Amazon ECR through
// OIDC and Amazon EKS rolls it out a pod at a time; a learner loads a lesson through Cloudflare
// and the load balancer and gets the answer back; metrics land in Grafana.
function building() {
  resetIconDefs()
  const W = 1200, H = 598, T = 18
  const d = doc(W, H, 'Now Building — RangoNetwork', 'RangoNetwork, a CCNA v2.0 learning platform built and run on AWS, Kubernetes and Terraform with security checks in CI, drawn as one of its own lesson animations: a commit passes typecheck, tests and a Trivy scan in GitHub Actions, is pushed to Amazon ECR through OIDC and rolled out by Amazon EKS one Kubernetes pod at a time; a learner loads a lesson through Cloudflare Tunnel and the load balancer; metrics and logs land in Grafana.')
  let defs = duoDefs
  let css = `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
@keyframes ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.6);opacity:0}}.ping{animation:ping 1.8s ease-out infinite}
.k{transform-box:fill-box}`
  const pct = (t) => r2((Math.max(0, Math.min(T, t)) / T) * 100)
  const kt = (t) => Math.round((Math.max(0, Math.min(T, t)) / T) * 1e4) / 1e4
  // A CSS animation on the loop: [time, declarations] keyframes. Returns its class.
  let kid = 0
  const keys = (frames, origin = 'center') => {
    const id = `s${kid++}`
    css += `@keyframes ${id}{${[...frames].sort((a, b) => a[0] - b[0]).map(([t, decl]) => `${pct(t)}%{${decl}}`).join('')}}.${id}{transform-origin:${origin};animation:${id} ${T}s linear infinite}`
    return `k ${id}`
  }
  // Pops in at t0 like the lessons' marks and bubbles (overshooting a little), fades out by t1 + .25.
  const pop = (t0, t1, origin, body) => `<g class="${keys([[0, 'opacity:0;transform:scale(.55)'], [t0, 'opacity:0;transform:scale(.55)'], [t0 + 0.24, 'opacity:1;transform:scale(1.06)'], [t0 + 0.42, 'opacity:1;transform:scale(1)'], [t1, 'opacity:1;transform:scale(1)'], [t1 + 0.25, 'opacity:0;transform:scale(.92)'], [T, 'opacity:0;transform:scale(.92)']], origin)}">${body}</g>`
  // An opacity track from windows of [t0, t1], easing in and out over `ease` s.
  const track = (windows, ease = 0.18) => {
    const v = [], k = []
    const put = (t, o) => { if (k.length && t <= k[k.length - 1]) t = k[k.length - 1] + 0.001; k.push(t); v.push(o) }
    put(0, windows.some(([a]) => a <= 0) ? 1 : 0)
    for (const [a, b] of windows) { if (a > 0) { put(a, 0); put(a + ease, 1) } put(b, 1); put(b + ease, 0) }
    put(T, v[v.length - 1])
    return `values="${v.join(';')}" keyTimes="${k.map(kt).join(';')}"`
  }
  const HALO = '#0c0c0f'
  const label = (x, y, text, { size = 14, w = 900, fill = Z.ink, anchor = 'middle' } = {}) => d.t(x, y, text, { size, w, fill, anchor, extra: ` stroke="${HALO}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"` })

  d.add(duo(0, 0, W, H - 4, { r: 24 }))

  // ---- head, as a lesson panel's: kicker, title, and the line under it
  d.add(`<g style="animation:rise .6s both">${d.t(48, 58, 'NOW BUILDING', { size: 12.5, w: 900, fill: Z.cyan, ls: 2.2 })}
${pill(d, 48 + tw('NOW BUILDING', 12.5, 900, 2.2) + 10, 42, 'IN DEVELOPMENT', { color: Z.green, size: 10.5, dot: true }).svg}
${d.t(47, 100, '', { size: 30, w: 900, fill: Z.ink, ls: -1.1, spans: [['RangoNetwork ', null], ['—', Z.cyan], [' CCNA v2.0 Learning Platform', null]] })}
${d.t(48, 130, 'Built And Run End To End On AWS, Kubernetes And Terraform, With Security Checks In CI', { size: 15, w: 700, fill: Z.lead })}</g>`)
  const headBottom = 152, statusTop = 492, statusBottom = 542
  defs += `<radialGradient id="stageGlow" gradientUnits="userSpaceOnUse" cx="${W / 2}" cy="${headBottom}" r="${W * 0.6}" gradientTransform="translate(${W / 2} ${headBottom}) scale(1 .62) translate(${-W / 2} ${-headBottom})"><stop offset="0" stop-color="#0e2a33"/><stop offset=".62" stop-color="#0e2a33" stop-opacity="0"/></radialGradient>
<clipPath id="stage"><rect x="1" y="${headBottom}" width="${W - 2}" height="${statusTop - headBottom}"/></clipPath>`
  d.add(`<rect x="1" y="${headBottom}" width="${W - 2}" height="${statusTop - headBottom}" fill="url(#stageGlow)" clip-path="url(#stage)"/><path d="M1 ${headBottom}H${W - 1}M1 ${statusTop}H${W - 1}M1 ${statusBottom}H${W - 1}" stroke="#27272a"/>`)

  // ---- the steps: chips over the stage, dots and a sentence in the status line
  const steps = [
    ['Commit', 0, 2.6, 'A Change Leaves The Dev Laptop With git push'],
    ['Check', 2.6, 5.0, 'CI Runs Typecheck, Tests And A Trivy Scan Before Anything Ships'],
    ['Publish', 5.0, 7.4, 'The Image Goes To The Registry Through OIDC, With No Static Keys'],
    ['Deploy', 7.4, 10.6, 'Kubernetes Rolls It Out One Pod At A Time, So Lessons Stay Up'],
    ['Serve', 10.6, 15.4, 'A Learner Loads A Lesson Through Cloudflare Tunnel, With No Open Ports'],
    ['Observe', 15.4, T, 'Metrics And Logs Land In Grafana'],
  ]
  // A value that steps with the chips, gliding .35 s into each new step (and back to the first
  // as the loop ends).
  const glide = (vals) => {
    const v = [vals[0]], k = [0]
    steps.forEach(([, t0], i) => { if (i) { k.push(t0 - 0.001, t0 + 0.35); v.push(vals[i - 1], vals[i]) } })
    k.push(T - 0.35, T); v.push(vals[vals.length - 1], vals[0])
    return `values="${v.join(';')}" keyTimes="${k.map(kt).join(';')}" calcMode="spline" keySplines="${k.slice(1).map((_, i) => (i % 2 ? '0 0 1 1' : '.45 0 .2 1')).join(';')}"`
  }
  const chipY = 168, chipH = 34
  let cx = 48
  const chips = steps.map(([name], i) => { const w = 6 + 22 + 8 + tw(name, 13, 800) + 14, c = { x: cx, w, name, n: i + 1 }; cx += w + 8; return c })
  let chipSvg = `<rect y="${chipY - 0.5}" height="${chipH + 1}" rx="${(chipH + 1) / 2}" fill="#083344" stroke="#22d3ee"><animate attributeName="x" ${glide(chips.map((c) => r2(c.x - 0.5)))} dur="${T}s" repeatCount="indefinite"/><animate attributeName="width" ${glide(chips.map((c) => r2(c.w + 1)))} dur="${T}s" repeatCount="indefinite"/></rect>`
  chips.forEach((c, i) => {
    const on = [[steps[i][1], steps[i][2] - 0.05]]
    chipSvg = `<rect x="${r2(c.x)}" y="${chipY}" width="${r2(c.w)}" height="${chipH}" rx="${chipH / 2}" fill="#18181b" stroke="#3f3f46"/>` + chipSvg
    chipSvg += `<circle cx="${r2(c.x + 17)}" cy="${chipY + 17}" r="11" fill="#27272a"/><circle cx="${r2(c.x + 17)}" cy="${chipY + 17}" r="11" fill="#06b6d4" opacity="0"><animate attributeName="opacity" ${track(on, 0.3)} dur="${T}s" repeatCount="indefinite"/></circle>`
    chipSvg += d.t(c.x + 17, chipY + 21.5, String(c.n), { size: 11.5, w: 900, fill: '#e4e4e7', anchor: 'middle' })
    chipSvg += `${d.t(c.x + 36, chipY + 22, c.name, { size: 13, w: 800, fill: Z.muted })}<g opacity="0"><animate attributeName="opacity" ${track(on, 0.3)} dur="${T}s" repeatCount="indefinite"/>${d.t(c.x + 36, chipY + 22, c.name, { size: 13, w: 800, fill: '#cffafe' })}</g>`
  })
  d.add(`<g style="animation:rise .6s .1s both">${chipSvg}</g>`)
  // status: the current step's dot widens, and its sentence rises in
  const dotX = (step, i) => 48 + i * 11 + (i > step ? 10 : 0)
  let status = ''
  steps.forEach((_, i) => {
    status += `<rect y="${statusTop + 22}" height="6" rx="3" fill="#3f3f46"><animate attributeName="x" ${glide(steps.map((__, s) => dotX(s, i)))} dur="${T}s" repeatCount="indefinite"/><animate attributeName="width" ${glide(steps.map((__, s) => (s === i ? 16 : 6)))} dur="${T}s" repeatCount="indefinite"/><animate attributeName="fill" ${glide(steps.map((__, s) => (s === i ? '#22d3ee' : '#3f3f46')))} dur="${T}s" repeatCount="indefinite"/></rect>`
  })
  steps.forEach(([name, t0, t1, line]) => {
    status += `<g class="${keys([[0, `opacity:${t0 === 0 ? 1 : 0};transform:translateY(${t0 === 0 ? 0 : 4}px)`], ...(t0 > 0 ? [[t0, 'opacity:0;transform:translateY(4px)'], [t0 + 0.32, 'opacity:1;transform:translateY(0)']] : []), [t1 - 0.12, 'opacity:1;transform:translateY(0)'], [t1, 'opacity:0;transform:translateY(0)'], [T, `opacity:${t1 >= T ? 1 : 0};transform:translateY(0)`]])}">${d.t(128, statusTop + 31, '', { size: 14.5, w: 800, fill: Z.ink, spans: [[`${name} — `, Z.cyan], [line, null]] })}</g>`
  })
  d.add(`<g style="animation:rise .6s .2s both">${status}</g>`)

  // ---- the topology
  // Every icon is drawn centred on its device's point; `at[id]` is the size it's drawn at. The
  // lessons' device icons fit a 72 x 54 box; the services' own icons are sized to sit level with them.
  const at = {}
  const addIcon = (id, svg, w, h) => { at[id] = { w, h }; defs += `<image id="ic-${id}" width="${r2(w)}" height="${r2(h)}" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"/>` }
  for (const name of ['laptop', 'workstation', 'wireless-router']) {
    const svg = readFileSync(join(VENDOR, 'devices', `${name}.svg`), 'utf8')
    const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number)
    addIcon(name, svg, Math.min(72, (54 * vw) / vh), Math.min(54, (72 * vh) / vw))
  }
  // a Simple Icons mark in its brand colour, cropped to the mark (`box` is its tight viewBox)
  const brandSvg = (slug, box) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><path fill="#${ICONS[slug].hex}" d="${ICONS[slug].path}"/></svg>`
  addIcon('actions', brandSvg('githubactions', '0 0 24 24'), 50, 50)
  addIcon('cloudflare', brandSvg('cloudflare', '0 6.57 24 10.85'), 76, 34.4)
  addIcon('grafana', brandSvg('grafana', '.95 0 22.09 24'), 46, 50)
  addIcon('ecr', readFileSync(join(VENDOR, 'aws', 'AmazonElasticContainerRegistry.svg'), 'utf8'), 50, 50)
  addIcon('eks', readFileSync(join(VENDOR, 'aws', 'AmazonElasticKubernetesService.svg'), 'utf8'), 50, 50)
  addIcon('elb', readFileSync(join(VENDOR, 'aws', 'ElasticLoadBalancing.svg'), 'utf8'), 50, 50)
  addIcon('pod', readFileSync(join(VENDOR, 'kubernetes', 'pod.svg'), 'utf8'), 52, 50.5)
  const ICON_W = 72, ICON_H = 54
  // the top of what an icon actually draws, for the bubbles and marks above it
  const iconTop = (n) => n.y - at[n.icon].h / 2
  const top = 272, bottom = 404, mid = 338
  const N = {
    dev: { icon: 'laptop', x: 132, y: top, label: 'Dev Laptop', role: 'Writes The Change' },
    ci: { icon: 'actions', x: 318, y: top, label: 'CI Security Checks', role: 'GitHub Actions' },
    reg: { icon: 'ecr', x: 504, y: top, label: 'Image Registry', role: 'Amazon ECR' },
    learner: { icon: 'workstation', x: 132, y: bottom, label: 'Learner', role: 'Opens A Lesson' },
    home: { icon: 'wireless-router', x: 318, y: bottom, label: 'Home Router', role: 'Wi-Fi And NAT' },
    cf: { icon: 'cloudflare', x: 504, y: bottom, label: 'Cloudflare', role: 'Tunnel, No Open Ports' },
    eks: { icon: 'eks', x: 700, y: top, label: 'Amazon EKS', role: 'Control Plane' },
    lb: { icon: 'elb', x: 700, y: bottom, label: 'Load Balancer', role: 'Ingress' },
    pod1: { icon: 'pod', x: 862, y: mid - 68 },
    pod2: { icon: 'pod', x: 862, y: mid },
    pod3: { icon: 'pod', x: 862, y: mid + 68 },
    graf: { icon: 'grafana', x: 1052, y: mid, label: 'Grafana', role: 'Metrics And Logs' },
  }
  const pods = ['pod1', 'pod2', 'pod3']
  // EKS reaches the pods over the control plane (dashed); requests come in through the load balancer
  const links = [['dev', 'ci'], ['ci', 'reg'], ['learner', 'home'], ['home', 'cf'], ['reg', 'eks'], ['cf', 'lb'], ...pods.map((p) => ['eks', p, 'control']), ...pods.map((p) => ['lb', p]), ...pods.map((p) => [p, 'graf'])]
  const linkKey = (a, b) => [a, b].sort().join('-')

  // zones, as the lessons draw networks: a dashed, tinted area with its name on a pill
  const zone = (x, y, w, h, name, tone, { end = false, logo = '', logoW = 0 } = {}) => {
    const [stroke, fill, ink, ring] = { cyan: ['#0891b2', '#083344', Z.cyan, '#0e7490'], violet: ['#7c3aed', '#2e1065', '#c4b5fd', '#6d28d9'], amber: ['#d97706', '#451903', '#fbbf24', '#b45309'] }[tone]
    const lw = tw(name, 11, 900, 0.66) + 16 + logoW, lx = end ? x + w - 14 - lw : x + 14
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" fill-opacity=".25" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="5 4"/><rect x="${r2(lx)}" y="${y - 10}" width="${r2(lw)}" height="20" rx="10" fill="${HALO}" stroke="${ring}"/>${logo ? logo(lx + 9, y) : ''}${d.t(lx + 8 + logoW, y + 4, name, { size: 11, w: 900, fill: ink, ls: 0.66 })}`
  }
  // the AWS logo, white with its orange smile, about 11 px tall from its left edge at (x, y mid)
  const awsMark = readFileSync(join(VENDOR, 'amazonaws.svg'), 'utf8').match(/ d="([^"]+)"/)[1]
  const smile = awsMark.indexOf('M21.698')
  const awsLogo = (x, y) => `<g transform="translate(${r2(x)} ${r2(y - 12.4)}) scale(1.05)"><path d="${awsMark.slice(0, smile)}" fill="#ffffff"/><path d="${awsMark.slice(smile)}" fill="#ff9900"/></g>`
  let graph = zone(64, 222, 504, 120, 'DELIVERY', 'violet') + zone(64, 356, 330, 122, 'LEARNER AT HOME', 'amber', { end: true }) + zone(606, 222, 506, 256, '· KUBERNETES', 'cyan', { end: true, logo: awsLogo, logoW: 28 })

  // links, each with a cyan copy that lights while a packet is on it
  const lit = Object.fromEntries(links.map(([a, b]) => [linkKey(a, b), []]))
  // arrivals per device (it lifts and pings) and departures (it glows as a packet leaves)
  const arrive = Object.fromEntries(Object.keys(N).map((id) => [id, []]))
  const depart = Object.fromEntries(Object.keys(N).map((id) => [id, []]))
  let packets = ''
  // A packet riding devices `path`, leaving at t0: it eases from device to device, waits a beat
  // on each one in between, and is gone shortly after it lands. Returns when it lands.
  const trip = (text, kind, path, t0) => {
    const pts = path.map((id) => N[id])
    const hops = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y))
    const total = hops.reduce((a, b) => a + b, 0)
    let t = t0, dist = 0
    const kp = [0, 0], ktm = [0, t0], spl = ['0 0 1 1']
    depart[path[0]].push(t0)
    hops.forEach((len, i) => {
      const hop = 0.28 + len / 600
      lit[linkKey(path[i], path[i + 1])].push([t, t + hop + 0.15])
      dist += len; t += hop
      kp.push(dist / total); ktm.push(t); spl.push('.45 0 .2 1')
      arrive[path[i + 1]].push(t)
      if (i < hops.length - 1) { t += 0.12; kp.push(dist / total); ktm.push(t); spl.push('0 0 1 1') }
    })
    kp.push(1); ktm.push(T); spl.push('0 0 1 1')
    const [bg, ink] = { request: ['#06b6d4', '#083344'], response: ['#34d399', '#052e1c'], log: ['#fbbf24', '#451a03'] }[kind]
    const w = text.length * 0.6 * 11 + 18
    packets += `<g opacity="0"><animateMotion path="M${pts.map((p) => `${p.x} ${p.y}`).join('L')}" keyPoints="${kp.map((v) => Math.round(v * 1e4) / 1e4).join(';')}" keyTimes="${ktm.map(kt).join(';')}" calcMode="spline" keySplines="${spl.join(';')}" dur="${T}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${kt(t0 - 0.05)};${kt(t0 + 0.12)};${kt(t)};${kt(t + 0.16)};1" dur="${T}s" repeatCount="indefinite"/><rect x="${r2(-w / 2 - 3)}" y="-13" width="${r2(w + 6)}" height="26" rx="13" fill="${bg}" fill-opacity=".14"/><rect x="${r2(-w / 2)}" y="-10" width="${r2(w)}" height="20" rx="10" fill="${bg}"/>${d.m(0, 4, text, { size: 11, w: 800, fill: ink, anchor: 'middle' })}</g>`
    return t
  }
  trip('git push', 'request', ['dev', 'ci'], 0.6)
  trip('image', 'request', ['ci', 'reg'], 3.9)
  trip('deploy', 'request', ['reg', 'eks'], 6.4)
  const updated = pods.map((id, i) => trip('v2', 'request', ['eks', id], 7.6 + i * 0.9))
  const asked = trip('GET /learn', 'request', ['learner', 'home', 'cf', 'lb', 'pod2'], 10.8)
  const answered = trip('200 OK', 'response', ['pod2', 'lb', 'cf', 'home', 'learner'], asked + 0.2)
  pods.forEach((id, i) => trip('metrics', 'log', [id, 'graf'], 15.5 + i * 0.22))
  if (answered > 17.1) throw new Error(`the answer lands too late in the loop (${answered.toFixed(2)} s)`)

  for (const [a, b, kind] of links) {
    const p = N[a], q = N[b], line = `M${p.x} ${p.y}L${q.x} ${q.y}`, dash = kind === 'control' ? ' stroke-dasharray="1 6"' : ''
    graph += `<path d="${line}" stroke="${dash ? '#52525b' : '#3f3f46'}" stroke-width="2" stroke-linecap="round"${dash}/>`
    const w = lit[linkKey(a, b)]
    if (w.length) graph += `<g opacity="0"><animate attributeName="opacity" ${track(w, 0.12)} dur="${T}s" repeatCount="indefinite"/><path d="${line}" stroke="#06b6d4" stroke-opacity=".28" stroke-width="7" stroke-linecap="round"${dash}/><path d="${line}" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"${dash}/></g>`
  }

  // A device is in focus (a soft cyan glow behind its icon, its role in cyan) around the moments
  // a packet leaves or lands on it.
  const focus = {}
  for (const id of Object.keys(N)) {
    const w = [...depart[id].map((t) => [t - 0.45, t + 0.4]), ...arrive[id].map((t) => [t - 0.2, t + 1.1])].sort((a, b) => a[0] - b[0])
    const merged = []
    for (const [a, b] of w) { const last = merged[merged.length - 1]; if (last && a <= last[1] + 0.3) last[1] = Math.max(last[1], b); else merged.push([Math.max(0.05, a), Math.min(T - 0.3, b)]) }
    if (merged.length) focus[id] = merged
  }
  defs += `<radialGradient id="focusGlow"><stop offset="0" stop-color="#06b6d4" stop-opacity=".34"/><stop offset="1" stop-color="#06b6d4" stop-opacity="0"/></radialGradient><radialGradient id="readyGlow"><stop offset="0" stop-color="#10b981" stop-opacity=".34"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/></radialGradient>`
  for (const [id, n] of Object.entries(N)) {
    const fx = n.x, fy = n.y
    if (focus[id]) graph += `<ellipse cx="${fx}" cy="${fy}" rx="${ICON_W / 2 + 18}" ry="${ICON_H / 2 + 14}" fill="url(#focusGlow)" opacity="0"><animate attributeName="opacity" ${track(focus[id], 0.3)} dur="${T}s" repeatCount="indefinite"/></ellipse>`
    // lifts a little and pings each time a packet lands on it
    const lifts = arrive[id].flatMap((t) => [[t, 'transform:translateY(0) scale(1)'], [t + 0.16, 'transform:translateY(-3px) scale(1.06)'], [t + 0.5, 'transform:translateY(-3px) scale(1.06)'], [t + 0.75, 'transform:translateY(0) scale(1)']])
    const icon = `<use href="#ic-${n.icon}" x="${r2(fx - at[n.icon].w / 2)}" y="${r2(fy - at[n.icon].h / 2)}"/>`
    graph += lifts.length ? `<g class="${keys([[0, 'transform:translateY(0) scale(1)'], ...lifts, [T, 'transform:translateY(0) scale(1)']], '50% 50%')}">${icon}</g>` : icon
    for (const t of arrive[id]) {
      const tone = id.startsWith('pod') && updated.includes(t) ? '#10b981' : '#06b6d4'
      graph += `<rect x="${fx - ICON_W / 2 - 12}" y="${fy - ICON_H / 2 - 9}" width="${ICON_W + 24}" height="${ICON_H + 18}" rx="${(ICON_H + 18) / 2}" fill="none" stroke="${tone}" stroke-width="2" class="${keys([[0, 'opacity:0;transform:scale(.6)'], [t, 'opacity:0;transform:scale(.6)'], [t + 0.02, 'opacity:.9;transform:scale(.6)'], [t + 0.9, 'opacity:0;transform:scale(1.25)'], [T, 'opacity:0;transform:scale(1.25)']])}"/>`
    }
    if (n.label) {
      graph += label(fx, fy + ICON_H / 2 + 17, n.label)
      graph += d.t(fx, fy + ICON_H / 2 + 33, n.role, { size: 12, w: 700, fill: Z.muted, anchor: 'middle' })
      if (focus[id]) graph += `<g opacity="0"><animate attributeName="opacity" ${track(focus[id], 0.3)} dur="${T}s" repeatCount="indefinite"/>${d.t(fx, fy + ICON_H / 2 + 33, n.role, { size: 12, w: 700, fill: Z.cyan, anchor: 'middle' })}</g>`
    }
  }
  graph += label(N.pod3.x, N.pod3.y + ICON_H / 2 + 17, 'Web Pods')

  // ---- what happens on the devices: bubbles, marks and the pods' version tags
  let talk = ''
  const bubble = (id, text, t0, t1, tone = 'device') => {
    const n = N[id], w = tw(text, 13, 800) + 26, x = n.x - w / 2, y = iconTop(n) - 42
    const [fill, stroke, ink] = tone === 'device' ? ['#083344', '#0891b2', Z.cyan] : ['#18181b', '#3f3f46', Z.ink]
    return pop(t0, t1, '50% 100%', `<rect x="${r2(x)}" y="${y}" width="${r2(w)}" height="30" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M${n.x - 6} ${y + 29.5}l6 6.5 6-6.5" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${n.x - 5} ${y + 29}h10" stroke="${fill}" stroke-width="2"/>${d.t(n.x, y + 20, text, { size: 13, w: 800, fill: ink, anchor: 'middle' })}`)
  }
  // a status pill (centred on x, or starting at x), with a check when it's ok
  const badge = (x, y, text, bg, { ok = false, start = false } = {}) => {
    const w = tw(text, 11, 900) + 18 + (ok ? 14 : 0)
    if (start) x += w / 2
    const check = ok ? `<circle cx="${r2(x + w / 2 - 11)}" cy="${y + 10}" r="6" fill="#10b981"/><path d="M${r2(x + w / 2 - 13.6)} ${y + 10}l1.8 1.8 3.4-3.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` : ''
    return `<rect x="${r2(x - w / 2)}" y="${y}" width="${r2(w)}" height="20" rx="10" fill="${bg}" stroke="${ok ? '#10b981' : HALO}" stroke-width="${ok ? 2 : 3}"/>${d.t(x - (ok ? 7 : 0), y + 14.5, text, { size: 11, w: 900, fill: '#ffffff', anchor: 'middle' })}${check}`
  }
  const mark = (x, y, text, bg, t0, t1, opts) => pop(t0, t1, '50% 50%', badge(x, y, text, bg, opts))
  talk += bubble('ci', 'Typecheck · Tests · Trivy Scan', 1.35, 3.3)
  talk += mark(N.ci.x, iconTop(N.ci) - 30, 'PASSED', '#047857', 3.45, 17.45)
  talk += bubble('reg', 'OIDC · No Static Keys', 4.6, 6.15)
  talk += mark(N.reg.x, iconTop(N.reg) - 30, 'PUSHED', '#047857', 6.3, 17.45)
  talk += mark(N.eks.x, iconTop(N.eks) - 30, 'ROLLING UPDATE', '#8b5cf6', 7.45, 10.4)
  talk += mark(N.lb.x, iconTop(N.lb) - 30, 'ZERO DOWNTIME', '#047857', 10.7, 17.45)
  talk += bubble('cf', 'Tunnel · No Open Ports', 11.75, 13.5)
  talk += bubble('learner', 'Lesson Loaded', answered + 0.05, 17.55, 'plain')
  talk += bubble('graf', 'p95 82 ms · 0 Errors', 16.3, 17.5)
  // each pod's tag: v1, then updating while the new version starts, then v2 (ready)
  pods.forEach((id, i) => {
    const n = N[id], bx = n.x + 34, by = n.y - 10, t = updated[i]
    talk += `<g><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${kt(t)};${kt(t + 0.12)};${kt(17.72)};${kt(17.85)}" dur="${T}s" repeatCount="indefinite"/>${badge(bx, by, 'v1', '#52525b', { start: true })}</g>`
    talk += mark(bx, by, 'UPDATING', '#8b5cf6', t + 0.02, t + 0.45, { start: true })
    talk += mark(bx, by, 'v2', '#0e7490', t + 0.72, 17.45, { ok: true, start: true })
  })
  d.add(`<g style="animation:rise .6s .25s both">${graph}</g>`)
  d.add(`<g style="animation:rise .6s .3s both">${packets}${talk}</g>`)

  // ---- built with
  const stack = [['kubernetes', 'Kubernetes'], ['amazonaws', 'AWS Services', { face: '#232f3e' }], ['terraform', 'Terraform'], ['githubactions', 'GitHub Actions'], ['cloudflare', 'Cloudflare'], ['grafana', 'Grafana']]
  let x = 48
  let row = d.t(x, H - 23, 'BUILT WITH', { size: 11, w: 900, fill: Z.faint, ls: 1.8 })
  x += tw('BUILT WITH', 11, 900, 1.8) + 14
  stack.forEach(([slug, name, opts = {}]) => {
    const icon = appIcon(slug, x, H - 42, 26, { depth: 2.5, ...opts })
    defs += icon.defs
    row += icon.body + d.t(x + 34, H - 23, name, { size: 13.5, w: 800, fill: '#d4d4d8' })
    x += 34 + tw(name, 13.5, 800) + 20
  })
  d.add(`<g style="animation:rise .6s .35s both">${row}</g>`)
  return d.render(defs, css)
}

// ================================================================== TECH STACK
const STACK = [
  ['Network & Security', [['cisco', 'Cisco IOS'], ['wireshark', 'Wireshark'], ['kalilinux', 'Kali Linux'], ['openvpn', 'OpenVPN'], ['cloudflare', 'Cloudflare']]],
  ['Cloud & DevSecOps', [['amazonaws', 'AWS', { face: '#232f3e' }], ['terraform', 'Terraform'], ['ansible', 'Ansible'], ['docker', 'Docker'], ['kubernetes', 'Kubernetes'], ['githubactions', 'Actions']]],
  ['Observability', [['grafana', 'Grafana'], ['loki', 'Loki', { face: '#2b2b33' }], ['prometheus', 'Prometheus']]],
  ['Scripting & Data', [['python', 'Python'], ['gnubash', 'Bash'], ['postgresql', 'PostgreSQL']]],
  ['Systems', [['linux', 'Linux'], ['ubuntu', 'Ubuntu'], ['windows', 'Windows'], ['vmware', 'VMware']]],
  ['Workflow', [['git', 'Git'], ['github', 'GitHub'], ['visualstudiocode', 'VS Code'], ['ollama', 'Ollama']]],
]
function techStack() {
  resetIconDefs()
  const W = 1200, P = 48, gap = 24, cardW = (W - 2 * P - gap) / 2, cardH = 168, top = 128
  const H = top + 3 * (cardH + 20) + 28
  const d = doc(W, H, 'Tech Stack & Tools', STACK.map(([g, items]) => `${g}: ${items.map((i) => i[1]).join(', ')}`).join('. '))
  let defs = duoDefs
  d.add(duo(0, 0, W, H - 4, { r: 24 }))
  d.add(`<g style="animation:rise .6s both">${header(d, P, 58, 'TECH STACK & TOOLS', 'Tools I Build And Break With')}</g>`)
  STACK.forEach(([group, items], gi) => {
    const x = P + (gi % 2) * (cardW + gap), y = top + Math.floor(gi / 2) * (cardH + 20)
    let s = duo(x, y, cardW, cardH, { r: 18, sm: true, depth: 4 })
    s += d.t(x + 22, y + 34, group, { size: 16, w: 900, fill: Z.ink })
    s += d.t(x + cardW - 22, y + 34, `${items.length} TOOLS`, { size: 11, w: 900, fill: Z.faint, ls: 1.4, anchor: 'end' })
    const size = 58, slot = (cardW - 44) / 6
    items.forEach(([slug, label, opts = {}], i) => {
      const cx = x + 22 + slot * (i + (6 - items.length) / 2) + slot / 2
      const icon = appIcon(slug, cx - size / 2, y + 56, size, opts)
      defs += icon.defs
      // the hop wave runs left to right and down the rows
      const hop = 1.8 + ((cx - P) / (W - 2 * P)) * 1.2 + Math.floor(gi / 2) * 0.5
      s += `<g class="hop" style="animation-delay:${r2(hop)}s"><g class="pop" style="animation-delay:${r2(0.15 + gi * 0.08 + i * 0.05)}s">${icon.body}</g></g>`
      s += d.t(cx, y + 142, label, { size: 12.5, w: 800, fill: '#d4d4d8', anchor: 'middle' })
    })
    d.add(`<g style="animation:rise .6s ${r2(0.06 + gi * 0.07)}s both">${s}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .55s cubic-bezier(.2,.9,.3,1.35) both}@keyframes pop{from{opacity:0;transform:scale(.6)}}
${HOP}`)
}

// ================================================================== AI TOOLS
function aiTools() {
  resetIconDefs()
  const W = 1200, H = 254, P = 48, gap = 24, cardW = (W - 2 * P - 2 * gap) / 3
  const d = doc(W, H, 'AI Main Tools', 'Claude by Anthropic, ChatGPT by OpenAI and Codex by OpenAI.')
  let defs = duoDefs
  d.add(duo(0, 0, W, H - 4, { r: 24 }))
  d.add(`<g style="animation:rise .6s both">${header(d, P, 58, 'AI MAIN TOOLS', 'The Assistants In My Workflow')}</g>`)
  const tools = [['claude', 'Claude', 'Anthropic', {}], ['openai', 'ChatGPT', 'OpenAI', { face: '#3f3f46' }], ['codex', 'Codex', 'OpenAI', {}]]
  tools.forEach(([slug, name, maker, opts], i) => {
    const x = P + i * (cardW + gap), y = 128
    let s = duo(x, y, cardW, 92, { r: 18, sm: true, depth: 4 })
    const icon = appIcon(slug, x + 18, y + 16, 60, opts)
    defs += icon.defs
    // an online dot on each disc, like a chat avatar, pinging out of step with its neighbours
    const ox = x + 18 + 52, oy = y + 16 + 52
    const online = `<circle cx="${ox}" cy="${oy}" r="6.5" fill="${Z.green}" stroke="#18181b" stroke-width="3" paint-order="stroke"/><circle cx="${ox}" cy="${oy}" r="6.5" fill="none" stroke="${Z.green}" stroke-width="1.5" class="fb ping" style="animation-delay:${r2(i * 0.6)}s"/>`
    s += `<g class="hop" style="animation-delay:${r2(1.8 + i * 0.22)}s"><g class="pop" style="animation-delay:${r2(0.2 + i * 0.1)}s">${icon.body}${online}</g></g>`
    s += d.t(x + 96, y + 44, name, { size: 22, w: 900, fill: Z.ink, ls: -0.4 })
    s += d.t(x + 96, y + 67, `By ${maker}`, { size: 14, w: 700, fill: Z.muted })
    d.add(`<g style="animation:rise .6s ${r2(0.08 + i * 0.08)}s both">${s}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .55s cubic-bezier(.2,.9,.3,1.35) both}@keyframes pop{from{opacity:0;transform:scale(.6)}}
.ping{animation:ping 1.8s ease-out infinite}@keyframes ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.4);opacity:0}}
${HOP}`)
}

// ================================================================== CERTIFICATIONS
function certifications() {
  resetIconDefs()
  const W = 1200, H = 486
  const d = doc(W, H, 'Certifications', 'Earned: Cisco CCNA 200-301 on 19 March 2026. Preparing: AWS Certified Solutions Architect Associate, November 2026. Planned: Certified Kubernetes Administrator. North star: Certified Kubernetes Security Specialist.')
  const aws = readFileSync(join(VENDOR, 'amazonaws.svg'), 'utf8').match(/ d="([^"]+)"/)[1]
  const cut = aws.indexOf('M21.698')
  const awsWhite = `<path d="${aws.slice(0, cut)}" fill="#ffffff"/><path d="${aws.slice(cut)}" fill="#ff9900"/>`
  const hexagon = (x, y, r) => Array.from({ length: 6 }, (_, k) => { const a = -Math.PI / 2 + (k * Math.PI) / 3; return `${r2(x + r * Math.cos(a))},${r2(y + r * Math.sin(a))}` }).join(' ')
  const dataSvg = (p) => `data:image/svg+xml;base64,${b64(p)}`
  // Each certification sits on a round 3D disc. Earned: the real CCNA logo on a white disc.
  // Planned: CNCF's official white CKA / CKS marks on Kubernetes blue. AWS SAA: the AWS logo in a
  // hexagon on Associate blue (the official badge artwork can't be fetched here; swap it in at vendor/).
  const certs = [
    { status: 'EARNED', color: Z.green, name: ['Cisco Certified', 'Network Associate'], meta: '200-301 · 19 Mar 2026', face: '#fafafa', earned: true,
      ring: (cx, cy, r) => `<circle cx="${r2(cx)}" cy="${cy + 2.5}" r="${r + 9}" fill="none" stroke="${Z.green}" stroke-width="2" class="fb halo"/>`,
      mark: (cx, cy, r) => { const s = r * 1.74; return `<image x="${r2(cx - s / 2)}" y="${r2(cy - s / 2)}" width="${r2(s)}" height="${r2(s)}" clip-path="url(#ccnaClip)" href="data:image/png;base64,${b64(join(VENDOR, 'ccna.png'))}"/>` } },
    { status: 'PREPARING · NOV 2026', color: Z.amber, name: ['AWS Solutions Architect', 'Associate'], meta: 'SAA-C03', face: '#2563eb', dim: 0.82, pulse: true,
      ring: (cx, cy, r) => { const R = r + 9, n = Math.round((2 * Math.PI * R) / 14); return `<circle cx="${r2(cx)}" cy="${cy + 2.5}" r="${R}" fill="none" stroke="${Z.amber}" stroke-opacity=".85" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 ${r2((2 * Math.PI * R) / n - 4)}" class="fb spin"/>` },
      mark: (cx, cy, r) => { const k = (r * 0.84) / 24; return `<polygon points="${hexagon(cx, cy, r * 0.74)}" fill="#ffffff" fill-opacity=".1" stroke="#ffffff" stroke-opacity=".85" stroke-width="2.5" stroke-linejoin="round"/><g transform="translate(${r2(cx - 12 * k)} ${r2(cy - 11.8 * k)}) scale(${r2(k)})">${awsWhite}</g>` } },
    { status: 'PLANNED', color: Z.muted, name: ['Certified Kubernetes', 'Administrator'], meta: 'CNCF · Linux Foundation', face: '#326ce5', dim: 0.5,
      mark: (cx, cy, r) => { const s = r * 1.5; return `<image x="${r2(cx - s / 2)}" y="${r2(cy - s / 2)}" width="${r2(s)}" height="${r2(s)}" href="data:image/svg+xml;base64,${b64(join(VENDOR, 'kubernetes-cka-white.svg'))}"/>` } },
    { status: 'NORTH STAR', color: Z.violet, name: ['Certified Kubernetes', 'Security Specialist'], meta: 'CNCF · Linux Foundation', face: '#326ce5', dim: 0.5,
      mark: (cx, cy, r) => { const s = r * 1.46; return `<image x="${r2(cx - s / 2)}" y="${r2(cy - s / 2)}" width="${r2(s)}" height="${r2(s)}" href="data:image/svg+xml;base64,${b64(join(VENDOR, 'kubernetes-security-specialist-white.svg'))}"/>` } },
  ]
  const x0 = 48, gap = 32, tileW = (W - 2 * x0 - 3 * gap) / 4, tileH = 282, ty = 168, railY = 140
  let defs = `${duoDefs}
<filter id="mono" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter>
<filter id="half" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".6"/></filter>
<linearGradient id="okFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#16a34a"/></linearGradient>
<linearGradient id="amberFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></linearGradient>
<linearGradient id="zincFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#52525b"/><stop offset="1" stop-color="#3f3f46"/></linearGradient>
<linearGradient id="violetFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b4fe"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>
<linearGradient id="earnedRail" x1="0" x2="1"><stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
<linearGradient id="railLight" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
  d.add(duo(0, 0, W, H - 4, { r: 24 }))
  d.add(`<g style="animation:rise .6s both">${d.t(x0, 62, 'CERTIFICATIONS', { size: 12.5, w: 900, fill: Z.muted, ls: 2.2 })}
${d.t(x0 - 1, 100, '', { size: 30, w: 900, fill: Z.ink, ls: -1.2, spans: [['From The Switch Port To The Cluster', null], ['.', Z.cyan]] })}
${pill(d, W - x0, 76, 'CCNA VERIFIED ON CREDLY', { color: Z.green, size: 11, anchor: 'end', h: 26 }).svg}</g>`)

  const dr = 62, dcy = ty + 26 + dr, depth = 5
  const centres = certs.map((_, i) => x0 + i * (tileW + gap) + tileW / 2)
  let rail = ''
  for (let i = 0; i < 3; i++) {
    const a = centres[i] + 18, b = centres[i + 1] - 18
    if (i === 0) {
      rail += `<rect x="${r2(a)}" y="${railY - 2}" width="${r2(b - a)}" height="4" rx="2" fill="url(#earnedRail)"/>`
      rail += `<clipPath id="seg0"><rect x="${r2(a)}" y="${railY - 2}" width="${r2(b - a)}" height="4" rx="2"/></clipPath><g clip-path="url(#seg0)"><rect x="${r2(a - 120)}" y="${railY - 2}" width="120" height="4" fill="url(#railLight)"><animate attributeName="x" values="${r2(a - 120)};${r2(b)}" dur="2.6s" repeatCount="indefinite"/></rect></g>`
    } else {
      rail += `<path d="M${r2(a)} ${railY}H${r2(b)}" stroke="#3f3f46" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 9"/>`
    }
  }
  const star = (x, y, r) => `M${Array.from({ length: 10 }, (_, k) => { const rr = k % 2 ? r * 0.45 : r, a = -Math.PI / 2 + (k * Math.PI) / 5; return `${r2(x + rr * Math.cos(a))},${r2(y + rr * Math.sin(a))}` }).join('L')}Z`
  const node = (x, face, edge, inner) => `<circle cx="${r2(x)}" cy="${railY + 3}" r="14" fill="${edge}"/><circle cx="${r2(x)}" cy="${railY}" r="14" fill="url(#${face})" stroke="#18181b" stroke-width="3" paint-order="stroke"/>${inner}`
  rail += node(centres[0], 'okFace', '#15803d', `<path d="M${r2(centres[0] - 6)} ${railY}l4 4 8-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`)
  rail += node(centres[1], 'amberFace', '#b45309', `<circle cx="${r2(centres[1])}" cy="${railY}" r="4" fill="#fff"/><circle cx="${r2(centres[1])}" cy="${railY}" r="4" fill="none" stroke="#fff" stroke-width="1.5" class="fb ping"/>`)
  rail += node(centres[2], 'zincFace', '#27272a', `<circle cx="${r2(centres[2])}" cy="${railY}" r="4" fill="#a1a1aa"/>`)
  rail += node(centres[3], 'violetFace', '#5b21b6', `<path d="${star(centres[3], railY + 0.5, 6.5)}" fill="#fff" class="twinkle" style="transform-origin:${r2(centres[3])}px ${railY + 0.5}px"/>`)
  d.add(`<g style="animation:rise .6s .08s both">${rail}</g>`)
  certs.forEach((c, i) => {
    const x = x0 + i * (tileW + gap), cx = x + tileW / 2
    let g = duo(x, ty, tileW, tileH, { r: 20, sm: true, depth: 4, ...(c.earned ? { stroke: 'rgba(74,222,128,.45)', edge: 'rgba(21,128,61,.6)' } : {}) })
    // the logo on a round 3D disc: a darker solid edge under a lit face, a faint inner ring
    const gid = `cert${i}`
    defs += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c.face, '#ffffff', 0.18)}"/><stop offset="1" stop-color="${mix(c.face, '#000000', 0.1)}"/></linearGradient>`
    if (c.earned) defs += `<clipPath id="ccnaClip"><circle cx="${r2(cx)}" cy="${dcy}" r="${dr - 3}"/></clipPath>`
    const discSvg = `<circle cx="${r2(cx)}" cy="${dcy + depth}" r="${dr}" fill="${mix(c.face, '#000000', c.earned ? 0.55 : 0.42)}"/><circle cx="${r2(cx)}" cy="${dcy}" r="${dr}" fill="url(#${gid})"/>` +
      `<circle cx="${r2(cx)}" cy="${dcy}" r="${dr - 1}" fill="none" stroke="#ffffff" stroke-opacity="${c.earned ? 0.9 : 0.18}" stroke-width="2"/>${c.mark(cx, dcy, dr)}`
    const disc = (c.dim ? `<g filter="url(#${c.dim > 0.55 ? 'half' : 'mono'})" opacity="${c.dim}">${discSvg}</g>` : discSvg) + (c.ring?.(cx, dcy, dr) ?? '')
    g += `<g class="float" style="animation-delay:-${r2(i * 1.1)}s">${disc}</g>`
    c.name.forEach((line, k) => { g += d.t(cx, ty + 184 + k * 20, line, { size: 15.5, w: 800, fill: c.dim ? '#d4d4d8' : Z.ink, anchor: 'middle' }) })
    g += d.t(cx, ty + 228, c.meta, { size: 12.5, w: 700, fill: Z.muted, anchor: 'middle' })
    g += pill(d, cx, ty + tileH - 42, c.status, { color: c.color, size: 10.5, anchor: 'middle', dot: c.pulse }).svg
    d.add(`<g style="animation:rise .6s ${r2(0.12 + i * 0.1)}s both">${g}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
@keyframes ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.6);opacity:0}}.ping{animation:ping 1.8s ease-out infinite}
.float{animation:float 4.4s ease-in-out infinite}@keyframes float{50%{transform:translateY(-4px)}}
.halo{animation:halo 3s ease-in-out infinite}@keyframes halo{0%,100%{opacity:.12;transform:scale(.97)}50%{opacity:.55;transform:scale(1.03)}}
.spin{animation:spin 18s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.twinkle{animation:twinkle 3.2s ease-in-out infinite}@keyframes twinkle{0%,62%{transform:rotate(0) scale(1)}80%{transform:rotate(36deg) scale(1.35)}100%{transform:rotate(72deg) scale(1)}}`)
}

// ================================================================== CCNA-LABS (learning-path card)
function labs() {
  // Folder names of github.com/RangoGM/ccna-labs; refresh vendor/ccna-labs-folders.json when labs are added.
  const dirs = JSON.parse(readFileSync(join(VENDOR, 'ccna-labs-folders.json'), 'utf8'))
  const groups = [
    { name: 'Switching', topics: 'VLANs · Trunking · Inter-VLAN Routing · STP · EtherChannel', ids: ['01', '02A', '02B', '02C', '03', '05', '05B', '05C', '06'] },
    { name: 'Routing & Redundancy', topics: 'Static · RIPv2 · EIGRP · OSPF Single & Multi-Area · HSRP', ids: ['07', '08', '09A', '09B', '10A', '10B', '10C', '11A', '11B'] },
    { name: 'IPv6', topics: 'Addressing · SLAAC · Static Routes · OSPFv3 · DHCPv6 · RA Guard', ids: ['12A', '12B', '12C', '13', '14', '15', '16'] },
    { name: 'IP Services', topics: 'DHCP · DNS · NAT · Syslog · NTP · SNMPv3', ids: ['04', '17', '19', '21', '22', '23'] },
    { name: 'Security', topics: 'Standard & Extended ACLs · Port Security · 802.1X', ids: ['18', '20', '24', '25', '26'] },
  ]
  const idOf = (n) => n.match(/^(\d+[A-C]?)-/)[1]
  const all = groups.flatMap((g) => g.ids)
  if (dirs.length !== all.length || !dirs.every((n) => all.includes(idOf(n)))) throw new Error(`ccna-labs folders changed: ${dirs.length} folders`)
  const pkt = dirs.filter((n) => /PKT/.test(n)).length, cml = dirs.filter((n) => /CML/.test(n)).length

  const W = 1200, H = 470
  const d = doc(W, H, 'RangoGM/ccna-labs', `${dirs.length} CCNA labs in Cisco Packet Tracer and CML: switching, routing and redundancy, IPv6, IP services and security.`)
  resetIconDefs()
  let defs = duoDefs
  const disc = (glyph, x, y, size, face) => { const t = glyphTile(GLYPHS[glyph] ?? glyph, x, y, size, face); defs += t.defs; return t.body }
  d.add(duo(0, 0, W, H - 4, { r: 24 }))
  // header: icon tile, repo name, summary
  d.add(`<g style="animation:rise .6s both">
  ${disc('book', 48, 40, 50, '#0891b2')}
  ${d.t(114, 59, 'PUBLIC REPOSITORY', { size: 12, w: 900, fill: Z.muted, ls: 2 })}
  ${d.t(113, 88, '', { size: 26, w: 900, fill: Z.ink, ls: -0.8, spans: [['RangoGM / ', Z.faint], ['ccna-labs', null]] })}
</g>`)
  const p1 = pill(d, W - 48, 48, `${dirs.length} LABS`, { color: Z.green, size: 11.5, anchor: 'end', h: 26 })
  const p2 = pill(d, W - 48 - p1.width - 8, 48, 'PACKET TRACER + CML', { color: Z.cyan, size: 11.5, anchor: 'end', h: 26 })
  d.add(`<g style="animation:rise .6s .1s both">${p1.svg}${p2.svg}${d.t(W - 48, 100, 'Each Lab: Topology, Configs, Verification And A Write-Up', { size: 13.5, w: 700, fill: Z.muted, anchor: 'end' })}</g>`)

  // tiles: five domains + environments
  const colW = (W - 96 - 20) / 2, rowH = 86, y0 = 130, gapY = 18
  // After the entrance, a verify wave runs down the domains every 7 s: each check redraws, its disc
  // pings, and a light runs along its bar; the environment bars shine last.
  const wave = (i) => 2.2 + i * 0.3
  defs += `<linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
  const shine = (id, bx, by, bw, begin) => {
    defs += `<clipPath id="${id}"><rect x="${r2(bx)}" y="${by}" width="${r2(bw)}" height="6" rx="3"/></clipPath>`
    return `<g clip-path="url(#${id})"><rect x="${r2(bx - 70)}" y="${by}" width="70" height="6" fill="url(#shine)"><animate attributeName="x" values="${r2(bx - 70)};${r2(bx + bw)};${r2(bx + bw)}" keyTimes="0;.2;1" dur="7s" begin="${r2(begin)}s" repeatCount="indefinite"/></rect></g>`
  }
  const tiles = [...groups.map((g) => ({ ...g, count: g.ids.length })), { name: 'Lab Environments', env: true }]
  tiles.forEach((g, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 48 + col * (colW + 20), y = y0 + row * (rowH + gapY)
    const delay = r2(0.2 + i * 0.1)
    let s = duo(x, y, colW, rowH, { r: 16, sm: true, depth: 3 })
    if (!g.env) {
      // a solid green disc; its white check draws in, then redraws with each verify wave
      s += disc('', x + 16, y + 16, 40, '#16a34a') + `<path d="M${x + 27} ${y + 36}l6 6 12-12" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="26" style="animation:check .5s ${r2(delay + 0.5)}s ease-out both,recheck 7s ${r2(wave(i))}s infinite"/>` +
        `<circle cx="${x + 36}" cy="${y + 36}" r="20" fill="none" stroke="${Z.green}" stroke-width="2" opacity="0" class="fb verify" style="animation-delay:${r2(wave(i))}s"/>`
      s += d.t(x + 72, y + 33, g.name, { size: 17, w: 800, fill: Z.ink })
      s += d.t(x + colW - 18, y + 33, `${g.count} LABS`, { size: 11.5, w: 900, fill: Z.muted, ls: 1.2, anchor: 'end' })
      s += d.t(x + 72, y + 53, g.topics, { size: 13, w: 700, fill: Z.muted })
      const bw = colW - 72 - 18
      s += `<rect x="${x + 72}" y="${y + 64}" width="${r2(bw)}" height="6" rx="3" fill="#27272a"/><rect x="${x + 72}" y="${y + 64}" width="${r2(bw)}" height="6" rx="3" fill="#22c55e" class="bar" style="animation:fill 1s ${r2(delay + 0.2)}s cubic-bezier(.2,.8,.2,1) both"/>`
      s += shine(`lb${i}`, x + 72, y + 64, bw, wave(i) + 0.45)
    } else {
      s += disc('monitor', x + 16, y + 16, 40, '#0891b2')
      s += d.t(x + 72, y + 33, g.name, { size: 17, w: 800, fill: Z.ink })
      const bars = [['Packet Tracer', pkt, '#38bdf8'], ['Cisco CML', cml, Z.cyan]]
      const bw = (colW - 72 - 18 - 16) / 2
      bars.forEach(([label, n, color], k) => {
        const bx = x + 72 + k * (bw + 16)
        s += d.t(bx, y + 53, label, { size: 13, w: 700, fill: Z.muted })
        s += d.t(bx + bw, y + 53, String(n), { size: 13, w: 900, fill: Z.ink, anchor: 'end' })
        s += `<rect x="${r2(bx)}" y="${y + 64}" width="${r2(bw)}" height="6" rx="3" fill="#27272a"/><rect x="${r2(bx)}" y="${y + 64}" width="${r2(bw * n / dirs.length)}" height="6" rx="3" fill="${color}" class="bar" style="animation:fill 1s ${r2(delay + 0.2 + k * 0.15)}s cubic-bezier(.2,.8,.2,1) both"/>`
        s += shine(`le${k}`, bx, y + 64, (bw * n) / dirs.length, wave(i) + 0.45 + k * 0.2)
      })
    }
    d.add(`<g style="animation:rise .6s ${delay}s both">${s}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}@keyframes check{from{stroke-dashoffset:26}to{stroke-dashoffset:0}}
@keyframes recheck{0%{stroke-dashoffset:26;animation-timing-function:ease-out}7%,100%{stroke-dashoffset:0}}
.verify{animation:verify 7s ease-out infinite}@keyframes verify{0%,6%{transform:scale(1);opacity:0}8%{opacity:.75}22%,100%{transform:scale(1.6);opacity:0}}
.bar{transform-box:fill-box;transform-origin:left center}@keyframes fill{from{transform:scaleX(0)}}`)
}

// ================================================================== FOOTER
function footer() {
  const W = 1200, H = 200
  const d = doc(W, H, 'Build Labs. Break Things. Document Everything.', 'Closing motto in RangoNetwork landing type.')
  const parts = [['Build Labs', '.'], ['Break Things', '.'], ['Document Everything', '.']]
  const size = 46, ls = -0.05 * size
  const widths = parts.map(([w, s]) => tw(w + s, size, 950, ls))
  const space = 18
  let x = (W - widths.reduce((a, b) => a + b, 0) - space * 2) / 2
  // a light runs through the motto every 7 s, as through the hero's name, and another along the hairline
  const x0 = x, x1 = W - x, span = x1 - x0
  const ink = (id, base) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r2(x0)}" y1="0" x2="${r2(x1)}" y2="0"><stop offset="0" stop-color="${base}"/><stop offset=".44" stop-color="${base}"/><stop offset=".5" stop-color="#a5f3fc"/><stop offset=".56" stop-color="${base}"/><stop offset="1" stop-color="${base}"/><animateTransform attributeName="gradientTransform" type="translate" values="-${r2(span)} 0;-${r2(span)} 0;${r2(span)} 0" keyTimes="0;.45;1" dur="7s" begin="1.6s" repeatCount="indefinite"/></linearGradient>`
  const defs = `${duoDefs}<clipPath id="fl"><rect x="0" y="40" width="${W}" height="${size + 22}"/></clipPath>${ink('inkSoft', '#d4d4d8')}${ink('inkBright', Z.ink)}
<clipPath id="hl"><rect x="${W / 2 - 160}" y="122" width="320" height="2" rx="1"/></clipPath>
<linearGradient id="hlight" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<linearGradient id="hline" x1="0" x2="1"><stop offset="0" stop-color="#a5f3fc" stop-opacity="0"/><stop offset=".16" stop-color="#a5f3fc" stop-opacity=".6"/><stop offset=".5" stop-color="#f2fdff"/><stop offset=".84" stop-color="#a5f3fc" stop-opacity=".6"/><stop offset="1" stop-color="#a5f3fc" stop-opacity="0"/></linearGradient>
<filter id="hglow" x="-10%" y="-400%" width="120%" height="900%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
  d.add(duo(0, 0, W, H - 4, { r: 24 }))
  d.add(`<g clip-path="url(#fl)">${parts.map(([w, s], i) => {
    const out = `<g style="animation:lineUp .9s ${r2(0.15 + i * 0.16)}s cubic-bezier(.2,.8,.2,1) both">${d.t(x, 94, '', { size, w: 950, fill: i === 1 ? 'url(#inkBright)' : 'url(#inkSoft)', ls, spans: [[w, null], [s, Z.cyan]] })}</g>`
    x += widths[i] + space
    return out
  }).join('')}</g>`)
  d.add(`<rect x="${W / 2 - 160}" y="122" width="320" height="2" rx="1" fill="url(#hline)" filter="url(#hglow)" class="fb" style="animation:grow 1.1s .7s cubic-bezier(.2,.8,.2,1) both"/>
<g filter="url(#hglow)"><g clip-path="url(#hl)"><rect x="${W / 2 - 230}" y="122" width="70" height="2" fill="url(#hlight)" opacity="0"><animate attributeName="x" values="${W / 2 - 230};${W / 2 + 160}" dur="3.5s" begin="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.25;.75;1" dur="3.5s" begin="2s" repeatCount="indefinite"/></rect></g></g>`)
  d.add(`<g style="animation:rise .7s 1s both">${d.t(W / 2, 160, '', { size: 14, w: 700, fill: Z.muted, anchor: 'middle', spans: [['Dat Tran Gia', '#d4d4d8'], [' · Network Engineer On The DevSecOps Path · Ho Chi Minh City', null]] })}</g>`)
  return d.render(defs, `@keyframes lineUp{from{transform:translateY(${size + 16}px)}}@keyframes grow{from{transform:scaleX(0);opacity:0}}@keyframes rise{from{opacity:0;transform:translateY(10px)}}`)
}

save('hero.svg', () => hero())
save('now-building.svg', () => building())
save('ccna-labs.svg', () => labs())
save('tech-stack.svg', () => techStack())
save('ai-tools.svg', () => aiTools())
save('certifications.svg', () => certifications())
save('footer.svg', () => footer())
