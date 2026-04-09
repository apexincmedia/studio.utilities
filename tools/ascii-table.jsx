'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { buildAsciiRows } from '@/lib/encoding-tool-utils';
import { useCopyState } from '@/lib/tool-utils';
import { EmptyState } from '@/tools/_shared/text-tool-kit';

export default function AsciiTable() {
  const [range, setRange] = useState('standard');
  const [query, setQuery] = useState('');
  const [copied, copy] = useCopyState();

  const rows = useMemo(() => buildAsciiRows(range === 'extended'), [range]);
  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.code, row.hex, row.binary, row.character, row.entity, row.description]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [rows, query]);

  const copyColumn = (column) => {
    const text = filteredRows.map((row) => row[column]).join('\n');
    copy(text);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Search</div>
        <input
          type="text"
          className="textarea"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by code, character, entity, or description..."
          style={{ minHeight: 'auto', padding: '14px 16px', marginBottom: 16 }}
        />

        {filteredRows.length ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 80px 140px 120px 140px 1fr',
                gap: 0,
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                fontSize: 10,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              {['Dec', 'Hex', 'Binary', 'Char', 'Entity', 'Description'].map((header) => (
                <div key={header} style={{ padding: '12px 14px' }}>
                  {header}
                </div>
              ))}
            </div>

            <div style={{ maxHeight: 560, overflowY: 'auto', background: 'var(--card)' }}>
              {filteredRows.map((row) => (
                <div
                  key={row.code}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 80px 140px 120px 140px 1fr',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                    color: 'var(--text)',
                  }}
                >
                  <div style={{ padding: '12px 14px' }}>{row.code}</div>
                  <div style={{ padding: '12px 14px' }}>{row.hex}</div>
                  <div style={{ padding: '12px 14px', color: 'var(--muted)' }}>{row.binary}</div>
                  <div style={{ padding: '12px 14px' }}>{row.character}</div>
                  <div style={{ padding: '12px 14px', color: 'var(--muted)' }}>{row.entity}</div>
                  <div style={{ padding: '12px 14px' }}>{row.description}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            iconName="Search"
            title="No matching ASCII rows"
            message="Try a different search term or switch between the standard and extended ranges."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Range</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {[
            ['standard', '0-127'],
            ['extended', '0-255'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${range === value ? ' active' : ''}`}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="options-label">Results</div>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: 12,
            color: 'var(--muted)',
            lineHeight: 1.7,
            marginBottom: 20,
          }}
        >
          {filteredRows.length} rows shown
        </div>

        <div className="options-label">Copy Column</div>
        <div className="options-row">
          {[
            ['code', 'Decimal'],
            ['hex', 'Hex'],
            ['binary', 'Binary'],
            ['character', 'Character'],
            ['entity', 'Entity'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`copy-btn${copied ? ' copied' : ''}`}
              onClick={() => copyColumn(value)}
            >
              <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
              {label}
            </button>
          ))}
        </div>

        <div className="privacy-note">
          Static ASCII reference with search, filtering, and quick column copy.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
