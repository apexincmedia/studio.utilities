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

const QUICK_TIPS = [10, 15, 18, 20, 25];

export default function TipCalculator() {
  const [billTotal, setBillTotal] = useState('');
  const [tipPercent, setTipPercent] = useState('18');
  const [people, setPeople] = useState('1');
  const [roundUp, setRoundUp] = useState(false);

  const numericBill = safeNumber(billTotal);
  const numericTip = safeNumber(tipPercent);
  const numericPeople = safeNumber(people);
  const baseTipAmount =
    numericBill !== null && numericTip !== null && numericPeople !== null && numericBill >= 0 && numericTip >= 0 && numericPeople > 0
      ? (numericBill * numericTip) / 100
      : null;
  const adjustedTotal =
    baseTipAmount !== null
      ? roundUp
        ? Math.ceil(numericBill + baseTipAmount)
        : numericBill + baseTipAmount
      : null;
  const adjustedTip = adjustedTotal !== null ? adjustedTotal - numericBill : null;
  const perPerson = adjustedTotal !== null && numericPeople ? adjustedTotal / numericPeople : null;
  const hasInput = Boolean(billTotal);
  const isInvalid = hasInput && adjustedTotal === null;
  const copyValue =
    adjustedTotal === null || adjustedTip === null || perPerson === null
      ? ''
      : [
          `Bill total: ${formatCurrency(numericBill)}`,
          `Tip: ${formatCurrency(adjustedTip)} (${formatNumber(numericTip, { maximumFractionDigits: 0 })}%)`,
          `Grand total: ${formatCurrency(adjustedTotal)}`,
          `Per person: ${formatCurrency(perPerson)}`,
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setBillTotal('');
        setTipPercent('18');
        setPeople('1');
        setRoundUp(false);
      }}
      options={
        <>
          <div className="options-label">Quick Tip Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {QUICK_TIPS.map((value) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${tipPercent === String(value) ? ' active' : ''}`}
                onClick={() => setTipPercent(String(value))}
              >
                {value}%
              </button>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input type="checkbox" checked={roundUp} onChange={(event) => setRoundUp(event.target.checked)} />
            <span className="checkbox-label">Round total up to the next whole dollar</span>
          </label>

          <div className="panel-divider" />
          <CalculatorNotice message="Set the bill, tip percentage, and party size to see the total tip and the per-person split." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Bill Details
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <CalculatorField label="Bill Total">
            <CalculatorInput
              type="number"
              placeholder="84.50"
              value={billTotal}
              onChange={(event) => setBillTotal(event.target.value)}
            />
          </CalculatorField>

          <CalculatorField label="Tip Percentage">
            <CalculatorInput
              type="number"
              placeholder="18"
              value={tipPercent}
              onChange={(event) => setTipPercent(event.target.value)}
            />
          </CalculatorField>

          <CalculatorField label="Number of People">
            <CalculatorInput
              type="number"
              placeholder="1"
              value={people}
              onChange={(event) => setPeople(event.target.value)}
            />
          </CalculatorField>

          {!hasInput ? (
            <CalculatorEmptyState
              iconName="Percent"
              title="Split restaurant tips in seconds"
              message="Enter the bill amount, choose a tip percentage, and divide the final total across your group."
            />
          ) : null}

          {isInvalid ? (
            <CalculatorNotice tone="error" message="Enter a bill total, a valid tip percentage, and at least one person." />
          ) : null}

          {adjustedTotal !== null && adjustedTip !== null && perPerson !== null ? (
            <>
              <CalculatorPrimaryResult
                label="Grand Total"
                value={formatCurrency(adjustedTotal)}
                detail={roundUp ? 'Rounded up to the next whole dollar' : 'Exact total including tip'}
              />

              <CalculatorStatGrid
                items={[
                  {
                    label: 'Tip Amount',
                    value: formatCurrency(adjustedTip),
                    detail: `${formatNumber(numericTip, { maximumFractionDigits: 0 })}% of the bill`,
                  },
                  {
                    label: 'Per Person',
                    value: formatCurrency(perPerson),
                    detail: `${formatNumber(numericPeople, { maximumFractionDigits: 0 })} people`,
                  },
                ]}
              />

              <CalculatorSectionDivider label="Split Summary" />
              <CalculatorStatGrid
                items={[
                  {
                    label: 'Tip Per Person',
                    value: formatCurrency(adjustedTip / numericPeople),
                    detail: 'Tip only split',
                  },
                  {
                    label: 'Bill Before Tip',
                    value: formatCurrency(numericBill),
                    detail: 'Subtotal',
                  },
                ]}
              />
            </>
          ) : null}
        </div>
      </OutputPanel>
    </CalculatorShell>
  );
}
