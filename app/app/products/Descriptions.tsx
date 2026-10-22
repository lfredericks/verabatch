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

  async function copy() {
    try {
      await navigator.clipboard.writeText(saved);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!editing) {
    return (
      <div className="form">
        {"hint" in channel && <p className="hint">{channel.hint}</p>}
        {saved ? <Highlighted text={saved} matches={matches} /> : <p className="hint">No {channel.label} description yet.</p>}
        {saved && <ClaimList matches={matches} />}
        {state.saved && (
          <p className="ok" role="status">
            Saved.
          </p>
        )}
        <div className="row">
          <button type="button" className="btn sm" onClick={() => (setText(saved), setEditing(true))}>
            {saved ? "Edit" : `Write the ${channel.label} description`}
          </button>
          {saved && (
            <button type="button" className="btn ghost sm" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
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
        <textarea name="text" rows={8} value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_DESCRIPTION} />
      </label>
      <p className="hint">{text.length.toLocaleString()} characters</p>
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
      <div className="row">
        <button className="btn pri" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
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
      <div className="tabs" role="tablist">
        {CHANNELS.map((c) => {
          const n = flagged(c.key);
          return (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={tab === c.key}
              className={`btn sm${tab === c.key ? " pri" : ""}`}
              onClick={() => setTab(c.key)}
            >
              {c.label}
              {descriptions[c.key] ? (n ? ` ⚠ ${n}` : " ✓") : ""}
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
