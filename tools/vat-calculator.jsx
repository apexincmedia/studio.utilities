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
import { formatCurrency, formatNumber, safeNumber } from '@/lib/calculator-tool-utils';

const RATE_PRESETS = [5, 10, 20, 21];

export default function VatCalculator() {
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('20');

  const numericAmount = safeNumber(amount);
  const numericRate = safeNumber(rate);
  const result =
    numericAmount !== null && numericRate !== null && numericAmount >= 0 && numericRate >= 0
      ? mode === 'add'
        ? {
            net: numericAmount,
            vat: numericAmount * (numericRate / 100),
            gross: numericAmount * (1 + numericRate / 100),
          }
        : {
            gross: numericAmount,
            net: numericAmount / (1 + numericRate / 100),
            vat: numericAmount - numericAmount / (1 + numericRate / 100),
          }
      : null;
  const hasInput = Boolean(amount);
  const isInvalid = hasInput && result === null;
  const copyValue =
    result === null
      ? ''
      : [
          `Net: ${formatCurrency(result.net)}`,
          `VAT: ${formatCurrency(result.vat)} (${formatNumber(numericRate, { maximumFractionDigits: 0 })}%)`,
          `Gross: ${formatCurrency(result.gross)}`,
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setMode('add');
        setAmount('');
        setRate('20');
      }}
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`mode-btn${mode === 'add' ? ' active' : ''}`}
              onClick={() => setMode('add')}
            >
              Add VAT
            </button>
            <button
              type="button"
              className={`mode-btn${mode === 'remove' ? ' active' : ''}`}
              onClick={() => setMode('remove')}
            >
              Remove VAT
            </button>
          </div>

          <div className="options-label">Rate Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {RATE_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${rate === String(value) ? ' active' : ''}`}
                onClick={() => setRate(String(value))}
              >
                {value}%
              </button>
            ))}
          </div>

          <div className="panel-divider" />
          <CalculatorNotice message="Switch modes to either add VAT onto a net amount or back VAT out of a gross amount." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          VAT Input
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <CalculatorField label={mode === 'add' ? 'Net Amount' : 'Gross Amount'}>
            <CalculatorInput
              type="number"
              placeholder="100"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </CalculatorField>

          <CalculatorField label="VAT Rate (%)">
            <CalculatorInput
              type="number"
              placeholder="20"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
          </CalculatorField>

          {!hasInput ? (
            <CalculatorEmptyState
              iconName="Percent"
              title="Add or remove VAT from any price"
              message="Enter a net or gross amount, choose the VAT rate, and see the tax component broken out clearly."
            />
          ) : null}

          {isInvalid ? (
            <CalculatorNotice tone="error" message="Enter a non-negative amount and VAT rate to calculate tax." />
          ) : null}

          {result ? (
            <>
              <CalculatorPrimaryResult
                label={mode === 'add' ? 'Gross Amount' : 'Net Amount'}
                value={mode === 'add' ? formatCurrency(result.gross) : formatCurrency(result.net)}
                detail={`${formatNumber(numericRate, { maximumFractionDigits: 0 })}% VAT`}
              />

              <CalculatorSectionDivider label="Tax Breakdown" />
              <CalculatorStatGrid
                items={[
                  {
                    label: 'Net',
                    value: formatCurrency(result.net),
                    detail: 'Before VAT',
                  },
                  {
                    label: 'VAT Amount',
                    value: formatCurrency(result.vat),
                    detail: 'Tax component',
                  },
                  {
                    label: 'Gross',
                    value: formatCurrency(result.gross),
                    detail: 'After VAT',
                  },
                ]}
                columns="repeat(3, minmax(0, 1fr))"
              />
            </>
          ) : null}
        </div>
      </OutputPanel>
    </CalculatorShell>
  );
}
