/**
 * ─────────────────────────────────────────────────────────────────────
 * [TOOL NAME] — TEXT ARCHETYPE TEMPLATE
 * ─────────────────────────────────────────────────────────────────────
 *
 * ARCHETYPE: Text-in / Text-out
 * Use for: encoders/decoders, formatters, converters, analyzers, validators
 * that take text input and produce text output.
 *
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────
 * 1. Replace every [PLACEHOLDER] with real values.
 * 2. Implement processText() with your tool's actual logic.
 * 3. Adjust the options panel to match your tool's settings.
 * 4. Remove this comment block before shipping.
 *
 * DO NOT
 * ──────
 * ✗ Hardcode any hex colors — use CSS custom properties
 * ✗ Import icons directly from lucide-react — use ICON_MAP
 * ✗ Use Tailwind — use the CSS classes from styles/globals.css
 * ✗ Make server calls — all logic must be 100% client-side
 * ✗ Change the ToolLayout / OutputPanel / OptionsPanel structure
 *
 * See docs/CODEX_PLAYBOOK.md for the full guide.
 * ─────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import ToolLayout  from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Button      from '@/components/ui/Button';
import Icon        from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  useDebounce,    // live-update as user types
  useCopyState,   // copy button with timed "Copied!" feedback
  downloadText,   // trigger text file download
} from '@/lib/tool-utils';

// ── PROCESSING LOGIC ─────────────────────────────────────────────────
// Replace this with your tool's actual logic. Keep it pure (no side effects).
// Return { output: string, error: string|null }.

function processText(input, options) {
  // TODO: implement
  // options is the full options state object — destructure what you need
  try {
    const result = input; // replace with real logic
    return { output: result, error: null };
  } catch (e) {
    return { output: '', error: e.message };
  }
}

// ── COMPONENT ─────────────────────────────────────────────────────────
export default function ToolNameHere() {  // TODO: rename component
  // ── State ─────────────────────────────────────────────────────────
  const [input,  setInput]  = useState('');
  const [output, setOutput] = useState('');
  const [error,  setError]  = useState(null);

  // ── Options — add/remove fields to match your tool ────────────────
  const [mode, setMode] = useState('encode');  // remove if tool is unidirectional
  // const [someOption, setSomeOption] = useState(false);

  // ── Derived / copy state ──────────────────────────────────────────
  const [copied, copy] = useCopyState();

  // ── Live update (debounced 150ms) ─────────────────────────────────
  const debouncedInput = useDebounce(input, 150);
  useState(() => {
    if (!debouncedInput.trim()) { setOutput(''); setError(null); return; }
    const { output: result, error: err } = processText(debouncedInput, { mode });
    setOutput(result);
    setError(err);
  }, [debouncedInput, mode]);

  const handleClear = () => { setInput(''); setOutput(''); setError(null); };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <ToolLayout>

      {/* ── LEFT: Input + Output ────────────────────────────────── */}
      <OutputPanel>

        {/* Input */}
        <div className="panel-label">
          Input  {/* TODO: contextual label, e.g. "Plain Text" or "JSON" */}
        </div>
        <textarea
          className="textarea"
          placeholder="Paste or type here…"  {/* TODO: tool-specific placeholder */}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ minHeight: 200, marginBottom: 8 }}
        />

        {/* Character / byte count hint */}
        {input && (
          <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 16 }}>
            {input.length} characters
          </div>
        )}

        {/* Direction divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <Icon icon={ICON_MAP.ChevronDown} size={14} />
          Output  {/* TODO: "Encoded" / "Decoded" / "Formatted" etc. */}
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Error state */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 12 }}>
            <Icon icon={ICON_MAP.AlertCircle} size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#F87171', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Output */}
        <div className="panel-label">
          Output  {/* TODO: contextual label */}
        </div>
        <textarea
          className="textarea"
          placeholder="Output will appear here…"
          value={output}
          readOnly
          style={{ minHeight: 200 }}
        />

      </OutputPanel>

      {/* ── RIGHT: Options ──────────────────────────────────────── */}
      <OptionsPanel>

        {/* Mode toggle — REMOVE if tool is unidirectional */}
        <div className="options-label">Mode</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          <button type="button" className={`mode-btn${mode === 'encode' ? ' active' : ''}`} onClick={() => setMode('encode')}>
            Encode  {/* TODO: rename */}
          </button>
          <button type="button" className={`mode-btn${mode === 'decode' ? ' active' : ''}`} onClick={() => setMode('decode')}>
            Decode  {/* TODO: rename */}
          </button>
        </div>

        <div className="panel-divider" />

        {/* ── Tool-specific options ── */}
        {/* EXAMPLE checkbox option — add/remove as needed:
        <div className="options-label">Options</div>
        <div className="options-row">
          <label className="checkbox-row">
            <input type="checkbox" checked={someOption} onChange={(e) => setSomeOption(e.target.checked)} />
            <span className="checkbox-label">Some option label</span>
          </label>
        </div>
        <div className="panel-divider" />
        */}

        {/* ── Actions ── */}
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => {
            const { output: result, error: err } = processText(input, { mode });
            setOutput(result);
            setError(err);
          }}
          disabled={!input.trim()}
        >
          <Icon icon={ICON_MAP.Zap} size={14} />
          Run  {/* TODO: "Encode", "Format", "Convert", etc. */}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
            onClick={() => copy(output)}
            disabled={!output}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn-ghost" onClick={handleClear} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            Clear
          </button>
        </div>

        {/* Optional: download output as a file */}
        {output && (
          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => downloadText(output, 'output.txt')}  {/* TODO: real filename + mime */}
          >
            <Icon icon={ICON_MAP.Download} size={14} />
            Download
          </button>
        )}

        <div className="privacy-note">
          100% client-side · your data never leaves this device
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
