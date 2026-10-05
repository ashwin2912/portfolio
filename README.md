# ashwin-site

Personal page: bio, achievements, resume, and writing.

## Editing

All content lives in `src/content.json`:

- `intro`: paragraphs. Inline links with `[label](url)`.
- `sections`: each has a `title` and `items`. An item is `{ "title", "url"?, "note"? }`;
  `note` renders in parentheses after the title. Empty sections are hidden.

Essays and short posts are Markdown files in `src/posts/`; each appears at
`/writing/<filename>` and is listed under its `section` on the homepage:

```md
---
title: My post
section: Short posts
date: 2026-10-05
---

Paragraphs separated by blank lines. [Links](https://example.com) work.

> Lines starting with "> " render as a quote.
```

Static files (e.g. `resume.pdf`) go in `public/` and are linked as `/resume.pdf`.

## Develop

```sh
npm install
npm run dev
```

## Deploy

Import the repo in Vercel. It detects Vite: build command `npm run build`, output `dist`.
