/**
 * Posts are Markdown files in src/posts/. The filename is the URL slug
 * (/writing/<slug>). Frontmatter:
 *   title:   required
 *   section: homepage section to list it under (default "Essays"); "none"
 *            lists it on its own at the very end of the homepage
 *   date:    YYYY-MM-DD, newest listed first
 *   ai:      true to flag the post as written with AI
 *   toc:     true to show a clickable index of "## " headings after the
 *            first paragraph
 */
import { parse, type Post } from "./parsePost";

export type { Post };

const files = import.meta.glob("./posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => parse(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));
