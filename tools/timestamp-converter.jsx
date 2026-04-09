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
  CalculatorSelect,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import {
  formatDateInTimeZone,
  formatNumber,
  getRelativeTime,
  getSupportedTimeZones,
  parseTimestampInput,
} from '@/lib/calculator-tool-utils';

const TIME_ZONES = getSupportedTimeZones();

function getDefaultTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function formatDisplay(timestampMs, timeZone, format) {
  const date = new Date(timestampMs);
  if (format === 'iso') return date.toISOString();
  if (format === 'rfc') return date.toUTCString();

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone,
  }).format(date);
}

export default function TimestampConverter() {
  const [input, setInput] = useState('');
  const [timeZone, setTimeZone] = useState(getDefaultTimeZone());
  const [format, setFormat] = useState('iso');

  const timestampMs = input.trim() ? parseTimestampInput(input) : null;
  const isInvalid = input.trim() && timestampMs === null;
  const zoneFormats =
    timestampMs === null
      ? []
      : Array.from(
          new Set([timeZone, getDefaultTimeZone(), 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'])
        )
          .filter(Boolean)
          .slice(0, 5)
          .map((zone) => ({
            label: zone,
            value: formatDateInTimeZone(timestampMs, zone).locale,
            detail: zone === timeZone ? 'Selected zone' : zone === 'UTC' ? 'UTC' : 'Comparison zone',
          }));

  const copyValue =
    timestampMs === null
      ? ''
      : [
          `Unix seconds: ${Math.floor(timestampMs / 1000)}`,
          `Unix milliseconds: ${timestampMs}`,
          `Relative: ${getRelativeTime(timestampMs)}`,
          ...zoneFormats.map((item) => `${item.label}: ${item.value}`),
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setInput('');
        setTimeZone(getDefaultTimeZone());
        setFormat('iso');
      }}
      options={
        <>
          <div className="options-label">Display Time Zone</div>
          <CalculatorSelect
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
            style={{ marginBottom: 16 }}
          >
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </CalculatorSelect>

          <div className="options-label">Format</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['iso', 'ISO'],
              ['rfc', 'RFC'],
              ['custom', 'Custom'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${format === value ? ' active' : ''}`}
                onClick={() => setFormat(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={() => setInput(String(Date.now()))}
            className="tool-button"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
          >
            Use Current Timestamp
          </Button>

          <div className="panel-divider" />
          <CalculatorNotice message="Numeric input is auto-detected as seconds or milliseconds. Values above 1e10 are treated as milliseconds." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Timestamp or Date Input
        </div>

        <CalculatorField
          label="Timestamp or Date"
          help='Examples: `1744128000`, `1744128000000`, or `2026-04-09 18:30 UTC`'
        >
          <CalculatorInput
            placeholder="Paste a Unix timestamp or human-readable date..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </CalculatorField>

        {!input.trim() ? (
          <CalculatorEmptyState
            iconName="Clock"
            title="Convert Unix timestamps and readable dates both ways"
            message="Paste an epoch value or a date string to inspect ISO output, RFC output, relative time, and timezone-aware displays."
          />
        ) : null}

        {isInvalid ? (
          <CalculatorNotice tone="error" message="That timestamp or date string could not be parsed." />
        ) : null}

        {timestampMs !== null ? (
          <>
            <CalculatorPrimaryResult
              label={format === 'iso' ? 'ISO Output' : format === 'rfc' ? 'RFC Output' : 'Formatted Output'}
              value={formatDisplay(timestampMs, timeZone, format)}
              detail={getRelativeTime(timestampMs)}
            />

            <CalculatorStatGrid
              items={[
                {
                  label: 'Unix Seconds',
                  value: formatNumber(Math.floor(timestampMs / 1000), { maximumFractionDigits: 0 }),
                  detail: '10-digit epoch',
                },
                {
                  label: 'Unix Milliseconds',
                  value: formatNumber(timestampMs, { maximumFractionDigits: 0 }),
                  detail: '13-digit epoch',
                },
                {
                  label: 'Selected Zone',
                  value: formatDateInTimeZone(timestampMs, timeZone).short,
                  detail: timeZone,
                },
                {
                  label: 'UTC',
                  value: new Date(timestampMs).toUTCString(),
                  detail: 'Global reference',
                },
              ]}
            />

            <CalculatorSectionDivider label="Time Zone Views" />
            <CalculatorStatGrid items={zoneFormats} />
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
