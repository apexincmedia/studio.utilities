'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import { ensureUrlProtocol, escapeXml } from '@/lib/seo-web-utils';

function createRow(partial = {}) {
  return {
    url: '',
    priority: '0.6',
    changefreq: 'weekly',
    lastmod: '',
    ...partial,
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function buildEntries(mode, rows, bulkUrls, autoDates) {
  if (mode === 'bulk') {
    return bulkUrls
      .split('\n')
      .map((line, index) => createRow({
        url: line.trim(),
        priority: index === 0 ? '1.0' : '0.6',
        changefreq: index === 0 ? 'daily' : 'weekly',
        lastmod: autoDates ? getToday() : '',
      }))
      .filter((row) => row.url);
  }

  return rows
    .map((row) =>
      createRow({
        ...row,
        lastmod: row.lastmod || (autoDates ? getToday() : ''),
      })
    )
    .filter((row) => row.url.trim());
}

function buildSitemap(entries) {
  if (!entries.length) return '';

  const validEntries = entries
    .map((entry) => ({
      ...entry,
      normalizedUrl: ensureUrlProtocol(entry.url),
    }))
    .filter((entry) => entry.normalizedUrl);

  if (!validEntries.length) return '';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...validEntries.map((entry) => {
      const lines = [
        '  <url>',
        `    <loc>${escapeXml(entry.normalizedUrl)}</loc>`,
        `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
        `    <priority>${escapeXml(entry.priority)}</priority>`,
      ];

      if (entry.lastmod) {
        lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }

      lines.push('  </url>');
      return lines.join('\n');
    }),
    '</urlset>',
  ].join('\n');
}

export default function SitemapGenerator() {
  const [mode, setMode] = useState('manual');
  const [autoDates, setAutoDates] = useState(true);
  const [bulkUrls, setBulkUrls] = useState('');
  const [rows, setRows] = useState([]);

  const entries = useMemo(() => buildEntries(mode, rows, bulkUrls, autoDates), [autoDates, bulkUrls, mode, rows]);
  const output = useMemo(() => buildSitemap(entries), [entries]);

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!output}
      emptyState={
        <EmptyState
          iconName="Globe"
          title="Generate an XML sitemap from page URLs"
          message="Add URLs manually or paste a bulk list to build a sitemap.xml file with priorities, change frequency, and last modified dates."
        />
      }
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'URLs',
                value: String(entries.length),
                description: 'Pages included in the sitemap',
                iconName: 'Link2',
              },
              {
                label: 'Mode',
                value: mode === 'bulk' ? 'Bulk Import' : 'Manual',
                description: 'Current sitemap input workflow',
                iconName: 'Layers',
              },
              {
                label: 'Dates',
                value: autoDates ? 'Auto' : 'Manual',
                description: 'Last modified handling in the output',
                iconName: 'Calendar',
              },
            ]}
            columns="repeat(3, minmax(0, 1fr))"
            marginBottom={16}
          />

          <div className="panel-label">Generated sitemap.xml</div>
          <textarea className="textarea" value={output} readOnly style={{ minHeight: 360 }} />
        </>
      }
      options={
        <>
          <div className="options-label">Input Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            <button type="button" className={`mode-btn${mode === 'manual' ? ' active' : ''}`} onClick={() => setMode('manual')}>
              Manual
            </button>
            <button type="button" className={`mode-btn${mode === 'bulk' ? ' active' : ''}`} onClick={() => setMode('bulk')}>
              Bulk Import
            </button>
          </div>

          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={autoDates} onChange={(event) => setAutoDates(event.target.checked)} />
            <span className="checkbox-label">Auto-fill today&apos;s date when lastmod is empty</span>
          </label>

          {mode === 'bulk' ? (
            <>
              <div className="options-label">Bulk URLs</div>
              <textarea
                className="textarea"
                value={bulkUrls}
                onChange={(event) => setBulkUrls(event.target.value)}
                placeholder="https://example.com/&#10;https://example.com/blog&#10;https://example.com/contact"
                style={{ minHeight: 180, marginBottom: 20 }}
              />
            </>
          ) : (
            <>
              <div className="options-label">Quick Row Presets</div>
              <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                <button type="button" className="mode-btn" onClick={() => setRows((current) => [...current, createRow({ priority: '1.0', changefreq: 'daily' })])}>
                  Homepage
                </button>
                <button type="button" className="mode-btn" onClick={() => setRows((current) => [...current, createRow({ priority: '0.8', changefreq: 'weekly' })])}>
                  Category
                </button>
                <button type="button" className="mode-btn" onClick={() => setRows((current) => [...current, createRow({ priority: '0.6', changefreq: 'monthly' })])}>
                  Page
                </button>
              </div>

              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                {rows.map((row, index) => (
                  <div
                    key={`row-${index}`}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <input
                      type="text"
                      className="textarea"
                      value={row.url}
                      placeholder="https://example.com/page"
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, url: event.target.value } : item
                          )
                        )
                      }
                      style={{ minHeight: 'auto', padding: '12px 14px' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                      <input
                        type="number"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        className="textarea"
                        value={row.priority}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, priority: event.target.value } : item
                            )
                          )
                        }
                        style={{ minHeight: 'auto', padding: '12px 14px' }}
                      />
                      <select
                        className="textarea"
                        value={row.changefreq}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, changefreq: event.target.value } : item
                            )
                          )
                        }
                        style={{ minHeight: 'auto', padding: '12px 14px' }}
                      >
                        <option value="always">Always</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <input
                        type="date"
                        className="textarea"
                        value={row.lastmod}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, lastmod: event.target.value } : item
                            )
                          )
                        }
                        style={{ minHeight: 'auto', padding: '12px 14px' }}
                        disabled={autoDates}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() =>
                        setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRows((current) => [...current, createRow()])}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
              >
                Add URL Row
              </button>
            </>
          )}

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setMode('manual');
        setAutoDates(true);
        setBulkUrls('');
        setRows([]);
      }}
      copyValue={output}
      downloadConfig={{
        filename: 'sitemap.xml',
        mimeType: 'application/xml;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
