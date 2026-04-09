'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  CalculatorEmptyState,
  CalculatorField,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorSelect,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import { getSupportedTimeZones } from '@/lib/calculator-tool-utils';

const TIME_ZONES = getSupportedTimeZones();

function getLocalTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function getCurrentDateTimeValue() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function parseDateTimeLocal(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  return {
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10),
    day: Number.parseInt(match[3], 10),
    hour: Number.parseInt(match[4], 10),
    minute: Number.parseInt(match[5], 10),
  };
}

function getTimeZoneOffsetMs(timestamp, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  const asUtc = Date.UTC(
    Number.parseInt(values.year, 10),
    Number.parseInt(values.month, 10) - 1,
    Number.parseInt(values.day, 10),
    Number.parseInt(values.hour, 10),
    Number.parseInt(values.minute, 10),
    Number.parseInt(values.second, 10)
  );

  return asUtc - timestamp;
}

function zonedDateTimeToTimestamp(value, timeZone) {
  const parsed = parseDateTimeLocal(value);
  if (!parsed) return null;

  const utcGuess = Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute);
  const initialOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const timestamp = utcGuess - initialOffset;
  const adjustedOffset = getTimeZoneOffsetMs(timestamp, timeZone);
  return utcGuess - adjustedOffset;
}

function formatInZone(timestamp, timeZone, timeZoneName = 'short') {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
    timeZoneName,
  }).format(new Date(timestamp));
}

function getShortZoneName(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  }).formatToParts(new Date(timestamp));

  return parts.find((part) => part.type === 'timeZoneName')?.value || timeZone;
}

function observesDst(timeZone) {
  const year = new Date().getUTCFullYear();
  return (
    getTimeZoneOffsetMs(Date.UTC(year, 0, 1, 12), timeZone) !==
    getTimeZoneOffsetMs(Date.UTC(year, 6, 1, 12), timeZone)
  );
}

function getDefaultTargets(sourceTimeZone) {
  return Array.from(new Set(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', sourceTimeZone]))
    .filter((zone) => zone && zone !== sourceTimeZone)
    .slice(0, 4);
}

export default function TimezoneConverter() {
  const localTimeZone = getLocalTimeZone();
  const [sourceDateTime, setSourceDateTime] = useState('');
  const [sourceTimeZone, setSourceTimeZone] = useState(localTimeZone);
  const [pendingZone, setPendingZone] = useState('UTC');
  const [targetZones, setTargetZones] = useState(getDefaultTargets(localTimeZone));

  const timestamp = sourceDateTime ? zonedDateTimeToTimestamp(sourceDateTime, sourceTimeZone) : null;
  const isInvalid = sourceDateTime && timestamp === null;
  const zoneItems =
    timestamp === null
      ? []
      : targetZones.map((zone) => ({
          label: zone,
          value: formatInZone(timestamp, zone),
          detail: `${getShortZoneName(timestamp, zone)} · ${observesDst(zone) ? 'DST shifts observed' : 'No DST shifts'}`,
        }));

  const copyValue =
    timestamp === null
      ? ''
      : [
          `${sourceDateTime} in ${sourceTimeZone}`,
          ...zoneItems.map((item) => `${item.label}: ${item.value}`),
        ].join('\n');

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setSourceDateTime('');
        setSourceTimeZone(localTimeZone);
        setPendingZone('UTC');
        setTargetZones(getDefaultTargets(localTimeZone));
      }}
      options={
        <>
          <div className="options-label">Source Time Zone</div>
          <CalculatorSelect
            value={sourceTimeZone}
            onChange={(event) => setSourceTimeZone(event.target.value)}
            style={{ marginBottom: 16 }}
          >
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </CalculatorSelect>

          <div className="options-label">Add Target Zone</div>
          <CalculatorSelect
            value={pendingZone}
            onChange={(event) => setPendingZone(event.target.value)}
            style={{ marginBottom: 12 }}
          >
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </CalculatorSelect>

          <Button
            variant="ghost"
            onClick={() => {
              if (!targetZones.includes(pendingZone) && pendingZone !== sourceTimeZone) {
                setTargetZones([...targetZones, pendingZone]);
              }
            }}
            className="tool-button"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
          >
            Add Time Zone
          </Button>

          <Button
            variant="ghost"
            onClick={() => setSourceDateTime(getCurrentDateTimeValue())}
            className="tool-button"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
          >
            Use Current Time
          </Button>

          <div className="panel-divider" />
          <CalculatorNotice message="The source time is interpreted in the selected timezone first, then converted into every target timezone below." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          Source Time
        </div>

        <CalculatorField label="Date & Time">
          <input
            type="datetime-local"
            className="textarea"
            value={sourceDateTime}
            onChange={(event) => setSourceDateTime(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
        </CalculatorField>

        {!sourceDateTime ? (
          <CalculatorEmptyState
            iconName="Globe"
            title="Convert one meeting time across multiple cities"
            message="Set a source date and timezone, then compare how that same moment lands for every target timezone you care about."
          />
        ) : null}

        {isInvalid ? (
          <CalculatorNotice tone="error" message="That date and time could not be interpreted for the selected source timezone." />
        ) : null}

        {timestamp !== null ? (
          <>
            <CalculatorPrimaryResult
              label="Source Time"
              value={formatInZone(timestamp, sourceTimeZone)}
              detail={`UTC reference: ${formatInZone(timestamp, 'UTC')}`}
            />

            <CalculatorSectionDivider label="Target Time Zones" />

            {zoneItems.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {zoneItems.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            marginBottom: 6,
                          }}
                        >
                          {item.label}
                        </div>
                        <div style={{ fontSize: 20, color: 'var(--text)', lineHeight: 1.3 }}>{item.value}</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                          {item.detail}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTargetZones(targetZones.filter((zone) => zone !== item.label))}
                        className="btn-ghost"
                        style={{ minWidth: 40, display: 'flex', justifyContent: 'center', padding: '8px 10px' }}
                        aria-label={`Remove ${item.label}`}
                      >
                        <Icon icon={ICON_MAP.X} size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CalculatorNotice tone="warning" message="Add at least one target timezone to compare against the source time." />
            )}

            <CalculatorSectionDivider label="Quick Facts" />
            <CalculatorStatGrid
              items={[
                {
                  label: 'UTC',
                  value: formatInZone(timestamp, 'UTC'),
                  detail: 'Universal time reference',
                },
                {
                  label: 'Local Time Zone',
                  value: formatInZone(timestamp, localTimeZone),
                  detail: localTimeZone,
                },
              ]}
            />
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
