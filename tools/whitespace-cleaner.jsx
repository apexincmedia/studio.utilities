'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { normalizeLineBreaks } from '@/lib/text-tool-utils';

function cleanWhitespace(
  text,
  {
    trimWhitespace,
    collapseSpaces,
    removeBlankLines,
    tabsToSpaces,
    removeLineBreaks,
  }
) {
  let result = normalizeLineBreaks(text);

  if (tabsToSpaces) {
    result = result.replace(/\t/g, ' ');
  }

  if (trimWhitespace) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }

  if (collapseSpaces) {
    result = result.replace(/[ ]{2,}/g, ' ');
  }

  if (removeBlankLines) {
    result = result
      .split('\n')
      .filter((line) => line.trim() !== '')
      .join('\n');
  }

  if (removeLineBreaks) {
    result = result.replace(/\n+/g, ' ');
  }

  if (collapseSpaces) {
    result = result.replace(/[ ]{2,}/g, ' ').trim();
  }

  return result;
}

const DEFAULT_OPTIONS = {
  trimWhitespace: true,
  collapseSpaces: true,
  removeBlankLines: true,
  tabsToSpaces: true,
  removeLineBreaks: false,
};

export default function WhitespaceCleaner() {
  const [input, setInput] = useState('');
  const [trimWhitespace, setTrimWhitespace] = useState(DEFAULT_OPTIONS.trimWhitespace);
  const [collapseSpaces, setCollapseSpaces] = useState(DEFAULT_OPTIONS.collapseSpaces);
  const [removeBlankLines, setRemoveBlankLines] = useState(DEFAULT_OPTIONS.removeBlankLines);
  const [tabsToSpaces, setTabsToSpaces] = useState(DEFAULT_OPTIONS.tabsToSpaces);
  const [removeLineBreaks, setRemoveLineBreaks] = useState(DEFAULT_OPTIONS.removeLineBreaks);

  const debouncedInput = useDebounce(input, 150);
  const output = debouncedInput
    ? cleanWhitespace(debouncedInput, {
        trimWhitespace,
        collapseSpaces,
        removeBlankLines,
        tabsToSpaces,
        removeLineBreaks,
      })
    : '';

  const resetDefaults = () => {
    setTrimWhitespace(DEFAULT_OPTIONS.trimWhitespace);
    setCollapseSpaces(DEFAULT_OPTIONS.collapseSpaces);
    setRemoveBlankLines(DEFAULT_OPTIONS.removeBlankLines);
    setTabsToSpaces(DEFAULT_OPTIONS.tabsToSpaces);
    setRemoveLineBreaks(DEFAULT_OPTIONS.removeLineBreaks);
  };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Messy Text"
      inputPlaceholder="Paste text with extra spaces, tabs, or blank lines…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${input.length} characters`, `${normalizeLineBreaks(input).split('\n').length} lines`]}
          />
        ) : null
      }
      output={output}
      outputLabel="Cleaned Text"
      outputPlaceholder="Clean output will appear here…"
      outputStats={
        output ? (
          <TextStatLine
            items={[`${output.length} characters`, `${Math.max(0, input.length - output.length)} removed`]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Scissors"
          title="Clean up whitespace instantly"
          message="Trim messy input, collapse repeated spaces, remove blank lines, and normalize tabs without touching the rest of your text."
        />
      }
      options={
        <>
          <div className="options-label">Cleanup Rules</div>
          <div className="options-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={trimWhitespace}
                onChange={(event) => setTrimWhitespace(event.target.checked)}
              />
              <span className="checkbox-label">Trim leading and trailing whitespace</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={collapseSpaces}
                onChange={(event) => setCollapseSpaces(event.target.checked)}
              />
              <span className="checkbox-label">Collapse repeated spaces</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={removeBlankLines}
                onChange={(event) => setRemoveBlankLines(event.target.checked)}
              />
              <span className="checkbox-label">Remove blank lines</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={tabsToSpaces}
                onChange={(event) => setTabsToSpaces(event.target.checked)}
              />
              <span className="checkbox-label">Convert tabs to spaces</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={removeLineBreaks}
                onChange={(event) => setRemoveLineBreaks(event.target.checked)}
              />
              <span className="checkbox-label">Remove all line breaks</span>
            </label>
          </div>
          <div className="panel-divider" />
        </>
      }
      extraActions={
        <button
          type="button"
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: 8,
            display: 'flex',
          }}
          onClick={resetDefaults}
        >
          Reset Defaults
        </button>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'cleaned-text.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
