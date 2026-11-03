import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import content from "./src/content.json";
import { parse, summary } from "./src/parsePost";

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Link previews (iMessage, Slack, X, LinkedIn) read the HTML without running
 * JS, so every post gets its own copy of index.html with its title and first
 * paragraph in the meta tags: dist/writing/<slug>.html, served at
 * /writing/<slug> via cleanUrls in vercel.json.
 */
function postPreviews(): Plugin {
  return {
    name: "post-previews",
    apply: "build",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      const template = readFileSync(resolve(dist, "index.html"), "utf8");
      const dir = resolve(__dirname, "src/posts");
      mkdirSync(resolve(dist, "writing"), { recursive: true });
      for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
        const post = parse(file, readFileSync(resolve(dir, file), "utf8"));
        const title = escape(post.title);
        const description = escape(summary(post));
        const html = template
          .replace(/<title>.*?<\/title>/, `<title>${title} · ${escape(content.name)}</title>`)
          .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`)
          .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
          .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`)
          .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article" />`);
        writeFileSync(resolve(dist, "writing", `${post.slug}.html`), html);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), postPreviews()],
});
