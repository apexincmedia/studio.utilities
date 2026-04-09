'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { useDebounce } from '@/lib/tool-utils';
import {
  EmptyState,
  ErrorCallout,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { escapeRegExp, getWords } from '@/lib/text-tool-utils';

function createRule() {
  return {
    id: `rule-${Date.now()}-${Math.random()}`,
    find: '',
    replace: '',
  };
}

function buildRegex(findValue, { regexMode, caseSensitive, wholeWord }) {
  if (!findValue) return null;

  let source = regexMode ? findValue : escapeRegExp(findValue);
  if (wholeWord) {
    source = `\\b(?:${source})\\b`;
  }

  return new RegExp(source, `g${caseSensitive ? '' : 'i'}`);
}

function applyRules(input, rules, options) {
  let output = input;
  let matchCount = 0;
  let activeRules = 0;

  for (const rule of rules) {
    if (!rule.find) continue;

    let regex;
    try {
      regex = buildRegex(rule.find, options);
    } catch (error) {
      return {
        output: '',
        matchCount: 0,
        activeRules: 0,
        error: error.message,
      };
    }

    if (!regex) continue;

    const matches = Array.from(output.matchAll(regex));
    activeRules += 1;
    matchCount += matches.length;
    output = output.replace(regex, rule.replace);
  }

  return { output, matchCount, activeRules, error: null };
}

function highlightSegments(input, rule, options) {
  if (!input || !rule?.find) return null;

  let regex;
  try {
    regex = buildRegex(rule.find, options);
  } catch {
    return null;
  }

  if (!regex) return null;

  const segments = [];
  let cursor = 0;
  const source = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  let match = source.exec(input);

  while (match) {
    if (match.index > cursor) {
      segments.push({ value: input.slice(cursor, match.index), tone: 'plain' });
    }

    segments.push({ value: match[0], tone: 'highlight' });
    cursor = match.index + match[0].length;
    match = source.exec(input);
  }

  if (!segments.length) return null;

  if (cursor < input.length) {
    segments.push({ value: input.slice(cursor), tone: 'plain' });
  }

  return segments;
}

export default function FindAndReplace() {
  const [input, setInput] = useState('');
  const [rules, setRules] = useState([createRule()]);
  const [regexMode, setRegexMode] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const debouncedInput = useDebounce(input, 150);
  const result = debouncedInput
    ? applyRules(debouncedInput, rules, { regexMode, caseSensitive, wholeWord })
    : { output: '', matchCount: 0, activeRules: 0, error: null };
  const previewSegments = highlightSegments(debouncedInput, rules.find((rule) => rule.find), {
    regexMode,
    caseSensitive,
    wholeWord,
  });

  const updateRule = (id, field, value) => {
    setRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule))
    );
  };

  const removeRule = (id) => {
    setRules((current) => {
      if (current.length === 1) return current;
      return current.filter((rule) => rule.id !== id);
    });
  };

  const resetAll = () => {
    setInput('');
    setRules([createRule()]);
    setRegexMode(false);
    setCaseSensitive(false);
    setWholeWord(false);
  };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputRenderer={
        <>
          <div className="panel-label">Original Text</div>
          <textarea
            className="textarea"
            placeholder="Paste text you want to search and replace…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            style={{ minHeight: 180, marginBottom: 8 }}
          />
          {input ? (
            <TextStatLine
              items={[`${input.length} characters`, `${getWords(input).length} words`]}
            />
          ) : null}

          {previewSegments ? (
            <>
              <div className="panel-label">Match Preview</div>
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: 16,
                  fontSize: 12,
                  lineHeight: 1.8,
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {previewSegments.map((segment, index) => (
                  <span
                    key={`${segment.tone}-${index}`}
                    style={
                      segment.tone === 'highlight'
                        ? {
                            background: 'var(--warning-bg)',
                            color: 'var(--text)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1px 4px',
                          }
                        : undefined
                    }
                  >
                    {segment.value}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </>
      }
      dividerLabel="Replaced Output"
      error={result.error}
      output={result.output}
      outputLabel="Updated Text"
      outputPlaceholder="Your replaced text will appear here…"
      outputStats={
        result.output ? (
          <TextStatLine
            items={[`${result.matchCount} matches`, `${result.activeRules} active rules`]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Search"
          title="Create one or more replacement rules"
          message="Add plain-text or regex rules, preview matches, then copy or download the transformed output."
        />
      }
      options={
        <>
          <div className="options-label">Rules</div>
          <div className="options-row">
            {rules.map((rule, index) => (
              <div
                key={rule.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 12px 10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Rule {index + 1}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '6px 10px' }}
                    onClick={() => removeRule(rule.id)}
                    disabled={rules.length === 1}
                  >
                    Remove
                  </button>
                </div>

                <input
                  type="text"
                  className="textarea"
                  placeholder={regexMode ? 'Pattern to match' : 'Find text'}
                  value={rule.find}
                  onChange={(event) => updateRule(rule.id, 'find', event.target.value)}
                  style={{ minHeight: 'auto', padding: '11px 12px', marginBottom: 8 }}
                />
                <input
                  type="text"
                  className="textarea"
                  placeholder="Replace with"
                  value={rule.replace}
                  onChange={(event) => updateRule(rule.id, 'replace', event.target.value)}
                  style={{ minHeight: 'auto', padding: '11px 12px' }}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
            onClick={() => setRules((current) => [...current, createRule()])}
          >
            Add Rule
          </button>

          <div className="options-label">Matching</div>
          <div className="options-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={regexMode}
                onChange={(event) => setRegexMode(event.target.checked)}
              />
              <span className="checkbox-label">Regex mode</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(event) => setCaseSensitive(event.target.checked)}
              />
              <span className="checkbox-label">Case sensitive</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(event) => setWholeWord(event.target.checked)}
              />
              <span className="checkbox-label">Whole word only</span>
            </label>
          </div>
          <div className="panel-divider" />
        </>
      }
      extraActions={
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 8,
            fontSize: 12,
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          {result.matchCount} matches found across {result.activeRules} active rules.
        </div>
      }
      onClear={resetAll}
      downloadConfig={{
        filename: 'find-and-replace.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
