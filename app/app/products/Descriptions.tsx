"use client";

import { Fragment, startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { CHANNELS, MAX_DESCRIPTION, type ChannelKey } from "@/lib/channels";
import { findClaimMatches, type ClaimMatch } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { saveDescription, type DescriptionState } from "./actions";

const pack = activePack();

/** The text with risky words highlighted. */
function Highlighted({ text, matches }: { text: string; matches: ClaimMatch[] }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  matches.forEach((m, i) => {
    if (m.start > at) parts.push(<Fragment key={`t${i}`}>{text.slice(at, m.start)}</Fragment>);
    parts.push(
      <mark key={`m${i}`} className={m.severity === "drug" ? "flag-drug" : "flag-check"}>
        {text.slice(m.start, m.end)}
      </mark>,
    );
    at = m.end;
  });
  if (at < text.length) parts.push(<Fragment key="end">{text.slice(at)}</Fragment>);
  return <div className="desc-text">{parts}</div>;
}

function ClaimList({ matches }: { matches: ClaimMatch[] }) {
  if (!matches.length) return <p className="ok">No risky words found.</p>;
  // One entry per distinct word.
  const seen = new Set<string>();
  const unique = matches.filter((m) => (seen.has(m.word.toLowerCase()) ? false : (seen.add(m.word.toLowerCase()), true)));
  return (
    <div className="note">
      <b>Wording to check ({unique.length}):</b>
      <ul className="tight">
        {unique.map((m) => (
          <li key={m.word.toLowerCase()}>
            <b>&ldquo;{m.word}&rdquo;</b> {m.why} <i>{m.fix}</i>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Channel({ productId, channel, saved }: { productId: string; channel: (typeof CHANNELS)[number]; saved: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(saved);
  const [copied, setCopied] = useState(false);
  const [state, action, saving] = useActionState<DescriptionState, FormData>(saveDescription, {});
  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state]);
  const shown = editing ? text : saved;
  const matches = useMemo(() => findClaimMatches(shown, pack.claimRules), [shown]);

  const [pasteNote, setPasteNote] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(saved);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  /** Bring in a description copied from the shop (Etsy, website...). */
  async function paste() {
    try {
      const got = await navigator.clipboard.readText();
      if (got.trim()) {
        setText(got.slice(0, MAX_DESCRIPTION));
        setEditing(true);
        setPasteNote("");
        return;
      }
      setPasteNote(`Nothing copied yet. Open your ${channel.label} listing, copy the description, then tap Paste again.`);
    } catch {
      // Some browsers don't allow reading the clipboard: open the box so they can paste by hand.
      setText("");
      setEditing(true);
      setPasteNote("Press and hold (or Ctrl+V / Cmd+V) in the box to paste.");
    }
  }

  if (!editing) {
    return (
      <div className="form">
        {"hint" in channel && <p className="hint">{channel.hint}</p>}
        {saved && <Highlighted text={saved} matches={matches} />}
        {saved && <ClaimList matches={matches} />}
        {state.saved && (
          <p className="ok" role="status">
            Saved.
          </p>
        )}
        {!saved && (
          <p className="hint">
            Already have one{channel.key === "other" ? "" : ` on ${channel.label}`}? Copy it there, then tap Paste. We&rsquo;ll check it for risky words.
          </p>
        )}
        {saved ? (
          <div className="desc-actions">
            <button type="button" className="bigbtn bigbtn-pri" onClick={copy}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="8" y="8" width="12" height="12" rx="2" />
                <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
              </svg>
              {copied ? "Copied!" : channel.key === "other" ? "Copy" : `Copy for ${channel.label}`}
            </button>
            <button type="button" className="linkbtn" onClick={() => (setText(saved), setEditing(true))}>
              Edit this description
            </button>
          </div>
        ) : (
          <div className="desc-actions">
            <button type="button" className="bigbtn bigbtn-pri" onClick={paste}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="6" y="4" width="12" height="17" rx="2" />
                <path d="M9 4V3h6v1M9 11h6M9 15h4" />
              </svg>
              {channel.key === "other" ? "Paste" : `Paste from ${channel.label}`}
            </button>
            <button type="button" className="linkbtn" onClick={() => (setText(""), setEditing(true))}>
              Or write one here
            </button>
          </div>
        )}
        {pasteNote && <p className="hint">{pasteNote}</p>}
      </div>
    );
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <input type="hidden" name="channel" value={channel.key} />
      <label className="fld">
        <span>{channel.label} description</span>
        <textarea name="text" rows={8} value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_DESCRIPTION} autoFocus />
      </label>
      <p className="hint">{text.length.toLocaleString()} characters</p>
      {pasteNote && <p className="hint">{pasteNote}</p>}
      {text.trim() && (
        <>
          <p className="hint">Checked as you type:</p>
          <Highlighted text={text} matches={matches} />
          <ClaimList matches={matches} />
        </>
      )}
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <div className="desc-actions">
        <button className="bigbtn bigbtn-pri" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" className="linkbtn" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Descriptions for each place the maker sells, each checked for risky claims. */
export function Descriptions({ productId, descriptions }: { productId: string; descriptions: Partial<Record<ChannelKey, string>> }) {
  const [tab, setTab] = useState<ChannelKey>("etsy");
  const flagged = (k: ChannelKey) => findClaimMatches(descriptions[k] ?? "", pack.claimRules).length;
  return (
    <section className="card" aria-labelledby="desc">
      <h2 id="desc">Descriptions</h2>
      <p className="hint">
        What you say about the product where you sell it. The FDA counts these claims too, not just the label.
      </p>
      <div className="seg seg-4" role="tablist" aria-label="Where you sell">
        {CHANNELS.map((c) => {
          const n = flagged(c.key);
          const has = Boolean(descriptions[c.key]);
          return (
            <button key={c.key} type="button" role="tab" aria-selected={tab === c.key} aria-pressed={tab === c.key} onClick={() => setTab(c.key)}>
              {c.label}
              {has && (
                <span className={`dot ${n ? "dot-warn" : "dot-ok"}`} aria-label={n ? `${n} word${n === 1 ? "" : "s"} to check` : "No risky words"} />
              )}
            </button>
          );
        })}
      </div>
      {CHANNELS.filter((c) => c.key === tab).map((c) => (
        <Channel key={c.key} productId={productId} channel={c} saved={descriptions[c.key] ?? ""} />
      ))}
    </section>
  );
}
