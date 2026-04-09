'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import {
  buildCronExpression,
  getNextCronRuns,
} from '@/lib/developer-tool-utils';

const DEFAULT_FIELDS = {
  second: '0',
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  weekday: '*',
};

function formatRun(date) {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

export default function CronBuilder() {
  const [withSeconds, setWithSeconds] = useState(false);
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const cronExpression = useMemo(
    () => buildCronExpression(fields, withSeconds),
    [fields, withSeconds]
  );
  const nextRuns = useMemo(
    () => getNextCronRuns(fields, { withSeconds, count: 5 }),
    [fields, withSeconds]
  );

  useEffect(() => {
    let cancelled = false;

    async function describe() {
      try {
        const cronstrue = await import('cronstrue');
        const readable = cronstrue.default?.toString
          ? cronstrue.default.toString(cronExpression, { use24HourTimeFormat: true })
          : cronstrue.toString(cronExpression, { use24HourTimeFormat: true });
        if (!cancelled) {
          setDescription(readable);
          setDescriptionError('');
        }
      } catch (error) {
        if (!cancelled) {
          setDescription('');
          setDescriptionError(error.message || 'Could not describe this cron expression.');
        }
      }
    }

    describe();
    return () => {
      cancelled = true;
    };
  }, [cronExpression]);

  const output = [cronExpression, description || descriptionError, ...nextRuns.map(formatRun)].join('\n');

  return (
    <TextGeneratorTool
      output={output}
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'Cron Expression',
                value: cronExpression,
                description: withSeconds ? '6-field cron with seconds enabled' : '5-field cron expression',
                iconName: 'Clock',
              },
              {
                label: 'Human Description',
                value: description || 'Unavailable',
                description: descriptionError || 'Generated with cronstrue',
                tone: descriptionError ? 'warning' : 'success',
                iconName: 'Info',
              },
            ]}
            columns="repeat(2, minmax(0, 1fr))"
            marginBottom={16}
          />

          {nextRuns.length ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div className="panel-label" style={{ marginBottom: 12 }}>
                Next 5 Run Times
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {nextRuns.map((run, index) => (
                  <div
                    key={`${run.toISOString()}-${index}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      fontSize: 13,
                      color: 'var(--text-dim)',
                    }}
                  >
                    <span>Run {index + 1}</span>
                    <span>{formatRun(run)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              iconName="Clock"
              title="Build a cron expression with live next-run previews"
              message="Fill in the cron fields, toggle seconds if you need them, and inspect the natural-language description plus the next five scheduled run times."
            />
          )}
        </>
      }
      showEmptyState={false}
      options={
        <>
          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={withSeconds}
              onChange={(event) => {
                setWithSeconds(event.target.checked);
                setFields((current) => ({
                  ...current,
                  second: event.target.checked ? current.second : '0',
                }));
              }}
            />
            <span className="checkbox-label">Enable seconds field</span>
          </label>

          <div className="options-label">Quick Presets</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {[
              {
                label: 'Every minute',
                values: { second: '0', minute: '*', hour: '*', day: '*', month: '*', weekday: '*' },
              },
              {
                label: 'Hourly',
                values: { second: '0', minute: '0', hour: '*', day: '*', month: '*', weekday: '*' },
              },
              {
                label: 'Daily',
                values: { second: '0', minute: '0', hour: '9', day: '*', month: '*', weekday: '*' },
              },
              {
                label: 'Weekly',
                values: { second: '0', minute: '0', hour: '9', day: '*', month: '*', weekday: '1' },
              },
              {
                label: 'Monthly',
                values: { second: '0', minute: '0', hour: '9', day: '1', month: '*', weekday: '*' },
              },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="btn-ghost"
                onClick={() => setFields(preset.values)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {withSeconds ? (
            <>
              <div className="options-label">Second</div>
              <input
                className="textarea"
                value={fields.second}
                onChange={(event) => setFields((current) => ({ ...current, second: event.target.value || '*' }))}
                style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 14 }}
              />
            </>
          ) : null}

          {[
            ['minute', 'Minute'],
            ['hour', 'Hour'],
            ['day', 'Day of Month'],
            ['month', 'Month'],
            ['weekday', 'Weekday'],
          ].map(([key, label]) => (
            <div key={key}>
              <div className="options-label">{label}</div>
              <input
                className="textarea"
                value={fields[key]}
                onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value || '*' }))}
                style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 14 }}
              />
            </div>
          ))}

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setWithSeconds(false);
        setFields(DEFAULT_FIELDS);
      }}
      copyValue={cronExpression}
      copyLabel="Copy Cron"
      clearLabel="Reset"
      downloadConfig={{
        filename: 'cron-expression.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
      privacyNote="Cron descriptions generated locally with cronstrue · next run times calculated in the browser"
    />
  );
}
