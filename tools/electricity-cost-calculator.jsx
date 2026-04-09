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

const RATE_PRESETS = [
  { label: 'US Avg', value: 0.16 },
  { label: 'EU Avg', value: 0.25 },
  { label: 'UK Avg', value: 0.34 },
];

export default function ElectricityCostCalculator() {
  const [watts, setWatts] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [rate, setRate] = useState('0.16');

  const numericWatts = safeNumber(watts);
  const numericHours = safeNumber(hoursPerDay);
  const numericRate = safeNumber(rate);
  const kwhPerDay =
    numericWatts !== null && numericHours !== null && numericRate !== null && numericWatts >= 0 && numericHours >= 0 && numericRate >= 0
      ? (numericWatts / 1000) * numericHours
      : null;
  const costs =
    kwhPerDay === null
      ? null
      : {
          daily: kwhPerDay * numericRate,
          monthly: kwhPerDay * numericRate * 30,
          yearly: kwhPerDay * numericRate * 365,
          yearlyKwh: kwhPerDay * 365,
        };
  const hasInput = Boolean(watts || hoursPerDay);
  const isInvalid = hasInput && costs === null;
  const copyValue =
    costs === null
      ? ''
      : [
          `kWh per day: ${formatNumber(kwhPerDay, { maximumFractionDigits: 2 })}`,
          `Daily cost: ${formatCurrency(costs.daily)}`,
          `Monthly cost: ${formatCurrency(costs.monthly)}`,
          `Yearly cost: ${formatCurrency(costs.yearly)}`,
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setWatts('');
        setHoursPerDay('');
        setRate('0.16');
      }}
      options={
        <>
          <div className="options-label">Rate Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {RATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`mode-btn${rate === String(preset.value) ? ' active' : ''}`}
                onClick={() => setRate(String(preset.value))}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="panel-divider" />
          <CalculatorNotice message="This estimate uses a simple daily usage model: watts / 1000 × hours per day × your price per kWh." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Appliance Usage
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <CalculatorField label="Wattage">
            <CalculatorInput
              type="number"
              placeholder="1500"
              value={watts}
              onChange={(event) => setWatts(event.target.value)}
            />
          </CalculatorField>

          <CalculatorField label="Hours Per Day">
            <CalculatorInput
              type="number"
              placeholder="4"
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(event.target.value)}
            />
          </CalculatorField>

          <CalculatorField label="Rate Per kWh">
            <CalculatorInput
              type="number"
              placeholder="0.16"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
          </CalculatorField>

          {!hasInput ? (
            <CalculatorEmptyState
              iconName="Zap"
              title="Estimate appliance electricity costs"
              message="Enter an appliance wattage, the number of hours you use it each day, and your electricity rate to project the running cost."
            />
          ) : null}

          {isInvalid ? (
            <CalculatorNotice tone="error" message="Enter non-negative wattage, usage hours, and electricity rate values." />
          ) : null}

          {costs ? (
            <>
              <CalculatorPrimaryResult
                label="Estimated Yearly Cost"
                value={formatCurrency(costs.yearly)}
                detail={`${formatNumber(costs.yearlyKwh, { maximumFractionDigits: 0 })} kWh per year`}
              />

              <CalculatorStatGrid
                items={[
                  {
                    label: 'Daily Cost',
                    value: formatCurrency(costs.daily),
                    detail: `${formatNumber(kwhPerDay, { maximumFractionDigits: 2 })} kWh/day`,
                  },
                  {
                    label: 'Monthly Cost',
                    value: formatCurrency(costs.monthly),
                    detail: '30-day estimate',
                  },
                ]}
              />

              <CalculatorSectionDivider label="Energy Usage" />
              <CalculatorStatGrid
                items={[
                  {
                    label: 'Daily Usage',
                    value: `${formatNumber(kwhPerDay, { maximumFractionDigits: 2 })} kWh`,
                    detail: 'Per day',
                  },
                  {
                    label: 'Yearly Usage',
                    value: `${formatNumber(costs.yearlyKwh, { maximumFractionDigits: 0 })} kWh`,
                    detail: '365-day estimate',
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
