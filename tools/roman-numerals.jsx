'use client';

import { useState } from 'react';
import {
  CalculatorEmptyState,
  CalculatorField,
  CalculatorInput,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import {
  arabicToRoman,
  formatNumber,
  romanToArabic,
} from '@/lib/calculator-tool-utils';

function normalizeRomanInput(value) {
  return value.toUpperCase().replace(/[^MDCLXVI]/g, '');
}

function getRomanResult(value) {
  const arabic = romanToArabic(value);
  if (arabic === null) return { value: null, error: 'Use Roman numeral letters only.' };
  const normalized = arabicToRoman(arabic);
  if (!normalized || normalized.roman !== value.trim().toUpperCase()) {
    return { value: null, error: 'That Roman numeral sequence is not valid.' };
  }
  return { value: arabic, error: null };
}

export default function RomanNumerals() {
  const [mode, setMode] = useState('both');
  const [arabicInput, setArabicInput] = useState('');
  const [romanInput, setRomanInput] = useState('');

  const arabicResult = arabicInput ? arabicToRoman(arabicInput) : null;
  const arabicError =
    arabicInput && !arabicResult ? 'Enter a whole number from 1 to 3999.' : null;

  const romanResult = romanInput ? getRomanResult(romanInput) : { value: null, error: null };

  const hasInput = Boolean(arabicInput || romanInput);
  const summaryItems = [
    arabicResult
      ? {
          label: 'Arabic -> Roman',
          value: arabicResult.roman,
          detail: arabicResult.breakdown,
        }
      : null,
    romanResult.value !== null
      ? {
          label: 'Roman -> Arabic',
          value: formatNumber(romanResult.value),
          detail: romanInput.trim().toUpperCase(),
        }
      : null,
  ].filter(Boolean);

  const copyValue = summaryItems
    .map((item) => `${item.label}: ${item.value}${item.detail ? ` (${item.detail})` : ''}`)
    .join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setMode('both');
        setArabicInput('');
        setRomanInput('');
      }}
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['both', 'Show Both'],
              ['arabic', 'Arabic -> Roman'],
              ['roman', 'Roman -> Arabic'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${mode === value ? ' active' : ''}`}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="panel-divider" />
          <CalculatorNotice message="Roman numerals support the standard 1-3999 range and validate subtractive forms like IV, IX, XL, and CM." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Converter
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {mode !== 'roman' ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 18,
              }}
            >
              <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
                Arabic to Roman
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                Convert whole numbers into classic Roman numeral form.
              </div>
              <CalculatorField label="Arabic Number">
                <CalculatorInput
                  type="number"
                  min="1"
                  max="3999"
                  placeholder="1994"
                  value={arabicInput}
                  onChange={(event) => setArabicInput(event.target.value)}
                />
              </CalculatorField>
              {arabicResult ? (
                <CalculatorPrimaryResult
                  label="Roman Numeral"
                  value={arabicResult.roman}
                  detail={arabicResult.breakdown}
                />
              ) : null}
              {arabicError ? <CalculatorNotice tone="error" message={arabicError} /> : null}
            </div>
          ) : null}

          {mode !== 'arabic' ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 18,
              }}
            >
              <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
                Roman to Arabic
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                Paste Roman numerals and convert them back into whole numbers.
              </div>
              <CalculatorField label="Roman Numeral">
                <CalculatorInput
                  placeholder="MCMXCIV"
                  value={romanInput}
                  onChange={(event) => setRomanInput(normalizeRomanInput(event.target.value))}
                />
              </CalculatorField>
              {romanResult.value !== null ? (
                <CalculatorPrimaryResult
                  label="Arabic Number"
                  value={formatNumber(romanResult.value)}
                  detail={`Normalized input: ${romanInput.trim().toUpperCase()}`}
                />
              ) : null}
              {romanResult.error ? <CalculatorNotice tone="error" message={romanResult.error} /> : null}
            </div>
          ) : null}
        </div>

        {!hasInput ? (
          <CalculatorEmptyState
            iconName="Hash"
            title="Translate numbers in both directions"
            message="Convert whole numbers into Roman numerals, validate existing numerals, and inspect the step-by-step Roman breakdown."
          />
        ) : null}

        {summaryItems.length ? (
          <>
            <CalculatorSectionDivider label="Summary" />
            <CalculatorStatGrid items={summaryItems} />
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
