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
import { formatNumber, safeNumber } from '@/lib/calculator-tool-utils';

function getBmiCategory(value) {
  if (value < 18.5) return { label: 'Underweight', tone: 'warning' };
  if (value < 25) return { label: 'Normal', tone: 'success' };
  if (value < 30) return { label: 'Overweight', tone: 'warning' };
  return { label: 'Obese', tone: 'error' };
}

function toMetric(unit, weightValue, heightValue) {
  if (unit === 'imperial') {
    return {
      weightKg: weightValue * 0.45359237,
      heightM: heightValue * 0.0254,
    };
  }

  return {
    weightKg: weightValue,
    heightM: heightValue / 100,
  };
}

function formatHealthyWeight(minKg, maxKg, unit) {
  if (unit === 'imperial') {
    return `${formatNumber(minKg / 0.45359237, { maximumFractionDigits: 1 })} - ${formatNumber(maxKg / 0.45359237, { maximumFractionDigits: 1 })} lb`;
  }

  return `${formatNumber(minKg, { maximumFractionDigits: 1 })} - ${formatNumber(maxKg, { maximumFractionDigits: 1 })} kg`;
}

export default function BmiCalculator() {
  const [unit, setUnit] = useState('metric');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('not-specified');

  const numericWeight = safeNumber(weight);
  const numericHeight = safeNumber(height);
  const metricValues =
    numericWeight !== null && numericHeight !== null && numericWeight > 0 && numericHeight > 0
      ? toMetric(unit, numericWeight, numericHeight)
      : null;
  const bmi =
    metricValues && metricValues.heightM > 0
      ? metricValues.weightKg / (metricValues.heightM * metricValues.heightM)
      : null;
  const category = bmi !== null ? getBmiCategory(bmi) : null;
  const healthyMinKg = metricValues ? 18.5 * metricValues.heightM * metricValues.heightM : null;
  const healthyMaxKg = metricValues ? 24.9 * metricValues.heightM * metricValues.heightM : null;
  const hasInput = Boolean(weight || height);
  const isInvalid = hasInput && bmi === null;
  const gaugePosition = bmi === null ? 0 : Math.max(0, Math.min(100, (bmi / 40) * 100));
  const copyValue =
    bmi === null || !category || healthyMinKg === null || healthyMaxKg === null
      ? ''
      : [
          `BMI: ${formatNumber(bmi, { maximumFractionDigits: 1 })}`,
          `Category: ${category.label}`,
          `Healthy weight range: ${formatHealthyWeight(healthyMinKg, healthyMaxKg, unit)}`,
          age ? `Age: ${age}` : null,
          sex !== 'not-specified' ? `Sex: ${sex}` : null,
        ]
          .filter(Boolean)
          .join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setUnit('metric');
        setWeight('');
        setHeight('');
        setAge('');
        setSex('not-specified');
      }}
      options={
        <>
          <div className="options-label">Units</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
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

          <div className="options-label">Age (Optional)</div>
          <CalculatorInput
            type="number"
            placeholder="32"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Sex (Optional)</div>
          <CalculatorSelect
            value={sex}
            onChange={(event) => setSex(event.target.value)}
            style={{ marginBottom: 20 }}
          >
            <option value="not-specified">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </CalculatorSelect>

          <div className="panel-divider" />
          <CalculatorNotice message="BMI is a screening metric, not a diagnosis. Use it as a quick estimate alongside real clinical context." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Measurements
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <CalculatorField label={unit === 'metric' ? 'Weight (kg)' : 'Weight (lb)'}>
            <CalculatorInput
              type="number"
              placeholder={unit === 'metric' ? '72' : '160'}
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </CalculatorField>

          <CalculatorField label={unit === 'metric' ? 'Height (cm)' : 'Height (in)'}>
            <CalculatorInput
              type="number"
              placeholder={unit === 'metric' ? '178' : '70'}
              value={height}
              onChange={(event) => setHeight(event.target.value)}
            />
          </CalculatorField>

          {!hasInput ? (
            <CalculatorEmptyState
              iconName="Weight"
              title="Check BMI with metric or imperial units"
              message="Enter your weight and height to calculate Body Mass Index, see your category, and compare against the healthy weight range for your height."
            />
          ) : null}

          {isInvalid ? (
            <CalculatorNotice tone="error" message="Enter positive height and weight values to calculate BMI." />
          ) : null}

          {bmi !== null && category && healthyMinKg !== null && healthyMaxKg !== null ? (
            <>
              <CalculatorPrimaryResult
                label="Body Mass Index"
                value={formatNumber(bmi, { maximumFractionDigits: 1 })}
                detail={category.label}
              />

              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 16px',
                }}
              >
                <div className="panel-label" style={{ marginBottom: 12 }}>
                  BMI Gauge
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: '18.5fr 6.5fr 5fr 10fr',
                    marginBottom: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ background: 'var(--warning-bg)' }} />
                  <div style={{ background: 'var(--success-bg)' }} />
                  <div style={{ background: 'var(--warning-bg)' }} />
                  <div style={{ background: 'var(--error-bg)' }} />
                </div>
                <div style={{ position: 'relative', height: 18 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${gaugePosition}% - 8px)`,
                      top: 0,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'var(--text)',
                      border: '2px solid var(--bg)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>
              </div>

              <CalculatorSectionDivider label="Health Range" />
              <CalculatorStatGrid
                items={[
                  {
                    label: 'Category',
                    value: category.label,
                    detail: age ? `Age ${age}` : sex !== 'not-specified' ? sex : 'General screening',
                    tone: category.tone === 'success' ? 'success' : category.tone === 'warning' ? 'warning' : undefined,
                  },
                  {
                    label: 'Healthy Weight Range',
                    value: formatHealthyWeight(healthyMinKg, healthyMaxKg, unit),
                    detail: 'Based on BMI 18.5 - 24.9',
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
