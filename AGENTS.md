## What this repo is

This is a standalone Astro + Starlight site — the documentation for Authkestra, deployed at
`docs.authkestra.com`. It used to be the `website/` directory inside the `marcjazz/authkestra`
monorepo and was split out with its git history intact; it is no longer part of that workspace and
has no `crates/` next to it. If you need to check a documented API against the real source, that
lives in the `marcjazz/authkestra` repo, not here.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Design tokens are a copy, not a source

`src/styles/tokens.css` is copied verbatim from the canonical `authkestra/design/tokens.css`.
Never edit colours, spacing, or type values in this repo directly — change the canonical file in
`marcjazz/authkestra` and re-copy it here unchanged. `src/styles/custom.css` is the one file in
this repo that's allowed to make styling decisions: it maps the tokens onto Starlight's `--sl-*`
variables and holds the handful of rules (cards, code blocks, tabs) that are specific to
Starlight's own markup.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
