import React, { useEffect, useState } from "react";
import content from "./content.json";
import { posts, type Post } from "./posts";

interface Item {
  title: string;
  /** Omit for plain text. */
  url?: string;
  /** Shown in parentheses after the title, e.g. "NYT, 2025". */
  note?: string;
}

interface Content {
  name: string;
  /** Paragraphs. Supports [label](url) links. */
  intro: string[];
  /** Rendered in order; sections with no items are hidden. */
  sections: { title: string; items: Item[] }[];
}

const site: Content = content;

/** content.json sections, with posts appended to the section they name. */
const sections = (() => {
  const result = site.sections.map((s) => ({ ...s, items: [...s.items] }));
  for (const post of posts) {
    let section = result.find((s) => s.title === post.section);
    if (!section) {
      section = { title: post.section, items: [] };
      result.push(section);
    }
    section.items.push({ title: post.title, url: `/writing/${post.slug}` });
  }
  return result;
})();

/** Relative links (/resume.pdf) stay in the tab; external ones open a new tab. */
const ItemLink: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) =>
  url.startsWith("/") ? (
    <a href={url}>{children}</a>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );

/** Renders `[label](url)` inside a plain string as links; nothing else. */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    parts.push(text.slice(last, match.index));
    parts.push(
      <ItemLink key={match.index} url={match[2]}>
        {match[1]}
      </ItemLink>,
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

/** Blank-line separated paragraphs; lines starting with "> " become quotes. */
function renderBody(body: string): React.ReactNode[] {
  return body
    .trim()
    .split(/\n\s*\n/)
    .map((block, i) =>
      block.startsWith("> ") ? (
        <blockquote key={i}>{renderInline(block.replace(/^> ?/gm, ""))}</blockquote>
      ) : (
        <p key={i}>{renderInline(block)}</p>
      ),
    );
}

function formatDate(date: string): string {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Header({ linkHome }: { linkHome: boolean }) {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // storage blocked; the toggle still works for this visit
    }
    setDark(!dark);
  }

  return (
    <header>
      <h1>{linkHome ? <a href="/" className="home">{site.name}</a> : site.name}</h1>
      <button
        type="button"
        className="toggle"
        onClick={toggleTheme}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      />
    </header>
  );
}

function Home() {
  return (
    <main>
      <Header linkHome={false} />

      {site.intro.map((para, i) => (
        <p key={i}>{renderInline(para)}</p>
      ))}

      {sections
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item.title}>
                  {item.url ? <ItemLink url={item.url}>{item.title}</ItemLink> : item.title}
                  {item.note && <> ({item.note})</>}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}

function PostPage({ post }: { post: Post }) {
  useEffect(() => {
    document.title = `${post.title} · ${site.name}`;
  }, [post]);

  return (
    <main>
      <Header linkHome />
      <article>
        <h2 className="post-title">{post.title}</h2>
        {post.date && <p className="post-date">{formatDate(post.date)}</p>}
        {renderBody(post.body)}
      </article>
    </main>
  );
}

function NotFound() {
  return (
    <main>
      <Header linkHome />
      <p>Page not found.</p>
    </main>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return <Home />;
  const slug = path.match(/^\/writing\/([^/]+)$/)?.[1];
  const post = slug && posts.find((p) => p.slug === slug);
  return post ? <PostPage post={post} /> : <NotFound />;
}
