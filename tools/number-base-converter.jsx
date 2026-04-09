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
  convertBaseNumber,
  formatBaseInteger,
  parseBaseInteger,
} from '@/lib/calculator-tool-utils';

function clampBase(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return fallback;
  return String(Math.min(36, Math.max(2, parsed)));
}

export default function NumberBaseConverter() {
  const [input, setInput] = useState('');
  const [fromBase, setFromBase] = useState('10');
  const [customBase, setCustomBase] = useState('36');

  const parsedValue = input.trim() ? parseBaseInteger(input, fromBase) : null;
  const isInvalid = input.trim() && parsedValue === null;

  const outputs =
    parsedValue === null
      ? null
      : {
          binary: formatBaseInteger(parsedValue, 2),
          octal: formatBaseInteger(parsedValue, 8),
          decimal: formatBaseInteger(parsedValue, 10),
          hex: formatBaseInteger(parsedValue, 16),
          custom: convertBaseNumber(input, fromBase, customBase),
        };

  const statItems = outputs
    ? [
        { label: 'Binary', value: outputs.binary },
        { label: 'Octal', value: outputs.octal },
        { label: 'Decimal', value: outputs.decimal },
        { label: 'Hexadecimal', value: outputs.hex },
        { label: `Base ${customBase}`, value: outputs.custom },
      ]
    : [];

  const copyValue = statItems.map((item) => `${item.label}: ${item.value}`).join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setInput('');
        setFromBase('10');
        setCustomBase('36');
      }}
      options={
        <>
          <div className="options-label">Quick Bases</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {['2', '8', '10', '16'].map((base) => (
              <button
                key={base}
                type="button"
                className={`mode-btn${fromBase === base ? ' active' : ''}`}
                onClick={() => setFromBase(base)}
              >
                Base {base}
              </button>
            ))}
          </div>

          <div className="options-label">From Base</div>
          <CalculatorInput
            type="number"
            min="2"
            max="36"
            value={fromBase}
            onChange={(event) => setFromBase(clampBase(event.target.value, fromBase))}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Custom Output Base</div>
          <CalculatorInput
            type="number"
            min="2"
            max="36"
            value={customBase}
            onChange={(event) => setCustomBase(clampBase(event.target.value, customBase))}
            style={{ marginBottom: 20 }}
          />

          <div className="panel-divider" />
          <CalculatorNotice message="Integer-only conversion with exact BigInt math, so long binary, octal, and hex values stay precise." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Number Input
        </div>

        <CalculatorField
          label={`Value in Base ${fromBase}`}
          help="Supported bases range from 2 through 36. Digits above 9 use A-Z."
        >
          <CalculatorInput
            placeholder="FF or 101011"
            value={input}
            onChange={(event) => setInput(event.target.value.toUpperCase().replace(/\s+/g, ''))}
          />
        </CalculatorField>

        {!input.trim() ? (
          <CalculatorEmptyState
            iconName="Cpu"
            title="Convert any integer between bases 2 and 36"
            message="Paste a value in binary, octal, decimal, hexadecimal, or any custom base and compare the standard outputs together."
          />
        ) : null}

        {isInvalid ? (
          <CalculatorNotice tone="error" message={`That value does not match base ${fromBase}.`} />
        ) : null}

        {outputs ? (
          <>
            <CalculatorPrimaryResult
              label={`Base ${fromBase} -> Base ${customBase}`}
              value={outputs.custom}
              detail={`Decimal value: ${outputs.decimal}`}
            />

            <CalculatorSectionDivider label="Standard Bases" />
            <CalculatorStatGrid items={statItems} />
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
