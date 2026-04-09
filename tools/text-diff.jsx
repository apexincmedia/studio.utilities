'use client';

import { useState } from 'react';
import { diffArrays } from 'diff';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState, useDebounce } from '@/lib/tool-utils';
import {
  EmptyState,
  ErrorCallout,
  MetricGrid,
  ToolSectionDivider,
} from '@/tools/_shared/text-tool-kit';
import { normalizeLineBreaks, splitLines } from '@/lib/text-tool-utils';

function normalizeForComparison(line, { ignoreWhitespace, ignoreCase }) {
  let value = line;

  if (ignoreWhitespace) {
    value = value.trim().replace(/\s+/g, ' ');
  }

  if (ignoreCase) {
    value = value.toLowerCase();
  }

  return value;
}

function buildDiffChanges(originalText, updatedText, options) {
  const originalLines = splitLines(normalizeLineBreaks(originalText));
  const updatedLines = splitLines(normalizeLineBreaks(updatedText));

  return diffArrays(originalLines, updatedLines, {
    comparator: (left, right) =>
      normalizeForComparison(left, options) === normalizeForComparison(right, options),
  });
}

function buildSideBySideRows(changes) {
  const rows = [];

  for (let index = 0; index < changes.length; index += 1) {
    const current = changes[index];
    const next = changes[index + 1];

    if (current.removed && next?.added) {
      const max = Math.max(current.value.length, next.value.length);
      for (let rowIndex = 0; rowIndex < max; rowIndex += 1) {
        rows.push({
          left: current.value[rowIndex] ?? '',
          right: next.value[rowIndex] ?? '',
          leftTone: current.value[rowIndex] ? 'removed' : 'empty',
          rightTone: next.value[rowIndex] ? 'added' : 'empty',
        });
      }
      index += 1;
      continue;
    }

    if (current.removed) {
      current.value.forEach((line) => {
        rows.push({ left: line, right: '', leftTone: 'removed', rightTone: 'empty' });
      });
      continue;
    }

    if (current.added) {
      current.value.forEach((line) => {
        rows.push({ left: '', right: line, leftTone: 'empty', rightTone: 'added' });
      });
      continue;
    }

    current.value.forEach((line) => {
      rows.push({ left: line, right: line, leftTone: 'same', rightTone: 'same' });
    });
  }

  return rows;
}

function getDiffStats(changes) {
  return changes.reduce(
    (summary, change) => {
      if (change.added) {
        summary.added += change.value.length;
        return summary;
      }

      if (change.removed) {
        summary.removed += change.value.length;
        return summary;
      }

      summary.same += change.value.length;
      return summary;
    },
    { added: 0, removed: 0, same: 0 }
  );
}

function getToneStyles(tone) {
  if (tone === 'added') {
    return {
      background: 'var(--success-bg)',
      border: 'var(--success)',
      color: 'var(--text)',
      prefix: '+',
    };
  }

  if (tone === 'removed') {
    return {
      background: 'var(--error-bg)',
      border: 'var(--error)',
      color: 'var(--text)',
      prefix: '-',
    };
  }

  if (tone === 'empty') {
    return {
      background: 'var(--surface)',
      border: 'var(--border)',
      color: 'var(--faint)',
      prefix: ' ',
    };
  }

  return {
    background: 'var(--surface)',
    border: 'var(--border)',
    color: 'var(--text-dim)',
    prefix: ' ',
  };
}

export default function TextDiff() {
  const [originalText, setOriginalText] = useState('');
  const [updatedText, setUpdatedText] = useState('');
  const [viewMode, setViewMode] = useState('side-by-side');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [copied, copy] = useCopyState();

  const debouncedOriginal = useDebounce(originalText, 150);
  const debouncedUpdated = useDebounce(updatedText, 150);
  const hasBothInputs = debouncedOriginal.trim() && debouncedUpdated.trim();
  const changes = hasBothInputs
    ? buildDiffChanges(debouncedOriginal, debouncedUpdated, {
        ignoreWhitespace,
        ignoreCase,
      })
    : [];
  const stats = getDiffStats(changes);
  const rows = buildSideBySideRows(changes);
  const hasDifferences = stats.added > 0 || stats.removed > 0;

  const diffReport = hasBothInputs
    ? changes
        .map((change) => {
          const prefix = change.added ? '+' : change.removed ? '-' : ' ';
          return change.value.map((line) => `${prefix} ${line}`).join('\n');
        })
        .join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Original Version</div>
        <textarea
          className="textarea"
          placeholder="Paste the original text…"
          value={originalText}
          onChange={(event) => setOriginalText(event.target.value)}
          style={{ minHeight: 160, marginBottom: 8 }}
        />
        {originalText ? (
          <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 16 }}>
            {normalizeLineBreaks(originalText).split('\n').length} lines
          </div>
        ) : null}

        <div className="panel-label">Updated Version</div>
        <textarea
          className="textarea"
          placeholder="Paste the revised text…"
          value={updatedText}
          onChange={(event) => setUpdatedText(event.target.value)}
          style={{ minHeight: 160, marginBottom: 8 }}
        />
        {updatedText ? (
          <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 16 }}>
            {normalizeLineBreaks(updatedText).split('\n').length} lines
          </div>
        ) : null}

        <ToolSectionDivider label="Difference View" />

        <ErrorCallout
          message={
            hasBothInputs && !hasDifferences
              ? 'No differences detected with the current comparison settings.'
              : null
          }
        />

        {!hasBothInputs ? (
          <EmptyState
            iconName="Layers"
            title="Paste both versions to compare"
            message="Add the original text and the revised text to see added, removed, and unchanged lines."
          />
        ) : viewMode === 'unified' ? (
          <>
            <div className="panel-label">Unified Diff</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {changes.map((change, changeIndex) =>
                change.value.map((line, lineIndex) => {
                  const tone = change.added ? 'added' : change.removed ? 'removed' : 'same';
                  const palette = getToneStyles(tone);

                  return (
                    <div
                      key={`${changeIndex}-${lineIndex}-${tone}`}
                      style={{
                        background: palette.background,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        display: 'grid',
                        gridTemplateColumns: '22px 1fr',
                        gap: 10,
                        alignItems: 'start',
                      }}
                    >
                      <span style={{ fontSize: 12, color: palette.color }}>{palette.prefix}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: palette.color,
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {line || ' '}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            <div className="panel-label">Side-by-Side Diff</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map((row, index) => {
                const left = getToneStyles(row.leftTone);
                const right = getToneStyles(row.rightTone);

                return (
                  <div
                    key={`${index}-${row.leftTone}-${row.rightTone}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        background: left.background,
                        border: `1px solid ${left.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        fontSize: 12,
                        color: left.color,
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        minHeight: 46,
                      }}
                    >
                      {row.left || ' '}
                    </div>
                    <div
                      style={{
                        background: right.background,
                        border: `1px solid ${right.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        fontSize: 12,
                        color: right.color,
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        minHeight: 46,
                      }}
                    >
                      {row.right || ' '}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">View Mode</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {[
            ['side-by-side', 'Side by Side'],
            ['unified', 'Unified'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${viewMode === value ? ' active' : ''}`}
              onClick={() => setViewMode(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="options-label">Comparison Rules</div>
        <div className="options-row">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(event) => setIgnoreWhitespace(event.target.checked)}
            />
            <span className="checkbox-label">Ignore repeated whitespace</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(event) => setIgnoreCase(event.target.checked)}
            />
            <span className="checkbox-label">Ignore letter casing</span>
          </label>
        </div>

        <div className="panel-divider" />

        <div className="options-label">Change Summary</div>
        <MetricGrid
          items={[
            { label: 'Added', value: stats.added, tone: 'success', iconName: 'Plus' },
            { label: 'Removed', value: stats.removed, tone: 'error', iconName: 'Minus' },
            { label: 'Same', value: stats.same, iconName: 'CheckCircle2' },
          ]}
          columns="1fr"
          marginBottom={20}
        />

        <button
          type="button"
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => {
            const nextOriginal = updatedText;
            const nextUpdated = originalText;
            setOriginalText(nextOriginal);
            setUpdatedText(nextUpdated);
          }}
          disabled={!originalText && !updatedText}
        >
          <Icon icon={ICON_MAP.RefreshCw} size={14} />
          Swap Versions
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => copy(diffReport)}
            disabled={!diffReport}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy Diff'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
            onClick={() => {
              setOriginalText('');
              setUpdatedText('');
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => downloadText(diffReport, 'text-diff.txt')}
          disabled={!diffReport}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">
          100% client-side · compare drafts without sending them anywhere
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
