'use client';

import { useState } from 'react';

/**
 * CopyButton — copies text to clipboard, shows brief "Copied" state.
 *
 * Props:
 *   text:  string  the text to copy
 *   label: string  button label (default: 'Copy')
 */
export default function CopyButton({ text = '', label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' copied' : ''}`}
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
