'use client';

import { useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { getReadabilityMetrics } from '@/lib/text-tool-utils';

function formatMetric(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

export default function ReadabilityScore() {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 150);
  const metrics = debouncedInput.trim() ? getReadabilityMetrics(debouncedInput) : null;
  const gradeProgress = metrics
    ? Math.max(8, Math.min(100, (metrics.roundedGrade / 18) * 100))
    : 0;

  const summary = metrics
    ? [
        'Readability Report',
        `Flesch Reading Ease: ${formatMetric(metrics.fleschReadingEase)}`,
        `Flesch-Kincaid Grade: ${formatMetric(metrics.fleschKincaidGrade)}`,
        `Gunning Fog: ${formatMetric(metrics.gunningFog)}`,
        `SMOG: ${formatMetric(metrics.smog)}`,
        `Interpretation: ${metrics.interpretation}`,
      ].join('\n')
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Text to Analyze"
      inputPlaceholder="Paste text with at least one full sentence to score readability…"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`]} />
        ) : null
      }
      dividerLabel="Readability Report"
      error={
        input.trim() && !metrics
          ? 'Readability formulas need at least one complete sentence to score accurately.'
          : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="BarChart2"
          title="Score your writing"
          message="See how difficult your copy feels to readers with Flesch-Kincaid, Gunning Fog, and SMOG estimates."
        />
      }
      outputRenderer={
        metrics ? (
          <>
            <div className="panel-label">Grade Level</div>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px 24px',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      marginBottom: 6,
                    }}
                  >
                    Target Audience
                  </div>
                  <div style={{ fontSize: 30, color: 'var(--text)', lineHeight: 1 }}>
                    Grade {metrics.roundedGrade}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                  {metrics.interpretation}
                </div>
              </div>

              <div className="progress-track" style={{ marginBottom: 10 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${gradeProgress}%`, background: 'var(--text)' }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--faint)', lineHeight: 1.6 }}>
                Lower grades are easier to read. Grade 8 is usually suitable for general audiences.
              </div>
            </div>

            <MetricGrid
              items={[
                {
                  label: 'Flesch Ease',
                  value: formatMetric(metrics.fleschReadingEase),
                  description: 'Higher is easier',
                  iconName: 'BarChart2',
                },
                {
                  label: 'Kincaid Grade',
                  value: formatMetric(metrics.fleschKincaidGrade),
                  description: 'Approximate school grade',
                  iconName: 'Calculator',
                },
                {
                  label: 'Gunning Fog',
                  value: formatMetric(metrics.gunningFog),
                  description: 'Complexity estimate',
                  iconName: 'TrendingUp',
                },
                {
                  label: 'SMOG',
                  value: formatMetric(metrics.smog),
                  description: 'Reading grade estimate',
                  iconName: 'FileText',
                },
                {
                  label: 'Words',
                  value: metrics.wordCount,
                  description: `${metrics.sentenceCount} sentences`,
                  iconName: 'Type',
                },
                {
                  label: 'Complex Words',
                  value: metrics.complexWordCount,
                  description: `${metrics.syllableCount} syllables total`,
                  iconName: 'Layers',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
            />
          </>
        ) : null
      }
      options={
        <>
          <div className="options-label">Algorithms Used</div>
          <div className="options-row">
            {[
              'Flesch Reading Ease',
              'Flesch-Kincaid Grade',
              'Gunning Fog Index',
              'SMOG estimate',
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      copyValue={summary}
      copyLabel="Copy Report"
      downloadConfig={{
        filename: 'readability-report.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: summary,
        enabled: Boolean(summary),
      }}
    />
  );
}
