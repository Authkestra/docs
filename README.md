<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/mark-on-dark.svg">
  <img src=".github/assets/mark-on-light.svg" alt="Authkestra" width="56" height="56">
</picture>

# Authkestra documentation site

The source for <https://docs.authkestra.com>, built with [Astro](https://astro.build) and
[Starlight](https://starlight.astro.build).

This repo used to live at `website/` inside the `marcjazz/authkestra` monorepo. It was split out
with `git subtree split` so the docs could deploy on their own subdomain (`docs.authkestra.com`,
separate from the landing page at `authkestra.com`) without dragging the Rust workspace along —
the commit history above this point is the real history of that directory, not a fresh start.

## 🚀 Project Structure

```
.
├── public/                     # favicon and other static assets
├── src/
│   ├── content/
│   │   └── docs/               # every page on the site
│   ├── styles/
│   │   ├── tokens.css          # copy of the canonical design tokens — see below
│   │   └── custom.css          # maps tokens.css onto Starlight's --sl-* variables
│   └── content.config.ts
├── astro.config.mjs             # site config + the sidebar definition
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in `src/content/docs/`. Each file is exposed as a route
based on its file name — but a new page only appears in the navigation once it is added to the
`sidebar` array in `astro.config.mjs`.

Images referenced from Markdown go in `src/assets/` (create it if it does not exist) and are
embedded with a relative link. Static assets, like favicons, go in `public/`.

## 🎨 Design tokens

`src/styles/tokens.css` is a **verbatim copy** of the canonical
`authkestra/design/tokens.css` — the same file the landing page and the playground copy. Do not
edit it here: edit the canonical file in the `marcjazz/authkestra` repo, then re-copy it into this
file unchanged (the header comment at the top of the file repeats this). `src/styles/custom.css`
is where this site's own styling lives — it imports `tokens.css` and maps the tokens onto the
`--sl-*` variables Starlight itself reads, plus a handful of card/code-block/tab rules that are
specific to Starlight's markup and not part of the shared design system.

Type comes from `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`, imported
directly in `custom.css` rather than loaded from a Google Fonts `<link>`, so the fonts ship from
this site's own build instead of costing every visitor a third-party round trip.

## 🧞 Commands

All commands are run from this directory:

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `pnpm install`    | Installs dependencies                        |
| `pnpm dev`        | Starts local dev server at `localhost:4321`  |
| `pnpm build`      | Build the production site to `./dist/`       |
| `pnpm preview`    | Preview the build locally, before deploying  |
| `pnpm astro ...`  | Run CLI commands like `astro add`, `astro check` |

## ✍️ Writing docs

Code samples on this site are not compiled by CI, so they drift easily. If you're documenting a
public API change, check it against the `marcjazz/authkestra` repo's `crates/` before publishing —
this repo no longer has that source next to it to grep. Where a runnable example exists under that
repo's `crates/authkestra/examples/`, link to it and quote its `cargo run` command rather than
inventing a fresh snippet — the examples *are* compiled, this site's prose is not.

## 🚢 Deployment

This site deploys to **docs.authkestra.com**. `astro.config.mjs`'s `site` value and the sitemap
both assume that host — if you ever need to preview under a different one, override `site` for
that build rather than committing a change to it.

## 👀 Want to learn more?

Check out [Starlight's docs](https://starlight.astro.build/) or read
[the Astro documentation](https://docs.astro.build).
