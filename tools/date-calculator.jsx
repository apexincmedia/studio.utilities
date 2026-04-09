'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
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
import { addToDate, diffBetweenDates, formatNumber, safeNumber } from '@/lib/calculator-tool-utils';

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DateCalculator() {
  const [mode, setMode] = useState('offset');
  const [baseDate, setBaseDate] = useState('');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const [days, setDays] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const offsetResult =
    mode === 'offset' && baseDate
      ? addToDate(baseDate, {
          years: safeNumber(years) ?? 0,
          months: safeNumber(months) ?? 0,
          days: safeNumber(days) ?? 0,
        })
      : null;

  const diffResult = mode === 'difference' && startDate && endDate ? diffBetweenDates(startDate, endDate) : null;
  const offsetInvalid = mode === 'offset' && baseDate && !offsetResult;
  const diffInvalid = mode === 'difference' && startDate && endDate && !diffResult;

  const copyValue =
    mode === 'offset' && offsetResult
      ? [
          `Result: ${formatLongDate(offsetResult)}`,
          `ISO Date: ${offsetResult.toISOString().slice(0, 10)}`,
          `Offsets: ${safeNumber(years) ?? 0} years, ${safeNumber(months) ?? 0} months, ${safeNumber(days) ?? 0} days`,
        ].join('\n')
      : diffResult
        ? [
            `Difference in days: ${formatNumber(diffResult.days, { maximumFractionDigits: 0 })}`,
            `Difference in weeks: ${formatNumber(diffResult.weeks, { maximumFractionDigits: 2 })}`,
            `Difference in months: ${formatNumber(diffResult.months, { maximumFractionDigits: 2 })}`,
            `Difference in years: ${formatNumber(diffResult.years, { maximumFractionDigits: 2 })}`,
          ].join('\n')
        : '';

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setMode('offset');
        setBaseDate('');
        setYears('');
        setMonths('');
        setDays('');
        setStartDate('');
        setEndDate('');
      }}
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`mode-btn${mode === 'offset' ? ' active' : ''}`}
              onClick={() => setMode('offset')}
            >
              Add / Subtract
            </button>
            <button
              type="button"
              className={`mode-btn${mode === 'difference' ? ' active' : ''}`}
              onClick={() => setMode('difference')}
            >
              Difference
            </button>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              if (mode === 'offset') {
                setBaseDate(getTodayValue());
              } else {
                setStartDate(getTodayValue());
                setEndDate(getTodayValue());
              }
            }}
            className="tool-button"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
          >
            Use Today
          </Button>

          <div className="panel-divider" />
          <CalculatorNotice message="Use positive or negative offsets to move through time, or switch modes to compare two dates directly." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          {mode === 'offset' ? 'Date Offset' : 'Date Difference'}
        </div>

        {mode === 'offset' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <CalculatorField label="Base Date">
              <input
                type="date"
                className="textarea"
                value={baseDate}
                onChange={(event) => setBaseDate(event.target.value)}
                style={{ minHeight: 'auto', padding: '12px 14px' }}
              />
            </CalculatorField>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <CalculatorField label="Years">
                <CalculatorInput
                  type="number"
                  placeholder="0"
                  value={years}
                  onChange={(event) => setYears(event.target.value)}
                />
              </CalculatorField>
              <CalculatorField label="Months">
                <CalculatorInput
                  type="number"
                  placeholder="0"
                  value={months}
                  onChange={(event) => setMonths(event.target.value)}
                />
              </CalculatorField>
              <CalculatorField label="Days">
                <CalculatorInput
                  type="number"
                  placeholder="0"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                />
              </CalculatorField>
            </div>

            {!baseDate ? (
              <CalculatorEmptyState
                iconName="Calendar"
                title="Move forward or backward from any date"
                message="Choose a starting date, then add or subtract years, months, and days to get the exact result in multiple formats."
              />
            ) : null}

            {offsetInvalid ? (
              <CalculatorNotice tone="error" message="That date could not be calculated." />
            ) : null}

            {offsetResult ? (
              <>
                <CalculatorPrimaryResult
                  label="Calculated Date"
                  value={formatLongDate(offsetResult)}
                  detail={`ISO: ${offsetResult.toISOString().slice(0, 10)}`}
                />
                <CalculatorStatGrid
                  items={[
                    {
                      label: 'Weekday',
                      value: offsetResult.toLocaleDateString(undefined, { weekday: 'long' }),
                      detail: 'Resulting day',
                    },
                    {
                      label: 'Month',
                      value: offsetResult.toLocaleDateString(undefined, { month: 'long' }),
                      detail: 'Calendar month',
                    },
                  ]}
                />
              </>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <CalculatorField label="Start Date">
              <input
                type="date"
                className="textarea"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                style={{ minHeight: 'auto', padding: '12px 14px' }}
              />
            </CalculatorField>
            <CalculatorField label="End Date">
              <input
                type="date"
                className="textarea"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                style={{ minHeight: 'auto', padding: '12px 14px' }}
              />
            </CalculatorField>

            {!startDate || !endDate ? (
              <CalculatorEmptyState
                iconName="Calendar"
                title="Measure the span between two dates"
                message="Choose a start and end date to compare the difference in days, weeks, months, and years."
              />
            ) : null}

            {diffInvalid ? (
              <CalculatorNotice tone="error" message="Both dates must be valid to compare them." />
            ) : null}

            {diffResult ? (
              <>
                <CalculatorPrimaryResult
                  label="Difference in Days"
                  value={formatNumber(diffResult.days, { maximumFractionDigits: 0 })}
                  detail={diffResult.days >= 0 ? 'End date is after start date' : 'End date is before start date'}
                />
                <CalculatorSectionDivider label="Breakdown" />
                <CalculatorStatGrid
                  items={[
                    {
                      label: 'Weeks',
                      value: formatNumber(diffResult.weeks, { maximumFractionDigits: 2 }),
                      detail: 'Days divided by 7',
                    },
                    {
                      label: 'Months',
                      value: formatNumber(diffResult.months, { maximumFractionDigits: 2 }),
                      detail: 'Average month length',
                    },
                    {
                      label: 'Years',
                      value: formatNumber(diffResult.years, { maximumFractionDigits: 2 }),
                      detail: '365.25-day years',
                    },
                  ]}
                />
              </>
            ) : null}
          </div>
        )}
      </OutputPanel>
    </CalculatorShell>
  );
}
