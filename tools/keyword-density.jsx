'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { STOP_WORDS, formatPercent } from '@/lib/seo-web-utils';

function tokenize(text = '') {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).map((word) => word.replace(/^'+|'+$/g, ''));
}

function getNgramLabel(size) {
  if (size === 1) return '1-gram';
  if (size === 2) return '2-gram';
  return '3-gram';
}

function analyzeKeywordDensity(text, options) {
  const rawWords = tokenize(text).filter(Boolean);
  const filteredWords = rawWords.filter(
    (word) =>
      word.length >= options.minLength &&
      (!options.filterStopWords || !STOP_WORDS.has(word))
  );

  const selectedSizes = [1, 2, 3].filter((size) => options.ngrams[size]);
  const rows = [];

  selectedSizes.forEach((size) => {
    const counts = new Map();

    for (let index = 0; index <= filteredWords.length - size; index += 1) {
      const phrase = filteredWords.slice(index, index + size).join(' ');
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }

    const total = Math.max(filteredWords.length - size + 1, 0);
    counts.forEach((count, keyword) => {
      rows.push({
        keyword,
        count,
        density: total > 0 ? (count / total) * 100 : 0,
        gram: getNgramLabel(size),
      });
    });
  });

  const sortedRows = rows.sort((left, right) => {
    const direction = options.sortDirection === 'asc' ? 1 : -1;

    if (options.sortBy === 'keyword') {
      return left.keyword.localeCompare(right.keyword) * direction;
    }

    if (options.sortBy === 'density') {
      return (left.density - right.density) * direction;
    }

    return (left.count - right.count) * direction;
  });

  return {
    totalWords: rawWords.length,
    filteredWords: filteredWords.length,
    rows: sortedRows.slice(0, 25),
  };
}

function buildReport(rows) {
  return rows
    .map((row) => `${row.keyword} | ${row.gram} | ${row.count} | ${formatPercent(row.density, 2)}`)
    .join('\n');
}

export default function KeywordDensity() {
  const [input, setInput] = useState('');
  const [minLength, setMinLength] = useState(4);
  const [filterStopWords, setFilterStopWords] = useState(true);
  const [sortBy, setSortBy] = useState('count');
  const [sortDirection, setSortDirection] = useState('desc');
  const [ngrams, setNgrams] = useState({
    1: true,
    2: false,
    3: false,
  });
  const debouncedInput = useDebounce(input, 150);

  const analysis = useMemo(
    () =>
      analyzeKeywordDensity(debouncedInput, {
        minLength,
        filterStopWords,
        ngrams,
        sortBy,
        sortDirection,
      }),
    [debouncedInput, filterStopWords, minLength, ngrams, sortBy, sortDirection]
  );

  const report = buildReport(analysis.rows);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Content"
      inputPlaceholder="Paste article copy, landing page text, or any SEO content block to analyze keyword density."
      dividerLabel="Keyword Density"
      output={report}
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="BarChart2"
          title="Analyze keyword usage in your content"
          message="Paste a text block to see the most frequent keywords, phrase density, and filtered 1-gram to 3-gram patterns."
        />
      }
      outputRenderer={
        analysis.rows.length ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Words',
                  value: String(analysis.totalWords),
                  description: 'Total words detected before filtering',
                  iconName: 'Type',
                },
              {
                label: 'Filtered',
                value: String(analysis.filteredWords),
                description: 'Words remaining after filters',
                iconName: 'Layers',
              },
                {
                  label: 'Keywords',
                  value: String(analysis.rows.length),
                  description: 'Top keyword rows currently visible',
                  iconName: 'BarChart2',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 8 }}>
              {analysis.rows.map((row) => (
                <div
                  key={`${row.keyword}-${row.gram}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(0, 0.7fr))',
                    gap: 12,
                    padding: '14px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                      {row.keyword}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{row.gram}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>{row.count}</div>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>{formatPercent(row.density, 2)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{row.gram}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="BarChart2"
            title="No keywords match the current filters"
            message="Reduce the minimum word length, enable more n-grams, or turn off stop-word filtering to widen the results."
          />
        )
      }
      options={
        <>
          <div className="options-label">Minimum Word Length</div>
          <div className="range-wrap" style={{ marginBottom: 16 }}>
            <input type="range" min="2" max="8" value={minLength} onChange={(event) => setMinLength(Number(event.target.value))} />
            <span className="range-value">{minLength} chars</span>
          </div>

          <div className="options-label">Phrases</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {[1, 2, 3].map((size) => (
              <label key={size} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={ngrams[size]}
                  onChange={(event) =>
                    setNgrams((current) => ({
                      ...current,
                      [size]: event.target.checked,
                    }))
                  }
                />
                <span className="checkbox-label">{getNgramLabel(size)}</span>
              </label>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={filterStopWords} onChange={(event) => setFilterStopWords(event.target.checked)} />
            <span className="checkbox-label">Filter common stop words</span>
          </label>

          <div className="options-label">Sort By</div>
          <div className="mode-toggle" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              ['count', 'Count'],
              ['density', 'Density'],
              ['keyword', 'Keyword'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${sortBy === value ? ' active' : ''}`}
                onClick={() => setSortBy(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Direction</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['desc', 'Highest First'],
              ['asc', 'Lowest First'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${sortDirection === value ? ' active' : ''}`}
                onClick={() => setSortDirection(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMinLength(4);
        setFilterStopWords(true);
        setSortBy('count');
        setSortDirection('desc');
        setNgrams({ 1: true, 2: false, 3: false });
      }}
      copyValue={report}
      downloadConfig={{
        filename: 'keyword-density.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: report,
        enabled: Boolean(report),
      }}
    />
  );
}
