/**
 * ─────────────────────────────────────────────────────────────────────
 * [TOOL NAME] — CALCULATOR ARCHETYPE TEMPLATE
 * ─────────────────────────────────────────────────────────────────────
 *
 * ARCHETYPE: Calculator / Converter (D)
 * Use for: unit converters, financial calculators, BMI, GPA, date math,
 * percentage tools — anything that takes numeric/select inputs and
 * produces a computed result with no file I/O.
 *
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────
 * 1. Replace every [PLACEHOLDER] with real values.
 * 2. Implement calculate() with your tool's actual math.
 * 3. Adjust the input fields to match your tool's inputs.
 * 4. Adjust the result cards to show your tool's outputs.
 * 5. Remove this comment block before shipping.
 *
 * DO NOT
 * ──────
 * ✗ Hardcode any hex colors — use CSS custom properties
 * ✗ Import icons directly from lucide-react — use ICON_MAP
 * ✗ Use Tailwind — use the CSS classes from styles/globals.css
 * ✗ Make server calls — all logic must be 100% client-side
 * ✗ Use eval() for math — build a safe evaluator or use mathjs
 *
 * See docs/CODEX_PLAYBOOK.md for the full guide.
 * ─────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import ToolLayout  from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon        from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { useCopyState } from '@/lib/tool-utils';

// ── CALCULATION LOGIC ──────────────────────────────────────────────────
// Keep all math here, pure function. Return null if inputs are invalid.
// Return an object with all result fields your tool needs to display.

function calculate(inputs) {
  // TODO: implement your math here
  // inputs is the full state object — destructure what you need
  const { value, unit } = inputs;

  // Validate
  const num = parseFloat(value);
  if (isNaN(num)) return null;

  // Example: just return the input doubled (replace with real logic)
  return {
    result: num * 2,
    formatted: (num * 2).toLocaleString(),
    // Add more result fields as needed
  };
}

// ── COMPONENT ─────────────────────────────────────────────────────────
export default function ToolNameHere() {  // TODO: rename component

  // ── Input state ───────────────────────────────────────────────────
  const [value, setValue] = useState('');
  const [unit, setUnit]   = useState('metric');  // TODO: adjust inputs

  // ── Result state ──────────────────────────────────────────────────
  const [result, setResult] = useState(null);

  // ── Copy state ────────────────────────────────────────────────────
  const [copied, copy] = useCopyState();

  // ── Live calculation ──────────────────────────────────────────────
  useEffect(() => {
    const res = calculate({ value, unit });
    setResult(res);
  }, [value, unit]);

  const handleClear = () => {
    setValue('');
    setResult(null);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <ToolLayout>

      {/* ── LEFT: Inputs + Results ──────────────────────────────── */}
      <OutputPanel>

        {/* Input section */}
        <div className="panel-label">Input</div>

        {/* Primary numeric input */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="number"
            className="textarea"
            placeholder="Enter value…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', fontSize: 18 }}
          />
        </div>

        {/* Unit / mode selector (remove if not needed) */}
        <div className="panel-label">Unit</div>
        <div className="mode-toggle" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={`mode-btn${unit === 'metric' ? ' active' : ''}`}
            onClick={() => setUnit('metric')}
          >
            Metric
          </button>
          <button
            type="button"
            className={`mode-btn${unit === 'imperial' ? ' active' : ''}`}
            onClick={() => setUnit('imperial')}
          >
            Imperial
          </button>
        </div>

        {/* Results section */}
        {result && (
          <>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 20px', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <Icon icon={ICON_MAP.ChevronDown} size={14} />
              Result
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Result cards — add one card per output value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

              {/* Primary result card */}
              <div
                className="result-card"
                style={{
                  gridColumn: '1 / -1',
                  padding: '20px 24px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Result  {/* TODO: contextual label */}
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                  {result.formatted}
                </div>
                {/* Optional unit label below value */}
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
                  units here  {/* TODO */}
                </div>
              </div>

              {/* Secondary stat cards (add as many as needed) */}
              {/* EXAMPLE:
              <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Label</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{result.something}</div>
              </div>
              */}

            </div>
          </>
        )}

        {/* Empty state */}
        {!result && !value && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--faint)' }}>
            <Icon icon={ICON_MAP.Calculator} size={32} />
            <div style={{ marginTop: 12, fontSize: 13 }}>Enter a value to calculate</div>
          </div>
        )}

        {/* Invalid input state */}
        {!result && value && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <Icon icon={ICON_MAP.AlertCircle} size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#F87171', lineHeight: 1.5 }}>Please enter a valid number</span>
          </div>
        )}

      </OutputPanel>

      {/* ── RIGHT: Options + Copy ───────────────────────────────── */}
      <OptionsPanel>

        {/* Tool-specific options */}
        {/* EXAMPLE select option:
        <div className="options-label">Category</div>
        <select
          className="textarea"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ minHeight: 'auto', padding: '10px 14px' }}
        >
          <option value="length">Length</option>
          <option value="mass">Mass</option>
        </select>
        <div className="panel-divider" />
        */}

        {/* EXAMPLE checkbox option:
        <div className="options-label">Options</div>
        <div className="options-row">
          <label className="checkbox-row">
            <input type="checkbox" checked={someOpt} onChange={(e) => setSomeOpt(e.target.checked)} />
            <span className="checkbox-label">Some option</span>
          </label>
        </div>
        <div className="panel-divider" />
        */}

        {/* Copy result */}
        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 8 }}
          onClick={() => copy(result ? String(result.result) : '')}
          disabled={!result}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Result'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          onClick={handleClear}
        >
          Clear
        </button>

        <div className="privacy-note">
          100% client-side · your data never leaves this device
        </div>

      </OptionsPanel>
    </ToolLayout>
  );
}
