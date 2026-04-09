'use client';

import { useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { getWordCounterMetrics, normalizeLineBreaks } from '@/lib/text-tool-utils';

export default function WordCounter() {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 150);
  const metrics = debouncedInput.trim() ? getWordCounterMetrics(debouncedInput) : null;
  const lineCount = input ? normalizeLineBreaks(input).split('\n').length : 0;

  const summary = metrics
    ? [
        'Word Counter Summary',
        `Words: ${metrics.wordCount}`,
        `Characters: ${metrics.characterCount}`,
        `Characters (no spaces): ${metrics.characterCountNoSpaces}`,
        `Sentences: ${metrics.sentenceCount}`,
        `Paragraphs: ${metrics.paragraphCount}`,
        `Reading time: ${metrics.readingTime}`,
        `Speaking time: ${metrics.speakingTime}`,
      ].join('\n')
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Text Input"
      inputPlaceholder="Paste or type text to measure…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${input.length} characters`, `${lineCount} lines`]}
          />
        ) : null
      }
      dividerLabel="Insights"
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Type"
          title="Paste text to analyze"
          message="Word count, reading time, speaking time, and structure metrics will appear here instantly."
        />
      }
      outputRenderer={
        metrics ? (
          <>
            <div className="panel-label">Text Insights</div>
            <MetricGrid
              items={[
                { label: 'Words', value: metrics.wordCount, iconName: 'Type' },
                {
                  label: 'Characters',
                  value: metrics.characterCount,
                  iconName: 'Hash',
                },
                {
                  label: 'No Spaces',
                  value: metrics.characterCountNoSpaces,
                  iconName: 'Scissors',
                },
                {
                  label: 'Sentences',
                  value: metrics.sentenceCount,
                  iconName: 'FileText',
                },
                {
                  label: 'Paragraphs',
                  value: metrics.paragraphCount,
                  iconName: 'Layers',
                },
                {
                  label: 'Reading Time',
                  value: metrics.readingTime,
                  iconName: 'Clock',
                },
                {
                  label: 'Speaking Time',
                  value: metrics.speakingTime,
                  iconName: 'Music',
                },
                {
                  label: 'Avg Word',
                  value: `${metrics.averageWordLength} chars`,
                  iconName: 'BarChart2',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={14}
            />

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 8,
                }}
              >
                Quick Summary
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
                This text has {metrics.wordCount} words across {metrics.sentenceCount}{' '}
                sentences and should take about {metrics.readingTime.toLowerCase()} to read
                or {metrics.speakingTime.toLowerCase()} to speak aloud.
              </div>
            </div>
          </>
        ) : null
      }
      options={
        <>
          <div className="options-label">What&apos;s Included</div>
          <div className="options-row">
            {[
              'Word and character counts',
              'Sentence and paragraph totals',
              'Reading and speaking time',
              'Average word length',
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
                  lineHeight: 1.6,
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
      copyLabel="Copy Summary"
      downloadConfig={{
        filename: 'word-count-summary.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: summary,
        enabled: Boolean(summary),
      }}
    />
  );
}
