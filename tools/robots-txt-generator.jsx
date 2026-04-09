'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';

function createSection(agent = '*') {
  return {
    agent,
    allow: '',
    disallow: '',
    crawlDelay: '',
  };
}

function splitLines(value = '') {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildRobotsText(sections, sitemapUrl) {
  const sectionBlocks = sections
    .map((section) => {
      const lines = [];
      if (!section.agent.trim()) return '';

      lines.push(`User-agent: ${section.agent.trim()}`);
      splitLines(section.allow).forEach((entry) => lines.push(`Allow: ${entry}`));
      splitLines(section.disallow).forEach((entry) => lines.push(`Disallow: ${entry}`));

      if (section.crawlDelay.trim()) {
        lines.push(`Crawl-delay: ${section.crawlDelay.trim()}`);
      }

      return lines.join('\n');
    })
    .filter(Boolean);

  if (sitemapUrl.trim()) {
    sectionBlocks.push(`Sitemap: ${sitemapUrl.trim()}`);
  }

  return sectionBlocks.join('\n\n');
}

function getAiCrawlerPreset() {
  return ['GPTBot', 'ChatGPT-User', 'Claude-Web', 'CCBot', 'Google-Extended', 'PerplexityBot'].map(
    (agent) => ({
      agent,
      allow: '',
      disallow: '/',
      crawlDelay: '',
    })
  );
}

export default function RobotsTxtGenerator() {
  const [sections, setSections] = useState([]);
  const [sitemapUrl, setSitemapUrl] = useState('');

  const output = useMemo(() => buildRobotsText(sections, sitemapUrl), [sections, sitemapUrl]);
  const directiveCount = sections.reduce(
    (count, section) =>
      count +
      splitLines(section.allow).length +
      splitLines(section.disallow).length +
      (section.crawlDelay.trim() ? 1 : 0),
    0
  );

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!output}
      emptyState={
        <EmptyState
          iconName="Server"
          title="Build a robots.txt file visually"
          message="Add crawler sections, set allow and disallow rules, and include your sitemap URL to generate a ready-to-download robots.txt file."
        />
      }
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'Sections',
                value: String(sections.length),
                description: 'Crawler rule groups in the file',
                iconName: 'Layers',
              },
              {
                label: 'Directives',
                value: String(directiveCount),
                description: 'Allow, disallow, and crawl-delay rules',
                iconName: 'List',
              },
              {
                label: 'Sitemap',
                value: sitemapUrl.trim() ? 'Included' : 'None',
                description: 'XML sitemap reference at the bottom',
                iconName: 'Globe',
              },
            ]}
            columns="repeat(3, minmax(0, 1fr))"
            marginBottom={16}
          />

          <div className="panel-label">Generated robots.txt</div>
          <textarea className="textarea" value={output} readOnly style={{ minHeight: 360 }} />
        </>
      }
      options={
        <>
          <div className="options-label">Quick Presets</div>
          <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            <button type="button" className="mode-btn" onClick={() => setSections([{ agent: '*', allow: '/', disallow: '', crawlDelay: '' }])}>
              Allow All
            </button>
            <button type="button" className="mode-btn" onClick={() => setSections([{ agent: '*', allow: '', disallow: '/', crawlDelay: '' }])}>
              Block All
            </button>
            <button type="button" className="mode-btn" onClick={() => setSections(getAiCrawlerPreset())}>
              Block AI Crawlers
            </button>
          </div>

          <div className="options-label">Crawler Sections</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {sections.map((section, index) => (
              <div
                key={`${section.agent}-${index}`}
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
                  value={section.agent}
                  placeholder="User-agent"
                  onChange={(event) =>
                    setSections((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, agent: event.target.value } : item
                      )
                    )
                  }
                  style={{ minHeight: 'auto', padding: '12px 14px' }}
                />
                <textarea
                  className="textarea"
                  value={section.allow}
                  placeholder="Allowed paths, one per line"
                  onChange={(event) =>
                    setSections((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, allow: event.target.value } : item
                      )
                    )
                  }
                  style={{ minHeight: 72 }}
                />
                <textarea
                  className="textarea"
                  value={section.disallow}
                  placeholder="Disallowed paths, one per line"
                  onChange={(event) =>
                    setSections((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, disallow: event.target.value } : item
                      )
                    )
                  }
                  style={{ minHeight: 72 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    className="textarea"
                    value={section.crawlDelay}
                    placeholder="Crawl-delay"
                    onChange={(event) =>
                      setSections((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, crawlDelay: event.target.value } : item
                        )
                      )
                    }
                    style={{ minHeight: 'auto', padding: '12px 14px', flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() =>
                      setSections((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => setSections((current) => [...current, createSection('*')])}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
          >
            Add Section
          </button>

          <div className="options-label">Sitemap URL</div>
          <input
            type="text"
            className="textarea"
            value={sitemapUrl}
            onChange={(event) => setSitemapUrl(event.target.value)}
            placeholder="https://example.com/sitemap.xml"
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setSections([]);
        setSitemapUrl('');
      }}
      copyValue={output}
      downloadConfig={{
        filename: 'robots.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
