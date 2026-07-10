# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install           # install deps
bun dev               # start dev server (localhost:4321)
bun run build         # build site + resume PDF to dist/
bun run lint          # eslint
bun run format        # prettier write
bun run format:check  # prettier check
bunx wrangler deploy  # build first, then deploy dist/ to Cloudflare Workers
```

Resume PDF generation (in `resume/` subproject):

```bash
cd resume && bun install && bun run build  # generates public/abdullah-hilson-resume.pdf
```

## Deployment

Hosted on **Cloudflare Workers static assets** (config: `wrangler.jsonc`, deployed via
local `bunx wrangler deploy` — no CI). `worker/index.js` 301-redirects the apex
`hilson.net` to the canonical `abdullah.hilson.net`; all other requests serve `dist/`.
Run `bun run build` before deploying so `dist/` is current.

## Architecture

Astro 5 static site with:

- **Tailwind CSS** for styling (base styles in `src/styles/base.css`)
- **React** for interactive components (Search, Card, Datetime)
- **Markdown** for blog posts with remark plugins (toc, collapse)

### Key Files

- `src/config.ts` - site metadata, social links
- `src/content/config.ts` - blog post schema (Zod validation)
- `src/content/blog/*.md` - blog posts (frontmatter: title, pubDatetime, tags, description, draft)
- `src/resume.json` - JSON Resume data (builds to PDF via `resume/` subproject)

### Path Aliases (tsconfig.json)

`@assets/*`, `@config`, `@components/*`, `@content/*`, `@layouts/*`, `@pages/*`, `@styles/*`, `@utils/*`

### OG Images

Dynamic OG image generation via `satori` + `@resvg/resvg-js` in `src/utils/og-templates/`

## Resume Integration

Resume data lives in `src/resume.json`. Changes auto-rebuild PDF via lint-staged pre-commit hook.
