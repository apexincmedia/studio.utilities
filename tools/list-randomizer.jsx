'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { shuffleArray, splitLines } from '@/lib/text-tool-utils';

function randomizeList(lines, { mode, pickCount, allowDuplicates }) {
  const items = lines.filter((line) => line.trim() !== '');

  if (!items.length) {
    return [];
  }

  if (mode === 'shuffle') {
    return shuffleArray(items);
  }

  const safeCount = Math.max(1, Number.parseInt(pickCount, 10) || 1);
  if (allowDuplicates) {
    return Array.from({ length: safeCount }, () => items[Math.floor(Math.random() * items.length)]);
  }

  return shuffleArray(items).slice(0, Math.min(safeCount, items.length));
}

export default function ListRandomizer() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('shuffle');
  const [pickCount, setPickCount] = useState('3');
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [output, setOutput] = useState('');

  const listItems = splitLines(input).filter((line) => line.trim() !== '');

  const runRandomizer = () => {
    const randomized = randomizeList(listItems, { mode, pickCount, allowDuplicates });
    setOutput(randomized.join('\n'));
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setMode('shuffle');
    setPickCount('3');
    setAllowDuplicates(false);
  };

  return (
    <TextTransformTool
      input={input}
      onInputChange={(value) => {
        setInput(value);
        setOutput('');
      }}
      inputLabel="List Items"
      inputPlaceholder="Paste one item per line…"
      inputStats={
        input ? <TextStatLine items={[`${listItems.length} items`]} /> : null
      }
      dividerLabel="Randomized Result"
      output={output}
      outputLabel="Random Order"
      outputPlaceholder="Run the randomizer to generate a shuffled or picked list…"
      outputStats={
        output ? (
          <TextStatLine items={[`${splitLines(output).filter(Boolean).length} results`]} marginBottom={0} />
        ) : null
      }
      showEmptyState={!output}
      emptyState={
        <EmptyState
          iconName="RefreshCw"
          title={input.trim() ? 'Ready to randomize' : 'Paste a list to randomize'}
          message={
            input.trim()
              ? 'Shuffle the full list or pick a random subset when you are ready.'
              : 'Add one item per line, then shuffle the full list or choose random winners.'
          }
        />
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['shuffle', 'Shuffle'],
              ['pick', 'Pick N'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${mode === value ? ' active' : ''}`}
                onClick={() => {
                  setMode(value);
                  setOutput('');
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'pick' ? (
            <>
              <div className="options-label">How Many</div>
              <input
                type="number"
                className="textarea"
                value={pickCount}
                min="1"
                onChange={(event) => {
                  setPickCount(event.target.value);
                  setOutput('');
                }}
                style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
              />

              <label className="checkbox-row" style={{ marginBottom: 20 }}>
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(event) => {
                    setAllowDuplicates(event.target.checked);
                    setOutput('');
                  }}
                />
                <span className="checkbox-label">Allow duplicates when picking</span>
              </label>
            </>
          ) : null}

          <div className="panel-divider" />
        </>
      }
      primaryAction={{
        label: mode === 'pick' ? 'Pick Random' : 'Shuffle List',
        iconName: 'RefreshCw',
        onClick: runRandomizer,
        disabled: !listItems.length,
      }}
      onClear={clearAll}
      downloadConfig={{
        filename: 'randomized-list.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
