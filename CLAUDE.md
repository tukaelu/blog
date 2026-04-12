# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup

```bash
pnpm install    # Install dependencies
```

### Build

```bash
pnpm dev        # Start dev server (clears cache first)
pnpm build      # Production build (Astro + OGP images + Pagefind indexing)
pnpm preview    # Preview production build locally
pnpm deploy     # Build and deploy to Cloudflare Workers
pnpm fmt        # Format with Prettier
pnpm fmt:check  # Check formatting
```

## Architecture Overview

### Tech Stack

- **Framework:** Astro 6
- **Hosting:** Cloudflare Workers (`@astrojs/cloudflare`)
- **Styling:** UnoCSS (Tailwind Wind3 preset)
- **Content:** MDX (`remark-gfm`, `rehype-pretty-code` + Shiki)
- **OGP images:** Satori + Resvg, BudouX (Japanese line-breaking)
- **Search:** Pagefind (static, runs post-build)

### Project Structure

```
├── contents/
│   └── posts/
│       ├── ja/     # Japanese posts (year/slug/index.mdx)
│       └── en/     # English posts (year/slug/index.mdx)
├── src/
│   ├── pages/      # File-based routing (ja: /posts/[slug], en: /en/posts/[slug])
│   ├── layouts/    # BaseLayout, PostLayout
│   ├── components/ # Astro components (mdx/, post/, ui/)
│   ├── lib/        # Utilities (posts.ts, ogp.ts, date.ts, constants.ts)
│   └── content.config.ts  # Content collection schema
└── scripts/
    └── generate-ogp.ts    # Post-build OGP image generator
```

### Post Frontmatter Schema

| Field         | Type     | Required | Notes                                    |
| ------------- | -------- | -------- | ---------------------------------------- |
| `title`       | string   | yes      |                                          |
| `slug`        | string   | yes      |                                          |
| `description` | string   | yes      |                                          |
| `tags`        | string[] | yes      |                                          |
| `publishedAt` | date     | yes      |                                          |
| `createdAt`   | date     | yes      |                                          |
| `updatedAt`   | date     | yes      |                                          |
| `icon`        | string   | no       | Fluent UI emoji URL                      |
| `draft`       | boolean  | no       | default: `false`, hidden in production   |
| `unlisted`    | boolean  | no       | default: `false`, excluded from listings |

## Guidelines

### Code Style

Prettier is used for formatting. Key settings: 2-space indent, no semicolons, single quotes.
