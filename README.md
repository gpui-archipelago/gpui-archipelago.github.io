# gpui-archipelago-site

The website for [gpui-archipelago](https://github.com/gpui-archipelago/gpui-archipelago) — a
community-maintained space for anyone building with GPUI outside of Zed.

> Every fork is an island. There's no mainland and no one's building one, so the islands have to
> find each other. Here they can.

Built with [Astro](https://astro.build).

## 🧞 Commands

| Command               | Action                                           |
| :-------------------- | :----------------------------------------------- |
| `bun install`         | Installs dependencies                            |
| `bun run dev`         | Starts local dev server at `localhost:4321`      |
| `bun run build`       | Build your production site to `./dist/`          |
| `bun run preview`     | Preview your build locally, before deploying     |
| `bun run astro ...`   | Run CLI commands like `astro add`, `astro check` |

## Project structure

```text
src/
├── components/
│   ├── ForksTable.astro   # "Forks at a glance" table (fork data lives here)
│   ├── SiteFooter.astro
│   └── SiteHeader.astro
├── content/
│   └── news/              # News posts as markdown (one file per post)
├── content.config.ts      # Content collection schema
├── layouts/
│   └── Layout.astro       # HTML shell + global theme (palette & type scale from the design system)
└── pages/
    ├── index.astro        # Home page
    └── news/              # /news/ listing + /news/[...slug]/ article pages
```

## Adding a news post

1. Add `src/content/news/<slug>.md` with frontmatter (`title`, `date`,
   `description`) and the post body as markdown.
2. It automatically appears on `/news/` (newest first) and gets a stable
   permalink at `/news/<slug>/`. The home page teaser picks up the newest post
   on its own.

Tables: on narrow screens tables render as stacked cards. For that layout to
label the cells, use a raw HTML `<table>` (see the August digest) and give each
`<td>` a `data-label` matching its column header. Plain GFM tables still work —
they just fall back to horizontal scroll on mobile.

## Adding a fork

Fork entries are a single data array at the top of `src/components/ForksTable.astro` — name, URL,
star/fork counts, and crate status. Star counts are manually maintained; the comment there notes
how to switch to fetching them from the GitHub API at build time.
