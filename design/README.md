# Profile artwork

The animated SVGs in `assets/` are generated, not hand-edited. They share one look: rounded zinc
cards with a solid 3D bottom edge, round 3D icon discs, Nunito at heavy weights, cyan accent stops and
Title Case labels. The hero's ASCII liquid follows RangoNetwork's sign-in background.

## Rebuild

Requirements: Node 20+, Python 3 with `fonttools` and `brotli` (`pip install fonttools brotli`).

```sh
node design/build.mjs              # writes every card into assets/
node design/preview-activity.mjs   # writes design/out/activity-preview.svg and stats-preview.svg
```

The first run cuts static Nunito weights from the variable font into `design/.cache/`. Text is
embedded as a font subset, so change copy in `build.mjs` and rebuild instead of editing an SVG.

| File | Section |
| --- | --- |
| `build.mjs` → `hero()` | A card in the looping ASCII liquid holding the name, `Building...` and the typed CLI line |
| `build.mjs` → `building()` | Now Building: header, Built With row and the lesson-style pipeline scene |
| `build.mjs` → `labs()` | ccna-labs card (lab groups come from `vendor/ccna-labs-folders.json`) |
| `build.mjs` → `techStack()`, `aiTools()` | Tech Stack & Tools and AI Main Tools (edit the `STACK` list to add a tool) |
| `build.mjs` → `certifications()` | Certification cards and statuses |
| `build.mjs` → `footer()` | Closing motto |
| `lib.mjs` | Colours, card surface, pills, round 3D brand and glyph discs |
| `../.github/activity/render.mjs` | Live cards: the contribution calendar and the profile views and followers badge, redrawn every 6 hours by `.github/workflows/activity.yml` |

Run `ONLY=hero,tech node design/build.mjs` to rebuild only the files whose names contain those words.

Brand icons live in `vendor/icons.json` (path and colour per slug). To add one, copy its path and
hex from [Simple Icons](https://simpleicons.org) into that file and reference the slug in `build.mjs`.

## The live cards

`.github/workflows/activity.yml` reads the contribution calendar and the follower count through
GitHub's GraphQL API with the workflow's own token, reads the profile views count, renders both
cards with `.github/activity/render.mjs` and force-pushes a single commit holding `activity.svg`
and `stats.svg` to the `output` branch, which README.md loads. It runs every 6 hours, on demand,
and whenever a push on any branch changes the renderer or the workflow. Private contributions are
counted only when "Include private contributions on my profile" is turned on in the GitHub
profile settings.

Profile views come from [komarev.com](https://github.com/antonkomarev/github-profile-views-counter).
README.md loads its invisible `style=pixel` counter, which adds a view for each request from
GitHub's image proxy. The counter only counts requests whose user agent starts with `github-camo`,
so the workflow can read the total without adding views.

## Sources

- `vendor/Nunito-Variable.ttf`: Nunito, SIL Open Font License 1.1 (`vendor/OFL.txt`).
- `vendor/jetbrains-mono-latin-400-normal.woff2`: JetBrains Mono, SIL Open Font License 1.1 (`vendor/JetBrainsMono-OFL.txt`).
- `vendor/icons.json`: brand marks from [Simple Icons](https://simpleicons.org) 15.16.0 and 11.15.0 (CC0),
  OpenAI and Codex from [LobeHub Icons](https://github.com/lobehub/lobe-icons) (MIT), Grafana Loki from
  [homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons) (Apache-2.0).
- `vendor/ccna.png`: Cisco CCNA certification logo.
- `vendor/kubernetes-cka-white.svg`, `vendor/kubernetes-security-specialist-white.svg`: CKA and CKS
  logos from [cncf/artwork](https://github.com/cncf/artwork).
- `vendor/amazonaws.svg`: AWS logo from [Simple Icons](https://simpleicons.org) 10.4.0 (CC0), drawn in a hexagon on the
  AWS SAA disc. The official badge artwork could not be downloaded when this was built.
- `vendor/public-commit-dates.txt`: commit dates from public repositories, used only by the preview.
