/**
 * Posts are Markdown files in src/posts/. The filename is the URL slug
 * (/writing/<slug>). Frontmatter:
 *   title:   required
 *   section: homepage section to list it under (default "Essays")
 *   date:    YYYY-MM-DD, newest listed first
 */
export interface Post {
  slug: string;
  title: string;
  section: string;
  date: string;
  body: string;
}

const files = import.meta.glob("./posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parse(path: string, raw: string): Post {
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
    body: match ? raw.slice(match[0].length) : raw,
  };
}

export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => parse(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));
