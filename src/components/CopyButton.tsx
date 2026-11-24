"use client";

import { useState } from "react";
import { Check, Copy } from "./icons";

export function CopyButton({
  text,
  label = "Copy link",
  copiedLabel = "Copied",
  className = "btn btn-green",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", text);
    }
  }
  return (
    <button type="button" onClick={copy} className={copied ? "btn btn-copied" + (className.includes("btn-sm") ? " btn-sm" : "") : className}>
      {copied ? <Check size={18} /> : <Copy />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}

export function CopyField({ id, label, value, hint }: { id: string; label: string; value: string; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={id} className="label">{label}</label>
      <div className="row" style={{ gap: 8 }}>
        <input id={id} className="input" readOnly value={value} style={{ flex: "1 1 260px", minWidth: 0 }} onFocus={(e) => e.currentTarget.select()} />
        <CopyButton text={value} />
      </div>
      {hint && <span className="small muted">{hint}</span>}
    </div>
  );
}
