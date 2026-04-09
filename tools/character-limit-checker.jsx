'use client';

import { useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

const PLATFORM_LIMITS = [
  { name: 'Twitter / X', limit: 280, iconName: 'Type' },
  { name: 'LinkedIn Post', limit: 3000, iconName: 'FileText' },
  { name: 'LinkedIn Headline', limit: 220, iconName: 'Type' },
  { name: 'Instagram Caption', limit: 2200, iconName: 'Image' },
  { name: 'Meta Ad Headline', limit: 40, iconName: 'Type' },
  { name: 'Meta Ad Text', limit: 125, iconName: 'Mail' },
  { name: 'Google Ad Headline', limit: 30, iconName: 'Search' },
  { name: 'Google Ad Description', limit: 90, iconName: 'Globe' },
];

export default function CharacterLimitChecker() {
  const [input, setInput] = useState('');
  const [customLimit, setCustomLimit] = useState('500');

  const count = input.length;
  const customLimitValue = Math.max(1, Number.parseInt(customLimit, 10) || 500);
  const rows = [
    ...PLATFORM_LIMITS,
    { name: 'Custom Limit', limit: customLimitValue, iconName: 'Sliders' },
  ];

  const summary = input
    ? rows
        .map((row) => {
          const remaining = row.limit - count;
          return `${row.name}: ${count}/${row.limit} (${remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`})`;
        })
        .join('\n')
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Text to Check"
      inputPlaceholder="Paste your post, ad copy, or meta description to compare against common platform limits…"
      inputStats={
        input ? <TextStatLine items={[`${count} characters`]} /> : null
      }
      dividerLabel="Platform Limits"
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Type"
          title="Check multiple platform limits at once"
          message="Paste copy once to see whether it fits Twitter, LinkedIn, Instagram, Meta ads, Google ads, and your own custom limit."
        />
      }
      outputRenderer={
        input ? (
          <>
            <div className="panel-label">Limit Breakdown</div>
            <MetricGrid
              items={rows.map((row) => {
                const remaining = row.limit - count;
                return {
                  label: row.name,
                  value: `${count}/${row.limit}`,
                  description:
                    remaining >= 0 ? `${remaining} characters left` : `${Math.abs(remaining)} over limit`,
                  tone: remaining >= 0 ? 'success' : 'error',
                  iconName: row.iconName,
                };
              })}
              columns="repeat(2, minmax(0, 1fr))"
            />
          </>
        ) : null
      }
      options={
        <>
          <div className="options-label">Custom Limit</div>
          <input
            type="number"
            className="textarea"
            value={customLimit}
            min="1"
            onChange={(event) => setCustomLimit(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />
          <div className="panel-divider" />
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: 12,
              color: 'var(--muted)',
              lineHeight: 1.7,
            }}
          >
            All checks update live as you type, so you can trim once and watch each platform move into range.
          </div>
        </>
      }
      onClear={() => setInput('')}
      copyValue={summary}
      copyLabel="Copy Summary"
      downloadConfig={{
        filename: 'character-limit-report.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: summary,
        enabled: Boolean(summary),
      }}
    />
  );
}
