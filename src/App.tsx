import React, { useState } from "react";
import content from "./content.json";

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

export default function App() {
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
    <main>
      <header>
        <h1>{site.name}</h1>
        <button
          type="button"
          className="toggle"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        />
      </header>

      {site.intro.map((para, i) => (
        <p key={i}>{renderInline(para)}</p>
      ))}

      {site.sections
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
