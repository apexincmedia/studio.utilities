'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import {
  CalculatorEmptyState,
  CalculatorField,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import { calculateAge } from '@/lib/calculator-tool-utils';

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function formatBirthdayDate(birthdate, targetDate) {
  const birth = new Date(`${birthdate}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  const nextBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < target) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  return nextBirthday.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AgeCalculator() {
  const [birthdate, setBirthdate] = useState('');
  const [targetDate, setTargetDate] = useState(getTodayValue());

  const result = birthdate ? calculateAge(birthdate, targetDate) : null;
  const hasInput = Boolean(birthdate);
  const isInvalid = birthdate && !result;
  const copyValue =
    result && birthdate
      ? [
          `Age: ${result.years} years, ${result.months} months, ${result.days} days`,
          `Days until next birthday: ${result.daysUntilNextBirthday}`,
          `Born on: ${result.birthWeekday}`,
          `Total days alive: ${result.totalDays}`,
          `Next birthday: ${formatBirthdayDate(birthdate, targetDate)}`,
        ].join('\n')
      : '';

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setBirthdate('');
        setTargetDate(getTodayValue());
      }}
      options={
        <>
          <div className="options-label">Target Date</div>
          <input
            type="date"
            className="textarea"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          />

          <Button
            variant="ghost"
            onClick={() => setTargetDate(getTodayValue())}
            className="tool-button"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
          >
            Set Target to Today
          </Button>

          <div className="panel-divider" />
          <CalculatorNotice message="The age result includes exact years, months, and days plus a few fun lifetime stats." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Birthdate
        </div>

        <CalculatorField label="Date of Birth">
          <input
            type="date"
            className="textarea"
            value={birthdate}
            onChange={(event) => setBirthdate(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
        </CalculatorField>

        {!hasInput ? (
          <CalculatorEmptyState
            iconName="Calendar"
            title="Calculate exact age from any birthdate"
            message="Pick a birthday and optionally change the target date to see years, months, days, next birthday timing, and lifetime totals."
          />
        ) : null}

        {isInvalid ? (
          <CalculatorNotice tone="error" message="The target date must be on or after the birthdate." />
        ) : null}

        {result && birthdate ? (
          <>
            <CalculatorPrimaryResult
              label="Exact Age"
              value={`${result.years}y ${result.months}m ${result.days}d`}
              detail={`As of ${new Date(`${targetDate}T00:00:00`).toLocaleDateString()}`}
            />

            <CalculatorStatGrid
              items={[
                {
                  label: 'Days Until Next Birthday',
                  value: String(result.daysUntilNextBirthday),
                  detail: formatBirthdayDate(birthdate, targetDate),
                },
                {
                  label: 'Born On',
                  value: result.birthWeekday,
                  detail: new Date(`${birthdate}T00:00:00`).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                },
                {
                  label: 'Total Days',
                  value: result.totalDays.toLocaleString(),
                  detail: 'Days lived so far',
                },
                {
                  label: 'Total Hours',
                  value: result.totalHours.toLocaleString(),
                  detail: 'Rounded from total days',
                },
              ]}
            />

            <CalculatorSectionDivider label="Lifetime Totals" />
            <CalculatorStatGrid
              items={[
                {
                  label: 'Total Minutes',
                  value: result.totalMinutes.toLocaleString(),
                  detail: 'Rounded from total days',
                },
                {
                  label: 'Target Date',
                  value: new Date(`${targetDate}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  detail: 'Reference date',
                },
              ]}
            />
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
