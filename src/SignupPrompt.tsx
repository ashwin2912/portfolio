/**
 * Card that appears after a few minutes of reading a post, asks who the
 * reader is, and sends a sign-up to /api/signup. Shown at most once per
 * visit; hidden for 30 days after a dismiss and for good after sign-up.
 */
import React, { useEffect, useState } from "react";

/** Visible-tab reading time before the card appears. */
const DELAY_MS = 3 * 60 * 1000;
const DISMISS_DAYS = 30;
const STORAGE_KEY = "signup-prompt";
/** Where readers can ask for their data to be deleted. */
const CONTACT_URL = "https://x.com/dan_man37";

type Role = "explorer" | "allocator" | "other";
type Step = "hidden" | "role" | "form" | "sending" | "done";

const ROLE_LABELS: Record<Role, string> = {
  explorer: "Fellow explorer",
  allocator: "Capital allocator",
  other: "Something else",
};

/** True when a past dismiss or sign-up means the card should stay hidden. */
function suppressed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { state, at } = JSON.parse(raw) as { state: string; at: number };
    if (state === "signed-up") return true;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function remember(state: "dismissed" | "signed-up") {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, at: Date.now() }));
  } catch {
    // storage blocked; the card may show again next visit
  }
}

/** Once per page load, across posts, so navigating doesn't re-trigger it. */
let shownThisVisit = false;

export default function SignupPrompt({ slug }: { slug: string }) {
  const [step, setStep] = useState<Step>("hidden");
  const [role, setRole] = useState<Role>("explorer");
  const [error, setError] = useState("");

  // Count only time with the tab visible, then show the card.
  useEffect(() => {
    if (shownThisVisit || suppressed()) return;
    let remaining = DELAY_MS;
    let started = 0;
    let timer: number | undefined;

    const start = () => {
      started = Date.now();
      timer = window.setTimeout(() => {
        shownThisVisit = true;
        setStep("role");
      }, remaining);
    };
    const pause = () => {
      window.clearTimeout(timer);
      remaining -= Date.now() - started;
    };
    const onVisibility = () => (document.hidden ? pause() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slug]);

  if (step === "hidden") return null;

  function dismiss() {
    remember("dismissed");
    setStep("hidden");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setStep("sending");
    setError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          email: data.get("email"),
          name: data.get("name"),
          firm: data.get("firm"),
          note: data.get("note"),
          newsletter: data.get("newsletter") === "on",
          website: data.get("website"),
          sourcePost: slug,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      remember("signed-up");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    }
  }

  return (
    <aside className="signup" aria-label="Sign up">
      <button className="signup-close" onClick={dismiss} aria-label="Close">
        ×
      </button>

      {step === "role" && (
        <>
          <p className="signup-title">Who's reading?</p>
          <div className="signup-roles">
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setStep("form");
                }}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </>
      )}

      {(step === "form" || step === "sending") && (
        <form onSubmit={submit}>
          <p className="signup-title">{ROLE_LABELS[role]}</p>
          {role === "allocator" && (
            <input name="name" placeholder="Name" autoComplete="name" required />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
          />
          {role === "allocator" && (
            <input name="firm" placeholder="Firm (optional)" autoComplete="organization" />
          )}
          <textarea
            name="note"
            rows={2}
            placeholder={
              role === "explorer"
                ? "What are you exploring? (optional)"
                : role === "allocator"
                  ? "Anything I should know? (optional)"
                  : "What brings you here? (optional)"
            }
          />
          {role === "explorer" && (
            <label className="signup-check">
              <input name="newsletter" type="checkbox" /> Email me new essays
            </label>
          )}
          {/* Honeypot: hidden from people, filled in by bots. */}
          <input
            name="website"
            className="signup-hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          {error && <p className="signup-error">{error}</p>}
          <button type="submit" disabled={step === "sending"}>
            {step === "sending"
              ? "Sending…"
              : role === "allocator"
                ? "Request the Vybd deck"
                : "Sign up"}
          </button>
          <p className="signup-fine">
            I store only what you type here and which post you were reading.{" "}
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              Ask me
            </a>{" "}
            to delete it anytime.
          </p>
        </form>
      )}

      {step === "done" && (
        <p className="signup-title">
          {role === "allocator" ? "Thanks, I'll reply personally." : "Thanks, glad you're here."}
        </p>
      )}
    </aside>
  );
}
