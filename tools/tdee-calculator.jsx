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

const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary', multiplier: 1.2 },
  light: { label: 'Lightly active', multiplier: 1.375 },
  moderate: { label: 'Moderately active', multiplier: 1.55 },
  very: { label: 'Very active', multiplier: 1.725 },
  athlete: { label: 'Athlete / extra active', multiplier: 1.9 },
};

function toMetric(unit, weightValue, heightValue) {
  if (unit === 'imperial') {
    return {
      weightKg: weightValue * 0.45359237,
      heightCm: heightValue * 2.54,
    };
  }

  return {
    weightKg: weightValue,
    heightCm: heightValue,
  };
}

function getMacroSplit(calories) {
  return {
    protein: Math.round((calories * 0.3) / 4),
    carbs: Math.round((calories * 0.4) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

export default function TdeeCalculator() {
  const [unit, setUnit] = useState('metric');
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('moderate');

  const numericAge = safeNumber(age);
  const numericWeight = safeNumber(weight);
  const numericHeight = safeNumber(height);
  const metricValues =
    numericAge !== null &&
    numericWeight !== null &&
    numericHeight !== null &&
    numericAge > 0 &&
    numericWeight > 0 &&
    numericHeight > 0
      ? toMetric(unit, numericWeight, numericHeight)
      : null;

  const bmr =
    metricValues && numericAge !== null
      ? 10 * metricValues.weightKg + 6.25 * metricValues.heightCm - 5 * numericAge + (sex === 'male' ? 5 : -161)
      : null;
  const tdee = bmr !== null ? bmr * ACTIVITY_LEVELS[activity].multiplier : null;
  const hasInput = Boolean(age || weight || height);
  const isInvalid = hasInput && tdee === null;

  const goals =
    tdee === null
      ? null
      : {
          cutting: Math.max(1200, tdee - 500),
          maintenance: tdee,
          bulking: tdee + 500,
        };

  const copyValue =
    tdee === null || goals === null
      ? ''
      : [
          `BMR: ${formatNumber(bmr, { maximumFractionDigits: 0 })} kcal/day`,
          `TDEE: ${formatNumber(tdee, { maximumFractionDigits: 0 })} kcal/day`,
          ...Object.entries(goals).map(([key, calories]) => {
            const macros = getMacroSplit(calories);
            return `${key}: ${formatNumber(calories, { maximumFractionDigits: 0 })} kcal (P ${macros.protein}g / C ${macros.carbs}g / F ${macros.fat}g)`;
          }),
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setUnit('metric');
        setSex('male');
        setAge('');
        setWeight('');
        setHeight('');
        setActivity('moderate');
      }}
      options={
        <>
          <div className="options-label">Units</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
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

          <div className="options-label">Sex</div>
          <CalculatorSelect
            value={sex}
            onChange={(event) => setSex(event.target.value)}
            style={{ marginBottom: 16 }}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </CalculatorSelect>

          <div className="options-label">Activity Level</div>
          <CalculatorSelect
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            style={{ marginBottom: 20 }}
          >
            {Object.entries(ACTIVITY_LEVELS).map(([key, level]) => (
              <option key={key} value={key}>
                {level.label}
              </option>
            ))}
          </CalculatorSelect>

          <div className="panel-divider" />
          <CalculatorNotice message="TDEE is estimated from the Mifflin-St Jeor BMR formula and your chosen activity multiplier." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Body Metrics
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <CalculatorField label="Age">
            <CalculatorInput
              type="number"
              placeholder="32"
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
          </CalculatorField>

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
              iconName="TrendingUp"
              title="Estimate daily calorie needs and macro targets"
              message="Enter your age, size, sex, and activity level to calculate BMR, maintenance calories, and cutting or bulking targets."
            />
          ) : null}

          {isInvalid ? (
            <CalculatorNotice tone="error" message="Enter positive age, height, and weight values to calculate TDEE." />
          ) : null}

          {tdee !== null && goals !== null ? (
            <>
              <CalculatorPrimaryResult
                label="TDEE"
                value={`${formatNumber(tdee, { maximumFractionDigits: 0 })} kcal/day`}
                detail={`${ACTIVITY_LEVELS[activity].label} · multiplier ${ACTIVITY_LEVELS[activity].multiplier}`}
              />

              <CalculatorStatGrid
                items={[
                  {
                    label: 'BMR',
                    value: `${formatNumber(bmr, { maximumFractionDigits: 0 })} kcal`,
                    detail: 'Calories at complete rest',
                  },
                  {
                    label: 'Maintenance',
                    value: `${formatNumber(goals.maintenance, { maximumFractionDigits: 0 })} kcal`,
                    detail: 'Weight maintenance target',
                  },
                ]}
              />

              <CalculatorSectionDivider label="Goal Macros" />
              <CalculatorStatGrid
                items={Object.entries(goals).map(([key, calories]) => {
                  const macros = getMacroSplit(calories);
                  return {
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    value: `${formatNumber(calories, { maximumFractionDigits: 0 })} kcal`,
                    detail: `P ${macros.protein}g · C ${macros.carbs}g · F ${macros.fat}g`,
                  };
                })}
                columns="repeat(3, minmax(0, 1fr))"
              />
            </>
          ) : null}
        </div>
      </OutputPanel>
    </CalculatorShell>
  );
}
