/**
 * Base64 Encoder / Decoder — REFERENCE TOOL #1  (v2)
 *
 * ARCHETYPE: Text-in / Text-out
 * Copy this file when building any tool that takes text input and produces text output.
 *
 * Pattern:
 *   - Left (OutputPanel): textarea input + textarea output
 *   - Right (OptionsPanel): mode toggle + options + action button + copy/clear
 *   - Logic: runs client-side only (no server calls)
 *   - Live update: debounced 100ms as user types
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';

// ── ENCODING LOGIC ────────────────────────────────────────────────────
// Full UTF-8 support: handles emoji, CJK, accented chars, etc.
function encodeBase64(text, urlSafe = false) {
  try {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    let result = btoa(binary);
    if (urlSafe) result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return { output: result, error: null };
  } catch (e) {
    return { output: '', error: 'Encoding failed: ' + e.message };
  }
}

function decodeBase64(text, urlSafe = false) {
  try {
    let b64 = text.trim();
    if (urlSafe) {
      b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
    }
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { output: new TextDecoder().decode(bytes), error: null };
  } catch (e) {
    return { output: '', error: 'Invalid Base64 input. Check that the string is properly encoded.' };
  }
}

function byteCount(str) {
  return new TextEncoder().encode(str).length;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── COPY BUTTON WITH ICON TRANSITION ─────────────────────────────────
function IconCopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silently fail — browser may deny clipboard outside user gesture
    }
  };

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' copied' : ''}`}
      onClick={handleCopy}
      disabled={!text}
    >
      <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── COMPONENT ─────────────────────────────────────────────────────────
export default function Base64Encoder() {
  const [input, setInput]       = useState('');
  const [output, setOutput]     = useState('');
  const [mode, setMode]         = useState('encode');   // 'encode' | 'decode'
  const [urlSafe, setUrlSafe]   = useState(false);
  const [lineWrap, setLineWrap] = useState(true);
  const [error, setError]       = useState(null);
  const debounceRef = useRef(null);

  // ── Run conversion ────────────────────────────────────────────────
  const run = useCallback(
    (text = input, currentMode = mode, currentUrlSafe = urlSafe) => {
      if (!text.trim()) {
        setOutput('');
        setError(null);
        return;
      }
      const { output: result, error: err } =
        currentMode === 'encode'
          ? encodeBase64(text, currentUrlSafe)
          : decodeBase64(text, currentUrlSafe);
      setOutput(result);
      setError(err);
    },
    [input, mode, urlSafe]
  );

  // ── Live update on input change (debounced 100ms) ─────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => run(val, mode, urlSafe), 100);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    run(input, newMode, urlSafe);
  };

  const handleUrlSafeChange = (e) => {
    const val = e.target.checked;
    setUrlSafe(val);
    run(input, mode, val);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  // ── Derived stats ─────────────────────────────────────────────────
  const inputBytes   = input  ? byteCount(input)  : 0;
  const outputBytes  = output ? byteCount(output) : 0;
  const sizeRatio    = outputBytes && inputBytes ? outputBytes / inputBytes : null;
  const ratioPercent = sizeRatio !== null ? Math.round((sizeRatio - 1) * 100) : null;

  return (
    <ToolLayout>
      {/* ── LEFT: Input + Output ── */}
      <OutputPanel>
        {/* Input */}
        <div className="panel-label">
          {mode === 'encode' ? 'Plain Text Input' : 'Base64 Input'}
        </div>
        <textarea
          className={`textarea${error ? ' textarea-error' : ''}`}
          placeholder={
            mode === 'encode'
              ? 'Enter text to encode...'
              : 'Paste Base64 string to decode...'
          }
          value={input}
          onChange={handleInputChange}
          style={{
            minHeight: 180,
            marginBottom: 8,
            borderColor: error ? 'var(--error)' : undefined,
            boxShadow: error ? '0 0 0 3px rgba(160,48,48,0.15)' : undefined,
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 12, display: 'flex', gap: 16 }}>
          <span>{input.length} chars</span>
          <span>{formatBytes(inputBytes)}</span>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            background: 'var(--error-bg)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: 12,
          }}>
            <Icon icon={ICON_MAP.AlertCircle} size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#F87171', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          color: 'var(--faint)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <Icon icon={ICON_MAP.ChevronDown} size={14} />
          {mode === 'encode' ? 'Encoded' : 'Decoded'}
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Output */}
        <div className="panel-label">
          {mode === 'encode' ? 'Base64 Output' : 'Plain Text Output'}
        </div>
        <textarea
          className="textarea"
          placeholder="Output will appear here..."
          value={output}
          readOnly
          style={{
            minHeight: 180,
            marginBottom: 8,
            wordBreak: lineWrap ? 'break-all' : 'normal',
            whiteSpace: lineWrap ? 'pre-wrap' : 'pre',
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--faint)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>{output.length} chars</span>
          <span>{formatBytes(outputBytes)}</span>
          {ratioPercent !== null && (
            <span style={{
              color: ratioPercent > 0 ? '#F87171' : '#4ADE80',
              background: ratioPercent > 0 ? 'var(--error-bg)' : 'var(--success-bg)',
              border: `1px solid ${ratioPercent > 0 ? 'var(--error)' : 'var(--success)'}`,
              borderRadius: 'var(--radius-pill)',
              padding: '2px 8px',
              fontSize: 10,
              letterSpacing: '0.06em',
            }}>
              {ratioPercent > 0 ? '+' : ''}{ratioPercent}%
            </span>
          )}
        </div>
      </OutputPanel>

      {/* ── RIGHT: Options ── */}
      <OptionsPanel>
        {/* Mode toggle */}
        <div className="options-label">Mode</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`mode-btn${mode === 'encode' ? ' active' : ''}`}
            onClick={() => handleModeChange('encode')}
          >
            Encode
          </button>
          <button
            type="button"
            className={`mode-btn${mode === 'decode' ? ' active' : ''}`}
            onClick={() => handleModeChange('decode')}
          >
            Decode
          </button>
        </div>

        <div className="panel-divider" />

        {/* Options */}
        <div className="options-label">Options</div>
        <div className="options-row">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={handleUrlSafeChange}
            />
            <span className="checkbox-label">URL-safe (replaces +/= with -_)</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={lineWrap}
              onChange={(e) => setLineWrap(e.target.checked)}
            />
            <span className="checkbox-label">Wrap long output lines</span>
          </label>
        </div>

        <div className="panel-divider" />

        {/* Actions */}
        <Button
          variant="primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => run()}
        >
          {mode === 'encode' ? 'Encode' : 'Decode'}
        </Button>

        <div style={{ display: 'flex', gap: 8 }}>
          <IconCopyButton text={output} />
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        </div>

        <div className="privacy-note">
          100% client-side · your data never leaves this device
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
