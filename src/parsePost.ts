/**
 * Frontmatter parsing for posts, shared by the app (src/posts.ts) and the
 * build step that writes per-post HTML for link previews (vite.config.ts).
 * Keep this file free of Vite- and browser-only APIs.
 */
export interface Post {
  slug: string;
  title: string;
  section: string;
  date: string;
  ai: boolean;
  toc: boolean;
  body: string;
}

export function parse(path: string, raw: string): Post {
  const slug = path.replace(/^.*\/|\.md$/g, "");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Record<string, string> = {};
  for (const line of match?.[1].split("\n") ?? []) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    slug,
    title: meta.title ?? slug,
    section: meta.section ?? "Essays",
    date: meta.date ?? "",
    ai: meta.ai === "true",
    toc: meta.toc === "true",
    body: match ? raw.slice(match[0].length) : raw,
  };
}

/** First paragraph as plain text (links reduced to labels), for previews. */
export function summary(post: Post, max = 200): string {
  const first =
    post.body
      .trim()
      .split(/\n\s*\n/)
      .find((b) => !/^(## |> |- |\d+\. )/.test(b)) ?? "";
  const text = first.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
