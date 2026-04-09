'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
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
  convertUnit,
  formatNumber,
  getUnitCategoryConfig,
  safeNumber,
} from '@/lib/calculator-tool-utils';

const CATEGORY_OPTIONS = [
  ['length', 'Length'],
  ['mass', 'Mass'],
  ['temperature', 'Temperature'],
  ['speed', 'Speed'],
  ['area', 'Area'],
  ['volume', 'Volume'],
  ['time', 'Time'],
  ['energy', 'Energy'],
  ['data-storage', 'Data Storage'],
  ['pressure', 'Pressure'],
  ['power', 'Power'],
];

const DEFAULT_UNITS = {
  length: ['m', 'ft'],
  mass: ['kg', 'lb'],
  temperature: ['c', 'f'],
  speed: ['km/h', 'mph'],
  area: ['sqm', 'sqft'],
  volume: ['l', 'gal'],
  time: ['hr', 'min'],
  energy: ['kcal', 'kj'],
  'data-storage': ['MB', 'MiB'],
  pressure: ['bar', 'psi'],
  power: ['kw', 'hp'],
};

function formatConversionValue(value, decimals) {
  return formatNumber(value, { maximumFractionDigits: decimals });
}

export default function UnitConverter() {
  const [category, setCategory] = useState('length');
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState(DEFAULT_UNITS.length[0]);
  const [toUnit, setToUnit] = useState(DEFAULT_UNITS.length[1]);
  const [precision, setPrecision] = useState('4');

  const config = getUnitCategoryConfig(category);
  const decimals = Number.parseInt(precision, 10);
  const numericValue = safeNumber(value);

  const convertedValue =
    numericValue === null
      ? null
      : category === 'data-storage'
        ? convertStorage(value, fromUnit)?.[toUnit] ?? null
        : convertUnit(category, value, fromUnit, toUnit);

  const conversionItems =
    numericValue === null || !config
      ? []
      : Object.entries(config.units)
          .slice(0, 10)
          .map(([unitKey, unitConfig]) => {
            const unitValue =
              category === 'data-storage'
                ? convertStorage(value, fromUnit)?.[unitKey] ?? null
                : convertUnit(category, value, fromUnit, unitKey);

            return unitValue === null
              ? null
              : {
                  label: unitConfig.label,
                  value: formatConversionValue(unitValue, decimals),
                  detail: unitKey === fromUnit ? 'Input unit' : unitKey === toUnit ? 'Target unit' : unitKey,
                };
          })
          .filter(Boolean);

  const hasInput = value.trim().length > 0;
  const primaryFromLabel = config?.units[fromUnit]?.label || fromUnit;
  const primaryToLabel = config?.units[toUnit]?.label || toUnit;
  const copyValue =
    convertedValue === null
      ? ''
      : [
          `${formatConversionValue(numericValue, decimals)} ${primaryFromLabel} = ${formatConversionValue(convertedValue, decimals)} ${primaryToLabel}`,
          ...conversionItems.map((item) => `${item.label}: ${item.value}`),
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setCategory('length');
        setValue('');
        setFromUnit(DEFAULT_UNITS.length[0]);
        setToUnit(DEFAULT_UNITS.length[1]);
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
            {Object.entries(config?.units || {}).map(([unitKey, unitConfig]) => (
              <option key={unitKey} value={unitKey}>
                {unitConfig.label}
              </option>
            ))}
          </CalculatorSelect>

          <div className="options-label">To Unit</div>
          <CalculatorSelect
            value={toUnit}
            onChange={(event) => setToUnit(event.target.value)}
            style={{ marginBottom: 12 }}
          >
            {Object.entries(config?.units || {}).map(([unitKey, unitConfig]) => (
              <option key={unitKey} value={unitKey}>
                {unitConfig.label}
              </option>
            ))}
          </CalculatorSelect>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}
            onClick={() => {
              setFromUnit(toUnit);
              setToUnit(fromUnit);
            }}
          >
            <Icon icon={ICON_MAP.RefreshCw} size={14} />
            Swap Units
          </button>

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
          <CalculatorNotice message="Temperature uses offset formulas, while every other category converts through a shared base unit." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 14 }}>
          Categories
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {CATEGORY_OPTIONS.map(([valueKey, label]) => (
            <button
              key={valueKey}
              type="button"
              className={`mode-btn${category === valueKey ? ' active' : ''}`}
              onClick={() => {
                setCategory(valueKey);
                setFromUnit(DEFAULT_UNITS[valueKey][0]);
                setToUnit(DEFAULT_UNITS[valueKey][1]);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <CalculatorField label="Value">
            <CalculatorInput
              type="number"
              placeholder="Enter a measurement..."
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </CalculatorField>

          {!hasInput ? (
            <CalculatorEmptyState
              iconName="Ruler"
              title="Convert across 11 unit categories"
              message="Choose a category, enter a value, and compare it against the most common target units at the same time."
            />
          ) : null}

          {convertedValue === null && hasInput ? (
            <CalculatorNotice tone="error" message="Enter a valid numeric value to convert." />
          ) : null}

          {convertedValue !== null ? (
            <>
              <CalculatorPrimaryResult
                label={`${primaryFromLabel} -> ${primaryToLabel}`}
                value={formatConversionValue(convertedValue, decimals)}
                detail={`${formatConversionValue(numericValue, decimals)} ${primaryFromLabel}`}
              />

              <CalculatorSectionDivider label="Common Conversions" />
              <CalculatorStatGrid items={conversionItems} columns="repeat(3, minmax(0, 1fr))" />
            </>
          ) : null}
        </div>
      </OutputPanel>
    </CalculatorShell>
  );
}
