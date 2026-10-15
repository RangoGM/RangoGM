// RangoGM profile artwork built from RangoNetwork's own components.
// Usage: node design/build.mjs [outDir]   (writes to assets/ by default)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { here, VENDOR, Z, MONOF, tw, r2, b64, esc, doc, duo, duoDefs, pill, appIcon, glyphTile, GLYPHS, resetIconDefs, mix } from './lib.mjs'

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
// field) as a seamless loop. The name is drawn in the same characters and the liquid clears around
// it and around the CLI lines, so the text sits inside the animation rather than on a card.
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

/** One text element per run of glyphs; runs split at 4+ blanks, and non-breaking spaces hold columns. */
function asciiRows(line, x0, y, cellW) {
  let out = ''
  for (const run of line.matchAll(/\S(?:\S| {1,3}(?=\S))*/g)) {
    out += `<text x="${r2(x0 + run.index * cellW)}" y="${r2(y)}">${esc(run[0]).replace(/ /g, ' ')}</text>`
  }
  return out
}

function hero() {
  resetIconDefs()
  const W = 1200, H = 400
  const name = 'Dat Tran Gia'
  const d = doc(W, H, `${name} — Building...`, `${name}, on a card inside an animated ASCII liquid, with "Building..." and a terminal typing network, Kubernetes, Terraform and security commands.`)
  // the liquid: 7 x 13 px cells across the whole banner
  const cellW = 7, cellH = 13, cols = 171, rows = 30, ox = (W - cols * cellW) / 2, oy = 5
  const font = 11.667 // JetBrains Mono advances 0.6em: 7 px columns

  // the card, as the sign-in card sits in the liquid: the name, "Building..." and the CLI
  const cardW = 520, cardH = 236, cardX = (W - cardW) / 2, cardY = 80, pad = 44
  const card = { left: cardX, right: cardX + cardW, top: cardY, bottom: cardY + cardH + 4 }
  const nx = cardX + pad, nameY = cardY + 86

  const prompt = 'dat@hcmc:~$ '
  const cmds = ['show ip ospf neighbor', 'kubectl get pods -A', 'terraform validate', 'npm run security:check']
  const cliSize = 17, cliCh = 0.6 * cliSize
  const bx = cardX + pad, buildY = cardY + 138, trackY = cardY + 158, cliY = cardY + 202, trackW = cardW - 2 * pad

  // the liquid thins out over 40 px around the card and never draws under it
  const mask = new Float32Array(cols * rows)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c + 0.5) * cellW + ox, y = (r + 0.5) * cellH + oy
    const outX = Math.max(card.left - x, 0, x - card.right), outY = Math.max(card.top - y, 0, y - card.bottom)
    mask[r * cols + c] = Math.min(1, Math.hypot(outX, outY) / 40)
  }

  const N = 40, dur = 8
  d.reg('mono', 400, RAMP + ' ')
  const layers = [[1, 5, 0.22], [6, 14, 0.44]]
  const key = (k) => r2((k / N) * 1e4) / 1e4
  let frames = ''
  for (let f = 0; f < N; f++) {
    const grid = liquidFrame(cols, rows, cellW, cellH, f / N, mask)
    const show = f === 0 ? `values="visible;hidden" keyTimes="0;${key(1)}"` : `values="hidden;visible;hidden" keyTimes="0;${key(f)};${key(f + 1)}"`
    let g = `<g visibility="${f === 0 ? 'visible' : 'hidden'}"><animate attributeName="visibility" ${show} calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/>`
    for (const [lo, hi, op] of layers) {
      g += `<g opacity="${op}">`
      for (let r = 0; r < rows; r++) {
        let line = ''
        for (let c = 0; c < cols; c++) { const v = grid[r * cols + c]; line += v >= lo && v <= hi ? RAMP[v] : ' ' }
        g += asciiRows(line, ox, oy + r * cellH + 10, cellW)
      }
      g += '</g>'
    }
    frames += g + '</g>'
  }

  let defs = `${duoDefs}<clipPath id="panel"><rect width="${W}" height="${H}" rx="24"/></clipPath>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".62" stop-color="${Z.page}" stop-opacity="0"/><stop offset="1" stop-color="${Z.page}" stop-opacity=".8"/></radialGradient>
<linearGradient id="nameInk" gradientUnits="userSpaceOnUse" x1="${nx}" y1="0" x2="${nx + trackW}" y2="0"><stop offset="0" stop-color="#f4f4f5"/><stop offset=".42" stop-color="#f4f4f5"/><stop offset=".5" stop-color="${Z.cyan}"/><stop offset=".58" stop-color="#f4f4f5"/><stop offset="1" stop-color="#f4f4f5"/><animateTransform attributeName="gradientTransform" type="translate" values="-${trackW} 0;-${trackW} 0;${trackW} 0" keyTimes="0;.55;1" dur="7s" begin="1.8s" repeatCount="indefinite"/></linearGradient>
<clipPath id="track"><rect x="${bx}" y="${trackY}" width="${trackW}" height="4" rx="2"/></clipPath>
<linearGradient id="trackLight" x1="0" x2="1"><stop offset="0" stop-color="${Z.cyan}" stop-opacity="0"/><stop offset=".5" stop-color="${Z.cyan}"/><stop offset="1" stop-color="${Z.cyan}" stop-opacity="0"/></linearGradient>`

  // terminal typing: each command types, holds, clears; one cursor follows
  const slot = 3.4, total = slot * cmds.length, cmdX = bx + prompt.length * cliCh
  const cur = { kt: [0], x: [cmdX] }
  let typed = ''
  cmds.forEach((c, i) => {
    const start = i * slot, clear = start + slot - 0.3
    const kt = [0], vw = [0]
    for (let k = 0; k <= c.length; k++) { const t = start + 0.35 + k * 0.055; kt.push(r2((t / total) * 1e4) / 1e4); vw.push(r2(k * cliCh)); cur.kt.push(r2((t / total) * 1e4) / 1e4); cur.x.push(r2(cmdX + k * cliCh)) }
    kt.push(r2((clear / total) * 1e4) / 1e4); vw.push(0); kt.push(1); vw.push(0)
    cur.kt.push(r2((clear / total) * 1e4) / 1e4); cur.x.push(cmdX)
    defs += `<clipPath id="cmd${i}"><rect x="${r2(cmdX)}" y="${cliY - 16}" height="22" width="0"><animate attributeName="width" values="${vw.join(';')}" keyTimes="${kt.join(';')}" dur="${total}s" calcMode="discrete" repeatCount="indefinite"/></rect></clipPath>`
    typed += `<g clip-path="url(#cmd${i})">${d.m(cmdX, cliY, c, { size: cliSize, fill: Z.ink })}</g>`
  })
  cur.kt.push(1); cur.x.push(cmdX)

  // liquid, vignette and frame
  d.add(`<g clip-path="url(#panel)"><rect width="${W}" height="${H}" fill="${Z.page}"/>
<g font-family="${MONOF}" font-size="${font}" fill="#ffffff" style="animation:fadeIn 1.2s both">${frames}</g>
<rect width="${W}" height="${H}" fill="url(#vig)"/></g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="24" fill="none" stroke="${Z.edge}"/>`)

  // the card and everything on it
  const bw = 'Building'.length * 0.6 * 20
  d.add(`<g style="animation:rise .8s .2s both">${duo(cardX, cardY, cardW, cardH, { r: 26 })}
${d.t(nx - 2, nameY, name, { size: 64, w: 950, fill: 'url(#nameInk)', ls: -3.2 })}
${d.m(bx, buildY, 'Building', { size: 20, fill: Z.ink })}${[0, 1, 2].map((k) => `<g opacity=".2">${d.m(bx + bw + k * 12, buildY, '.', { size: 20, fill: Z.cyan })}<animate attributeName="opacity" values=".2;1;1;.2" keyTimes="0;.2;.6;1" dur="1.5s" begin="${r2(k * 0.25)}s" repeatCount="indefinite"/></g>`).join('')}
<rect x="${bx}" y="${trackY}" width="${trackW}" height="4" rx="2" fill="#27272a"/>
<g clip-path="url(#track)"><rect x="${bx - 160}" y="${trackY}" width="160" height="4" fill="url(#trackLight)"><animate attributeName="x" values="${bx - 160};${bx + trackW}" dur="2.8s" repeatCount="indefinite"/></rect></g>
${d.m(bx, cliY, 'dat@hcmc', { size: cliSize, fill: Z.green })}${d.m(bx + 8 * cliCh, cliY, ':~$', { size: cliSize, fill: Z.cyan })}${typed}
<rect x="${r2(cmdX)}" y="${cliY - 14}" width="${r2(cliCh)}" height="18" rx="1.5" fill="${Z.cyan}"><animate attributeName="x" values="${cur.x.join(';')}" keyTimes="${cur.kt.join(';')}" dur="${total}s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="1s" calcMode="discrete" repeatCount="indefinite"/></rect></g>`)
  d.reg('mono', 400, 'Building.dat@hcmc:~$' + cmds.join(''))

  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(10px)}}@keyframes fadeIn{from{opacity:0}}`)
}

// ================================================================== SHARED SECTION HEADER
function header(d, x, y, kicker, title, { accent = Z.cyan } = {}) {
  return d.t(x, y, kicker, { size: 12.5, w: 900, fill: Z.muted, ls: 2.2 }) +
    d.t(x - 1, y + 38, '', { size: 30, w: 900, fill: Z.ink, ls: -1.2, spans: [[title, null], ['.', accent]] })
}


// ================================================================== NOW BUILDING
// One card: what RangoNetwork is, the stack it runs on, and a lesson-style scene of how a change
// ships (commit → CI security checks → OIDC to ECR → Kubernetes on AWS) and how a learner reaches it
// (Cloudflare Tunnel → Kubernetes and back). Packets, speech bubbles and marks follow the lessons.
function building() {
  resetIconDefs()
  const W = 1200, H = 474, T = 14
  const d = doc(W, H, 'Now Building — RangoNetwork', 'RangoNetwork, a CCNA v2.0 learning platform, built and operated on AWS, Kubernetes and Terraform with security checks in CI. The scene shows a commit passing CI checks, an image published to ECR through OIDC, a rollout to Kubernetes, and a learner request through Cloudflare Tunnel.')
  let defs = duoDefs
  let css = `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
@keyframes ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.6);opacity:0}}.ping{animation:ping 1.8s ease-out infinite}
.pop{transform-box:fill-box;opacity:0}`
  d.add(duo(0, 0, W, H - 4, { r: 24 }))

  // ---- header
  d.add(`<g style="animation:rise .6s both">${d.t(48, 62, 'NOW BUILDING', { size: 12.5, w: 900, fill: Z.muted, ls: 2.2 })}
${pill(d, 48 + tw('NOW BUILDING', 12.5, 900, 2.2) + 10, 46, 'IN DEVELOPMENT', { color: Z.green, size: 10.5, dot: true }).svg}
${d.t(47, 102, '', { size: 32, w: 900, fill: Z.ink, ls: -1.2, spans: [['RangoNetwork ', null], ['—', Z.cyan], [' CCNA v2.0 Learning Platform', null]] })}
${d.t(48, 132, 'Built And Run End To End On AWS, Kubernetes And Terraform, With Security Checks In CI', { size: 15.5, w: 700, fill: Z.lead })}</g>`)
  const stack = [['kubernetes', 'Kubernetes'], ['amazonaws', 'AWS Services', { face: '#232f3e' }], ['terraform', 'Terraform'], ['githubactions', 'GitHub Actions'], ['cloudflare', 'Cloudflare'], ['grafana', 'Grafana']]
  let x = 48
  let row = d.t(x, 175, 'BUILT WITH', { size: 11, w: 900, fill: Z.faint, ls: 1.8 })
  x += tw('BUILT WITH', 11, 900, 1.8) + 14
  stack.forEach(([slug, label, opts = {}]) => {
    const icon = appIcon(slug, x, 156, 26, { depth: 2.5, ...opts })
    defs += icon.defs
    row += icon.body + d.t(x + 34, 175, label, { size: 13.5, w: 800, fill: '#d4d4d8' })
    x += 34 + tw(label, 13.5, 800) + 20
  })
  d.add(`<g style="animation:rise .6s .1s both">${row}</g>`)

  // ---- scene panel
  const px = 48, py = 204, pw = W - 96, ph = 238
  d.add(`<rect x="${px + 0.5}" y="${py + 0.5}" width="${pw - 1}" height="${ph - 1}" rx="20" fill="#0c0c0f" stroke="#27272a"/>`)
  const nodes = [['laptop', '#52525b', 'Commit'], ['shield', '#16a34a', 'CI Security Checks'], ['package', '#d97706', 'Image Registry'], ['cluster', '#326ce5', 'Kubernetes On AWS'], ['cloud', '#ea7a1a', 'Cloudflare Tunnel'], ['users', '#7c3aed', 'Learners']]
  const step = pw / nodes.length, cy = py + 96, icon = 56
  const cxs = nodes.map((_, i) => px + step * (i + 0.5))
  // links between devices
  let scene = ''
  for (let i = 0; i < nodes.length - 1; i++) scene += `<path d="M${r2(cxs[i] + icon / 2 + 10)} ${cy}H${r2(cxs[i + 1] - icon / 2 - 10)}" stroke="#3f3f46" stroke-width="2.5" stroke-linecap="round"/>`
  nodes.forEach(([glyph, face, label], i) => {
    const t = glyphTile(GLYPHS[glyph], cxs[i] - icon / 2, cy - icon / 2, icon, face)
    defs += t.defs
    scene += t.body + d.t(cxs[i], cy + 52, label, { size: 12.5, w: 900, fill: '#e4e4e7', anchor: 'middle' })
  })
  d.add(`<g style="animation:rise .6s .2s both">${scene}</g>`)

  const pct = (t) => r2((Math.max(0, Math.min(T, t)) / T) * 100)
  const kt = (t) => r2((Math.max(0, Math.min(T, t)) / T) * 1e4) / 1e4
  // a pop: springs in at t0, holds, fades by t1 (CSS, so it can overshoot like the lessons' cubic-bezier)
  let popId = 0
  const pop = (t0, t1, origin, body) => {
    const id = `p${popId++}`
    css += `@keyframes ${id}{0%,${pct(t0)}%{opacity:0;transform:scale(.6)}${pct(t0 + 0.22)}%{opacity:1;transform:scale(1.07)}${pct(t0 + 0.38)}%,${pct(t1)}%{opacity:1;transform:scale(1)}${pct(t1 + 0.25)}%,100%{opacity:0;transform:scale(.92)}}.${id}{transform-origin:${origin};animation:${id} ${T}s linear infinite}`
    return `<g class="pop ${id}">${body}</g>`
  }
  // a speech bubble above node i
  const bubble = (i, text, t0, t1, tone = 'plain') => {
    const w = tw(text, 12.5, 800) + 24, bx = cxs[i] - w / 2, by = cy - icon / 2 - 46
    const [fill, stroke, ink] = tone === 'device' ? ['#083344', '#0891b2', Z.cyan] : ['#18181b', '#3f3f46', Z.ink]
    return pop(t0, t1, '50% 100%', `<rect x="${r2(bx)}" y="${by}" width="${r2(w)}" height="28" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M${r2(cxs[i] - 6)} ${by + 27.5}l6 7 6-7" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${r2(cxs[i] - 5)} ${by + 27}h10" stroke="${fill}" stroke-width="2"/>${d.t(cxs[i], by + 18.5, text, { size: 12.5, w: 800, fill: ink, anchor: 'middle' })}`)
  }
  // a mark on node i's top-right corner
  const mark = (i, text, color, t0, t1) => {
    const w = tw(text, 10, 900, 0.6) + 16, mx = cxs[i] + icon / 2 - 14, my = cy - icon / 2 - 16
    return pop(t0, t1, '0% 50%', `<rect x="${r2(mx)}" y="${my}" width="${r2(w)}" height="20" rx="10" fill="${color}" stroke="#0c0c0f" stroke-width="3" paint-order="stroke"/>${d.t(mx + 8, my + 14, text, { size: 10, w: 900, fill: '#ffffff', ls: 0.6 })}`)
  }
  // a packet riding the links from node a to node b between t0 and t1
  const packet = (a, b, text, t0, t1) => {
    const w = tw(text, 11, 900) + 20
    const path = `M${r2(cxs[a])} ${cy}L${r2(cxs[b])} ${cy}`
    return `<g opacity="0"><animateMotion path="${path}" keyPoints="0;0;1;1" keyTimes="0;${kt(t0)};${kt(t1)};1" calcMode="linear" dur="${T}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${kt(t0)};${kt(t0 + 0.12)};${kt(t1 - 0.12)};${kt(t1)};1" dur="${T}s" repeatCount="indefinite"/>
  <rect x="${r2(-w / 2)}" y="-11" width="${r2(w)}" height="22" rx="11" fill="#06b6d4" stroke="#0c0c0f" stroke-width="4" paint-order="stroke"/>${d.t(0, 4, text, { size: 11, w: 900, fill: '#083344', anchor: 'middle' })}</g>`
  }
  let anim = ''
  anim += packet(0, 1, 'git push', 0.3, 1.4)
  anim += bubble(1, 'Typecheck · Tests · Security Scan', 1.4, 3.1, 'device')
  anim += mark(1, 'PASSED', '#10b981', 2.7, 13.5)
  anim += packet(1, 2, 'Image', 3.3, 4.4)
  anim += bubble(2, 'OIDC · No Static Keys', 4.4, 5.8, 'device')
  anim += mark(2, 'IMMUTABLE TAG', '#d97706', 5.0, 13.5)
  anim += packet(2, 3, 'Rollout', 5.9, 7.0)
  anim += mark(3, 'ROLLED OUT', '#10b981', 7.0, 13.5)
  anim += packet(5, 3, 'GET /learn', 7.6, 9.6)
  anim += bubble(4, 'Tunnel · No Open Ports', 8.2, 9.8)
  anim += packet(3, 5, '200 OK', 9.9, 11.9)
  anim += bubble(5, 'Lesson Loaded', 11.9, 13.4)
  anim += bubble(3, 'Metrics In Grafana', 12.0, 13.5, 'device')
  d.add(anim)

  // lesson-style step chips; the current step lights up
  const steps = [['Commit', 0, 1.6], ['Check', 1.6, 3.3], ['Publish', 3.3, 5.9], ['Deploy', 5.9, 7.6], ['Serve', 7.6, 12.0], ['Observe', 12.0, 13.8]]
  const chipW = steps.map(([s]) => tw(s, 12, 800) + 46)
  let cx = W / 2 - (chipW.reduce((a, b) => a + b, 0) + 10 * (steps.length - 1)) / 2
  let chips = ''
  steps.forEach(([label, t0, t1], i) => {
    const w = chipW[i], y = py + ph - 46
    chips += `<rect x="${r2(cx)}" y="${y}" width="${r2(w)}" height="30" rx="15" fill="#18181b" stroke="#27272a"/>`
    chips += `<rect x="${r2(cx)}" y="${y}" width="${r2(w)}" height="30" rx="15" fill="#083344" stroke="#06b6d4" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${kt(t0)};${kt(t0 + 0.15)};${kt(t1 - 0.15)};${kt(t1)};1" dur="${T}s" repeatCount="indefinite"/></rect>`
    chips += `<circle cx="${r2(cx + 16)}" cy="${y + 15}" r="10" fill="#27272a"/>${d.t(cx + 16, y + 19, String(i + 1), { size: 11, w: 900, fill: '#e4e4e7', anchor: 'middle' })}${d.t(cx + 32, y + 19.5, label, { size: 12, w: 800, fill: '#d4d4d8' })}`
    cx += w + 10
  })
  d.add(`<g style="animation:rise .6s .3s both">${chips}</g>`)
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
      s += `<g class="pop" style="animation-delay:${r2(0.15 + gi * 0.08 + i * 0.05)}s">${icon.body}</g>`
      s += d.t(cx, y + 142, label, { size: 12.5, w: 800, fill: '#d4d4d8', anchor: 'middle' })
    })
    d.add(`<g style="animation:rise .6s ${r2(0.06 + gi * 0.07)}s both">${s}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .55s cubic-bezier(.2,.9,.3,1.35) both}@keyframes pop{from{opacity:0;transform:scale(.6)}}`)
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
    s += `<g class="pop" style="animation-delay:${r2(0.2 + i * 0.1)}s">${icon.body}</g>`
    s += d.t(x + 96, y + 44, name, { size: 22, w: 900, fill: Z.ink, ls: -0.4 })
    s += d.t(x + 96, y + 67, `By ${maker}`, { size: 14, w: 700, fill: Z.muted })
    d.add(`<g style="animation:rise .6s ${r2(0.08 + i * 0.08)}s both">${s}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .55s cubic-bezier(.2,.9,.3,1.35) both}@keyframes pop{from{opacity:0;transform:scale(.6)}}`)
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
      mark: (cx, cy, r) => { const s = r * 1.74; return `<image x="${r2(cx - s / 2)}" y="${r2(cy - s / 2)}" width="${r2(s)}" height="${r2(s)}" clip-path="url(#ccnaClip)" href="data:image/png;base64,${b64(join(VENDOR, 'ccna.png'))}"/>` } },
    { status: 'PREPARING · NOV 2026', color: Z.amber, name: ['AWS Solutions Architect', 'Associate'], meta: 'SAA-C03', face: '#2563eb', dim: 0.82, pulse: true,
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
  rail += node(centres[3], 'violetFace', '#5b21b6', `<path d="${star(centres[3], railY + 0.5, 6.5)}" fill="#fff"/>`)
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
    g += c.dim ? `<g filter="url(#${c.dim > 0.55 ? 'half' : 'mono'})" opacity="${c.dim}">${discSvg}</g>` : discSvg
    c.name.forEach((line, k) => { g += d.t(cx, ty + 184 + k * 20, line, { size: 15.5, w: 800, fill: c.dim ? '#d4d4d8' : Z.ink, anchor: 'middle' }) })
    g += d.t(cx, ty + 228, c.meta, { size: 12.5, w: 700, fill: Z.muted, anchor: 'middle' })
    g += pill(d, cx, ty + tileH - 42, c.status, { color: c.color, size: 10.5, anchor: 'middle', dot: c.pulse }).svg
    d.add(`<g style="animation:rise .6s ${r2(0.12 + i * 0.1)}s both">${g}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}
@keyframes ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.6);opacity:0}}.ping{animation:ping 1.8s ease-out infinite}`)
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
  const tiles = [...groups.map((g) => ({ ...g, count: g.ids.length })), { name: 'Lab Environments', env: true }]
  tiles.forEach((g, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 48 + col * (colW + 20), y = y0 + row * (rowH + gapY)
    const delay = r2(0.2 + i * 0.1)
    let s = duo(x, y, colW, rowH, { r: 16, sm: true, depth: 3 })
    if (!g.env) {
      // DONE tile with the check drawing in
      // a solid green disc; its white check draws in
      s += disc('', x + 16, y + 16, 40, '#16a34a') + `<path d="M${x + 27} ${y + 36}l6 6 12-12" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="26" style="animation:check .5s ${r2(delay + 0.5)}s ease-out both"/>`
      s += d.t(x + 72, y + 33, g.name, { size: 17, w: 800, fill: Z.ink })
      s += d.t(x + colW - 18, y + 33, `${g.count} LABS`, { size: 11.5, w: 900, fill: Z.muted, ls: 1.2, anchor: 'end' })
      s += d.t(x + 72, y + 53, g.topics, { size: 13, w: 700, fill: Z.muted })
      const bw = colW - 72 - 18
      s += `<rect x="${x + 72}" y="${y + 64}" width="${r2(bw)}" height="6" rx="3" fill="#27272a"/><rect x="${x + 72}" y="${y + 64}" width="${r2(bw)}" height="6" rx="3" fill="#22c55e" class="bar" style="animation:fill 1s ${r2(delay + 0.2)}s cubic-bezier(.2,.8,.2,1) both"/>`
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
      })
    }
    d.add(`<g style="animation:rise .6s ${delay}s both">${s}</g>`)
  })
  return d.render(defs, `@keyframes rise{from{opacity:0;transform:translateY(12px)}}@keyframes check{from{stroke-dashoffset:26}to{stroke-dashoffset:0}}
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
  const defs = `${duoDefs}<clipPath id="fl"><rect x="0" y="40" width="${W}" height="${size + 22}"/></clipPath>
<linearGradient id="hline" x1="0" x2="1"><stop offset="0" stop-color="#a5f3fc" stop-opacity="0"/><stop offset=".16" stop-color="#a5f3fc" stop-opacity=".6"/><stop offset=".5" stop-color="#f2fdff"/><stop offset=".84" stop-color="#a5f3fc" stop-opacity=".6"/><stop offset="1" stop-color="#a5f3fc" stop-opacity="0"/></linearGradient>
<filter id="hglow" x="-10%" y="-400%" width="120%" height="900%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
  d.add(duo(0, 0, W, H - 4, { r: 24 }))
  d.add(`<g clip-path="url(#fl)">${parts.map(([w, s], i) => {
    const out = `<g style="animation:lineUp .9s ${r2(0.15 + i * 0.16)}s cubic-bezier(.2,.8,.2,1) both">${d.t(x, 94, '', { size, w: 950, fill: i === 1 ? Z.ink : '#d4d4d8', ls, spans: [[w, null], [s, Z.cyan]] })}</g>`
    x += widths[i] + space
    return out
  }).join('')}</g>`)
  d.add(`<rect x="${W / 2 - 160}" y="122" width="320" height="2" rx="1" fill="url(#hline)" filter="url(#hglow)" class="fb" style="animation:grow 1.1s .7s cubic-bezier(.2,.8,.2,1) both"/>`)
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
