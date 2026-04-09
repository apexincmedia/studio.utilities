'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState, useDebounce } from '@/lib/tool-utils';
import {
  EmptyState,
  MetricGrid,
} from '@/tools/_shared/text-tool-kit';
import { HTTP_STATUS_REFERENCE } from '@/lib/http-status-reference';

const CATEGORY_OPTIONS = [
  ['all', 'All'],
  ['1xx', '1xx'],
  ['2xx', '2xx'],
  ['3xx', '3xx'],
  ['4xx', '4xx'],
  ['5xx', '5xx'],
];

function StatusCard({ item, expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        textAlign: 'left',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
        color: 'var(--text)',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24, color: 'var(--text)' }}>{item.code}</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>{item.title}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.category}</div>
          </div>
        </div>
        <Icon icon={expanded ? ICON_MAP.ChevronDown : ICON_MAP.ChevronRight} size={16} />
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
        {item.summary}
      </div>

      {expanded ? (
        <div style={{ marginTop: 14, display: 'grid', gap: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
          <div>{item.details}</div>
          <div>
            <strong style={{ color: 'var(--text)' }}>Typical use:</strong> {item.usage}
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>Keywords:</strong> {item.keywords.join(', ')}
          </div>
        </div>
      ) : null}
    </button>
  );
}

export default function HttpStatusCodes() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [expandedCodes, setExpandedCodes] = useState([]);
  const [copied, copy] = useCopyState();
  const debouncedQuery = useDebounce(query, 150);

  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();

    return HTTP_STATUS_REFERENCE.filter((item) => {
      const categoryMatch = category === 'all' || item.category === category;
      if (!categoryMatch) return false;
      if (!term) return true;

      return (
        String(item.code).includes(term) ||
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.details.toLowerCase().includes(term) ||
        item.usage.toLowerCase().includes(term) ||
        item.keywords.some((keyword) => keyword.includes(term))
      );
    });
  }, [category, debouncedQuery]);

  const report = filtered
    .map((item) => `${item.code} ${item.title}\n${item.summary}\nTypical use: ${item.usage}`)
    .join('\n\n');

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Search HTTP Status Codes</div>
        <input
          type="text"
          className="textarea"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by code, title, or keyword..."
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
        />

        <MetricGrid
          items={[
            {
              label: 'Visible',
              value: String(filtered.length),
              description: 'Status codes matching the current filters',
              iconName: 'Globe',
            },
            {
              label: 'Category',
              value: category === 'all' ? 'All' : category,
              description: 'Active status family filter',
              iconName: 'Layers',
            },
          ]}
          columns="repeat(2, minmax(0, 1fr))"
          marginBottom={16}
        />

        {filtered.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((item) => (
              <StatusCard
                key={item.code}
                item={item}
                expanded={expandedCodes.includes(item.code)}
                onToggle={() =>
                  setExpandedCodes((current) =>
                    current.includes(item.code)
                      ? current.filter((code) => code !== item.code)
                      : [...current, item.code]
                  )
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            iconName="Globe"
            title="No status codes match the current filters"
            message="Try a different code, keyword, or category to widen the results."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Category</div>
        <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${category === value ? ' active' : ''}`}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setExpandedCodes(filtered.map((item) => item.code))}
          >
            Expand Visible
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setExpandedCodes([])}
          >
            Collapse All
          </button>
        </div>

        <div className="panel-divider" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(report)}
            disabled={!report}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy Results'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setQuery('');
              setCategory('all');
              setExpandedCodes([]);
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'http-status-reference.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">Reference data is bundled locally and searchable offline</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
