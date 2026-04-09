'use client';

import { useState } from 'react';
import {
  CalculatorEmptyState,
  CalculatorField,
  CalculatorInput,
  CalculatorNotice,
  CalculatorSectionDivider,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import { formatNumber, safeNumber } from '@/lib/calculator-tool-utils';

const CARD_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};

function formatValue(value, precision) {
  return formatNumber(value, {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision === 0 ? 0 : 0,
  });
}

function ResultCard({ title, description, children, result, detail, error }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
        {description}
      </div>
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
      {result ? (
        <div
          style={{
            marginTop: 16,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 4,
            }}
          >
            Result
          </div>
          <div style={{ fontSize: 24, color: 'var(--text)' }}>{result}</div>
          {detail ? (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              {detail}
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <div style={{ marginTop: 16 }}>
          <CalculatorNotice tone="error" message={error} />
        </div>
      ) : null}
    </div>
  );
}

export default function PercentageCalculator() {
  const [whatPercent, setWhatPercent] = useState('');
  const [whatBase, setWhatBase] = useState('');
  const [percentValue, setPercentValue] = useState('');
  const [percentWhole, setPercentWhole] = useState('');
  const [changeFrom, setChangeFrom] = useState('');
  const [changeTo, setChangeTo] = useState('');
  const [adjustBase, setAdjustBase] = useState('');
  const [adjustPercent, setAdjustPercent] = useState('');
  const [adjustMode, setAdjustMode] = useState('increase');
  const [precision, setPrecision] = useState('2');

  const decimals = Number.parseInt(precision, 10);

  const percentNumeric = safeNumber(whatPercent);
  const baseNumeric = safeNumber(whatBase);
  const modeOneValue =
    percentNumeric !== null && baseNumeric !== null
      ? (percentNumeric / 100) * baseNumeric
      : null;

  const partNumeric = safeNumber(percentValue);
  const wholeNumeric = safeNumber(percentWhole);
  const modeTwoValue =
    partNumeric !== null && wholeNumeric !== null && wholeNumeric !== 0
      ? (partNumeric / wholeNumeric) * 100
      : null;
  const modeTwoError =
    partNumeric !== null && wholeNumeric === 0 ? 'The whole value cannot be zero.' : null;

  const changeFromNumeric = safeNumber(changeFrom);
  const changeToNumeric = safeNumber(changeTo);
  const modeThreeValue =
    changeFromNumeric !== null && changeToNumeric !== null && changeFromNumeric !== 0
      ? ((changeToNumeric - changeFromNumeric) / changeFromNumeric) * 100
      : null;
  const modeThreeError =
    changeFromNumeric !== null && changeToNumeric !== null && changeFromNumeric === 0
      ? 'A percentage change cannot start from zero.'
      : null;

  const adjustBaseNumeric = safeNumber(adjustBase);
  const adjustPercentNumeric = safeNumber(adjustPercent);
  const modeFourValue =
    adjustBaseNumeric !== null && adjustPercentNumeric !== null
      ? adjustBaseNumeric * (1 + (adjustMode === 'increase' ? 1 : -1) * (adjustPercentNumeric / 100))
      : null;
  const modeFourDelta =
    adjustBaseNumeric !== null && adjustPercentNumeric !== null
      ? adjustBaseNumeric * (adjustPercentNumeric / 100)
      : null;

  const hasInput = [
    whatPercent,
    whatBase,
    percentValue,
    percentWhole,
    changeFrom,
    changeTo,
    adjustBase,
    adjustPercent,
  ].some((value) => value.trim());

  const summaryItems = [
    modeOneValue !== null
      ? {
          label: 'X% of Y',
          value: formatValue(modeOneValue, decimals),
          detail: `${formatValue(percentNumeric, decimals)}% of ${formatValue(baseNumeric, decimals)}`,
        }
      : null,
    modeTwoValue !== null
      ? {
          label: 'X Is What % of Y',
          value: `${formatValue(modeTwoValue, decimals)}%`,
          detail: `${formatValue(partNumeric, decimals)} out of ${formatValue(wholeNumeric, decimals)}`,
        }
      : null,
    modeThreeValue !== null
      ? {
          label: 'Percent Change',
          value: `${modeThreeValue > 0 ? '+' : ''}${formatValue(modeThreeValue, decimals)}%`,
          detail:
            changeFromNumeric !== null && changeToNumeric !== null
              ? `${formatValue(changeFromNumeric, decimals)} -> ${formatValue(changeToNumeric, decimals)}`
              : null,
        }
      : null,
    modeFourValue !== null
      ? {
          label: adjustMode === 'increase' ? 'Increased Value' : 'Decreased Value',
          value: formatValue(modeFourValue, decimals),
          detail:
            modeFourDelta !== null
              ? `${adjustMode === 'increase' ? '+' : '-'}${formatValue(modeFourDelta, decimals)} change`
              : null,
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
        setWhatPercent('');
        setWhatBase('');
        setPercentValue('');
        setPercentWhole('');
        setChangeFrom('');
        setChangeTo('');
        setAdjustBase('');
        setAdjustPercent('');
        setAdjustMode('increase');
        setPrecision('2');
      }}
      options={
        <>
          <div className="options-label">Adjust Direction</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`mode-btn${adjustMode === 'increase' ? ' active' : ''}`}
              onClick={() => setAdjustMode('increase')}
            >
              Increase
            </button>
            <button
              type="button"
              className={`mode-btn${adjustMode === 'decrease' ? ' active' : ''}`}
              onClick={() => setAdjustMode('decrease')}
            >
              Decrease
            </button>
          </div>

          <div className="options-label">Precision</div>
          <select
            className="textarea"
            value={precision}
            onChange={(event) => setPrecision(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          >
            <option value="0">Whole numbers</option>
            <option value="2">2 decimal places</option>
            <option value="4">4 decimal places</option>
          </select>

          <div className="panel-divider" />
          <CalculatorNotice message="All four formulas update independently, so you can work through several percentage questions at once." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Percentage Workbench
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <ResultCard
            title="What is X% of Y?"
            description="Find the direct percentage amount."
            result={modeOneValue !== null ? formatValue(modeOneValue, decimals) : null}
            detail={
              modeOneValue !== null
                ? `${formatValue(percentNumeric, decimals)}% of ${formatValue(baseNumeric, decimals)}`
                : null
            }
          >
            <CalculatorField label="Percent (X)">
              <CalculatorInput
                type="number"
                placeholder="15"
                value={whatPercent}
                onChange={(event) => setWhatPercent(event.target.value)}
              />
            </CalculatorField>
            <CalculatorField label="Base Value (Y)">
              <CalculatorInput
                type="number"
                placeholder="240"
                value={whatBase}
                onChange={(event) => setWhatBase(event.target.value)}
              />
            </CalculatorField>
          </ResultCard>

          <ResultCard
            title="X is what % of Y?"
            description="Turn a part and a whole into a percentage."
            result={modeTwoValue !== null ? `${formatValue(modeTwoValue, decimals)}%` : null}
            detail={
              modeTwoValue !== null
                ? `${formatValue(partNumeric, decimals)} is ${formatValue(modeTwoValue, decimals)}% of ${formatValue(wholeNumeric, decimals)}`
                : null
            }
            error={modeTwoError}
          >
            <CalculatorField label="Part (X)">
              <CalculatorInput
                type="number"
                placeholder="30"
                value={percentValue}
                onChange={(event) => setPercentValue(event.target.value)}
              />
            </CalculatorField>
            <CalculatorField label="Whole (Y)">
              <CalculatorInput
                type="number"
                placeholder="120"
                value={percentWhole}
                onChange={(event) => setPercentWhole(event.target.value)}
              />
            </CalculatorField>
          </ResultCard>

          <ResultCard
            title="% Change from X to Y"
            description="See the percentage gain or loss between two values."
            result={
              modeThreeValue !== null
                ? `${modeThreeValue > 0 ? '+' : ''}${formatValue(modeThreeValue, decimals)}%`
                : null
            }
            detail={
              modeThreeValue !== null
                ? `${formatValue(changeFromNumeric, decimals)} -> ${formatValue(changeToNumeric, decimals)}`
                : null
            }
            error={modeThreeError}
          >
            <CalculatorField label="Starting Value (X)">
              <CalculatorInput
                type="number"
                placeholder="80"
                value={changeFrom}
                onChange={(event) => setChangeFrom(event.target.value)}
              />
            </CalculatorField>
            <CalculatorField label="Ending Value (Y)">
              <CalculatorInput
                type="number"
                placeholder="104"
                value={changeTo}
                onChange={(event) => setChangeTo(event.target.value)}
              />
            </CalculatorField>
          </ResultCard>

          <ResultCard
            title={`${adjustMode === 'increase' ? 'Increase' : 'Decrease'} X by Y%`}
            description="Apply a percentage adjustment to a starting number."
            result={modeFourValue !== null ? formatValue(modeFourValue, decimals) : null}
            detail={
              modeFourDelta !== null
                ? `${adjustMode === 'increase' ? '+' : '-'}${formatValue(modeFourDelta, decimals)} from ${formatValue(adjustBaseNumeric, decimals)}`
                : null
            }
          >
            <CalculatorField label="Starting Value (X)">
              <CalculatorInput
                type="number"
                placeholder="500"
                value={adjustBase}
                onChange={(event) => setAdjustBase(event.target.value)}
              />
            </CalculatorField>
            <CalculatorField label="Adjustment Percent (Y)">
              <CalculatorInput
                type="number"
                placeholder="12"
                value={adjustPercent}
                onChange={(event) => setAdjustPercent(event.target.value)}
              />
            </CalculatorField>
          </ResultCard>
        </div>

        {!hasInput ? (
          <CalculatorEmptyState
            iconName="Percent"
            title="Solve every common percentage problem in one place"
            message="Enter any of the percentage formulas above to calculate direct percentages, percentage shares, changes, or adjusted values."
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
