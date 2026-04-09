'use client';

import { useState } from 'react';
import {
  CalculatorEmptyState,
  CalculatorField,
  CalculatorInput,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorSelect,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import {
  convertStorage,
  DATA_STORAGE_UNITS,
  formatNumber,
  safeNumber,
} from '@/lib/calculator-tool-utils';

const SI_UNITS = ['bit', 'byte', 'KB', 'MB', 'GB', 'TB', 'PB'];
const BINARY_UNITS = ['KiB', 'MiB', 'GiB', 'TiB'];

export default function DataStorageConverter() {
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState('MB');
  const [toUnit, setToUnit] = useState('MiB');
  const [precision, setPrecision] = useState('4');

  const numericValue = safeNumber(value);
  const decimals = Number.parseInt(precision, 10);
  const conversions = numericValue === null ? null : convertStorage(value, fromUnit);
  const primaryValue = conversions?.[toUnit] ?? null;

  const createItems = (units) =>
    units
      .map((unitKey) => ({
        label: unitKey,
        value:
          conversions && conversions[unitKey] !== undefined
            ? formatNumber(conversions[unitKey], { maximumFractionDigits: decimals })
            : '-',
        detail: DATA_STORAGE_UNITS[unitKey].label,
      }))
      .filter(Boolean);

  const copyValue =
    !conversions
      ? ''
      : [
          `${formatNumber(numericValue, { maximumFractionDigits: decimals })} ${fromUnit} = ${formatNumber(primaryValue, { maximumFractionDigits: decimals })} ${toUnit}`,
          '',
          'SI Units',
          ...createItems(SI_UNITS).map((item) => `${item.label}: ${item.value}`),
          '',
          'Binary Units',
          ...createItems(BINARY_UNITS).map((item) => `${item.label}: ${item.value}`),
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setValue('');
        setFromUnit('MB');
        setToUnit('MiB');
        setPrecision('4');
      }}
      options={
        <>
          <div className="options-label">From Unit</div>
          <CalculatorSelect
            value={fromUnit}
            onChange={(event) => setFromUnit(event.target.value)}
            style={{ marginBottom: 16 }}
          >
            {Object.keys(DATA_STORAGE_UNITS).map((unitKey) => (
              <option key={unitKey} value={unitKey}>
                {DATA_STORAGE_UNITS[unitKey].label}
              </option>
            ))}
          </CalculatorSelect>

          <div className="options-label">Primary Output Unit</div>
          <CalculatorSelect
            value={toUnit}
            onChange={(event) => setToUnit(event.target.value)}
            style={{ marginBottom: 16 }}
          >
            {Object.keys(DATA_STORAGE_UNITS).map((unitKey) => (
              <option key={unitKey} value={unitKey}>
                {DATA_STORAGE_UNITS[unitKey].label}
              </option>
            ))}
          </CalculatorSelect>

          <div className="options-label">Decimals</div>
          <CalculatorSelect
            value={precision}
            onChange={(event) => setPrecision(event.target.value)}
            style={{ marginBottom: 20 }}
          >
            <option value="2">2 decimal places</option>
            <option value="4">4 decimal places</option>
            <option value="6">6 decimal places</option>
          </CalculatorSelect>

          <div className="panel-divider" />
          <CalculatorNotice message="This converter shows SI units based on 1000 and binary units based on 1024 side by side." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Data Size Input
        </div>

        <CalculatorField label="Value">
          <CalculatorInput
            type="number"
            placeholder="1024"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </CalculatorField>

        {!value.trim() ? (
          <CalculatorEmptyState
            iconName="Database"
            title="Compare storage units instantly"
            message="Enter any storage amount to see both decimal and binary conversions, including bits, bytes, KB, KiB, GB, and GiB."
          />
        ) : null}

        {value.trim() && !conversions ? (
          <CalculatorNotice tone="error" message="Enter a valid numeric data size to convert." />
        ) : null}

        {conversions ? (
          <>
            <CalculatorPrimaryResult
              label={`${fromUnit} -> ${toUnit}`}
              value={formatNumber(primaryValue, { maximumFractionDigits: decimals })}
              detail={`${formatNumber(numericValue, { maximumFractionDigits: decimals })} ${fromUnit}`}
            />

            <CalculatorSectionDivider label="SI Units" />
            <CalculatorStatGrid items={createItems(SI_UNITS)} />

            <CalculatorSectionDivider label="Binary Units" />
            <CalculatorStatGrid items={createItems(BINARY_UNITS)} />
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
