# ashwin-site

Personal page: bio, achievements, resume, and writing.

## Editing

All content lives in `src/content.json`:

- `intro`: paragraphs. Inline links with `[label](url)`.
- `sections`: each has a `title` and `items`. An item is `{ "title", "url"?, "note"? }`;
  `note` renders in parentheses after the title. Empty sections are hidden.

Static files (e.g. `resume.pdf`) go in `public/` and are linked as `/resume.pdf`.

## Develop

```sh
npm install
npm run dev
```

## Deploy

Import the repo in Vercel. It detects Vite: build command `npm run build`, output `dist`.
