'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  ToolSectionDivider,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { runRegexTool } from '@/lib/developer-tool-utils';

function getFlagsString(flags) {
  return ['g', 'i', 'm', 's', 'u'].filter((flag) => flags[flag]).join('');
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [testInput, setTestInput] = useState('');
  const [mode, setMode] = useState('match');
  const [replacement, setReplacement] = useState('');
  const [flags, setFlags] = useState({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });

  const result = useMemo(() => {
    if (!pattern.trim()) {
      return { error: null, output: '', matches: [], highlighted: '' };
    }

    try {
      return runRegexTool({
        pattern,
        flags: getFlagsString(flags),
        input: testInput,
        mode,
        replacement,
      });
    } catch (error) {
      return {
        error: error.message || 'Invalid regular expression.',
        output: '',
        matches: [],
        highlighted: '',
      };
    }
  }, [pattern, flags, mode, replacement, testInput]);

  return (
    <TextTransformTool
      input={testInput}
      onInputChange={setTestInput}
      inputRenderer={
        <>
          <div className="panel-label">Pattern</div>
          <input
            className="textarea"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="\\b[A-Z]{2,}\\b"
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          />

          <div className="panel-label">Test Input</div>
          <textarea
            className="textarea"
            value={testInput}
            onChange={(event) => setTestInput(event.target.value)}
            placeholder="Paste sample text to match, test, or replace against..."
            style={{ minHeight: 180, marginBottom: 8 }}
          />
        </>
      }
      dividerLabel="Results"
      error={result.error}
      output={result.output}
      outputRenderer={
        !pattern.trim() && !testInput.trim() ? (
          <EmptyState
            iconName="Regex"
            title="Test regular expressions with live matches"
            message="Enter a regex pattern, choose flags and a mode, then inspect match counts, highlighted results, and capture groups."
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: mode === 'test' ? 'Test Result' : 'Matches',
                  value:
                    mode === 'test'
                      ? result.passed
                        ? 'Match'
                        : 'No Match'
                      : String(result.matches?.length ?? 0),
                  description:
                    mode === 'replace'
                      ? 'Matches affected by the replacement'
                      : mode === 'test'
                        ? 'Boolean evaluation of the pattern'
                        : 'Total matches found in the input',
                  tone:
                    mode === 'test'
                      ? result.passed
                        ? 'success'
                        : 'warning'
                      : (result.matches?.length ?? 0) > 0
                        ? 'success'
                        : 'warning',
                  iconName: 'Regex',
                },
                {
                  label: 'Flags',
                  value: getFlagsString(flags) || 'none',
                  description: 'Active regular expression flags',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div className="panel-label">
              {mode === 'replace' ? 'Output' : 'Highlighted Matches'}
            </div>
            {mode === 'replace' ? (
              <textarea
                className="textarea"
                value={result.output}
                readOnly
                style={{ minHeight: 180, marginBottom: 16 }}
              />
            ) : (
              <div
                style={{
                  minHeight: 180,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  color: 'var(--text)',
                  lineHeight: 1.7,
                  marginBottom: 16,
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{
                  __html: result.highlighted || 'No matches to highlight yet.',
                }}
              />
            )}

            {result.matches?.length ? (
              <>
                <ToolSectionDivider label="Capture Groups" />
                <div style={{ display: 'grid', gap: 12 }}>
                  {result.matches.map((match, index) => (
                    <div
                      key={`${match.index}-${index}`}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                        Match {index + 1} at index {match.index}
                      </div>
                      <div style={{ fontSize: 18, color: 'var(--text)', marginBottom: 10 }}>
                        {match.match || '(empty match)'}
                      </div>
                      {match.groups.length ? (
                        <div style={{ display: 'grid', gap: 6 }}>
                          {match.groups.map((group, groupIndex) => (
                            <div key={`${index}-${groupIndex}`} style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              Group {groupIndex + 1}: {group ?? '(undefined)'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>No capture groups</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['match', 'Match'],
              ['test', 'Test'],
              ['replace', 'Replace'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${mode === value ? ' active' : ''}`}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Flags</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            {['g', 'i', 'm', 's', 'u'].map((flag) => (
              <label key={flag} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={flags[flag]}
                  onChange={(event) => setFlags((current) => ({ ...current, [flag]: event.target.checked }))}
                />
                <span className="checkbox-label">{flag.toUpperCase()} flag</span>
              </label>
            ))}
          </div>

          {mode === 'replace' ? (
            <>
              <div className="options-label">Replacement</div>
              <textarea
                className="textarea"
                value={replacement}
                onChange={(event) => setReplacement(event.target.value)}
                placeholder="Replacement string..."
                style={{ minHeight: 120, marginBottom: 20 }}
              />
            </>
          ) : null}

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setPattern('');
        setTestInput('');
        setReplacement('');
        setMode('match');
        setFlags({ g: true, i: false, m: false, s: false, u: false });
      }}
      copyValue={
        mode === 'replace'
          ? result.output
          : result.matches?.map((entry) => entry.match).join('\n') || ''
      }
      downloadConfig={{
        filename: mode === 'replace' ? 'regex-replace.txt' : 'regex-matches.txt',
        mimeType: 'text/plain;charset=utf-8',
        text:
          mode === 'replace'
            ? result.output
            : result.matches?.map((entry) => entry.match).join('\n') || '',
        enabled: mode === 'replace' ? Boolean(result.output) : Boolean(result.matches?.length),
      }}
    />
  );
}
