'use client';

import { useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import { escapeHtml, ensureUrlProtocol, getDomainFromUrl } from '@/lib/seo-web-utils';

function buildOgMarkup(config) {
  const url = ensureUrlProtocol(config.url);
  const imageUrl = ensureUrlProtocol(config.imageUrl) || config.imageUrl.trim();
  const tags = [];

  if (config.title.trim()) {
    tags.push(`<meta property="og:title" content="${escapeHtml(config.title.trim())}">`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(config.title.trim())}">`);
  }

  if (config.description.trim()) {
    tags.push(`<meta property="og:description" content="${escapeHtml(config.description.trim())}">`);
    tags.push(`<meta name="twitter:description" content="${escapeHtml(config.description.trim())}">`);
  }

  if (url) {
    tags.push(`<meta property="og:url" content="${escapeHtml(url)}">`);
    tags.push(`<meta name="twitter:url" content="${escapeHtml(url)}">`);
  }

  if (config.siteName.trim()) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(config.siteName.trim())}">`);
  }

  if (imageUrl) {
    tags.push(`<meta property="og:image" content="${escapeHtml(imageUrl)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`);
  }

  tags.push(`<meta property="og:type" content="${escapeHtml(config.type)}">`);
  tags.push(`<meta name="twitter:card" content="${escapeHtml(config.twitterCard)}">`);

  return tags.join('\n');
}

export default function OgTagGenerator() {
  const [config, setConfig] = useState({
    title: '',
    description: '',
    imageUrl: '',
    url: '',
    siteName: '',
    type: 'website',
    twitterCard: 'summary_large_image',
  });

  const output = useMemo(() => buildOgMarkup(config), [config]);
  const hasInput = Boolean(config.title.trim() || config.description.trim() || config.url.trim());
  const domain = getDomainFromUrl(config.url);

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!hasInput}
      emptyState={
        <EmptyState
          iconName="Globe"
          title="Preview how your page looks when shared"
          message="Fill in the Open Graph and Twitter Card fields to generate share tags and render a social preview card."
        />
      }
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'Card Type',
                value: config.twitterCard === 'summary' ? 'Summary' : 'Large Image',
                description: 'Twitter Card style in the output',
                iconName: 'Image',
              },
              {
                label: 'Domain',
                value: domain || 'Not set',
                description: 'Preview source domain',
                iconName: 'Globe',
              },
              {
                label: 'Type',
                value: config.type,
                description: 'Open Graph content type',
                iconName: 'Layers',
              },
            ]}
            columns="repeat(3, minmax(0, 1fr))"
            marginBottom={16}
          />

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'var(--surface)',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: 210,
                background: config.imageUrl.trim()
                  ? `center / cover no-repeat url(${config.imageUrl.trim()})`
                  : 'linear-gradient(135deg, var(--surface) 0%, var(--bg-elevated) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)',
              }}
            >
              {!config.imageUrl.trim() ? <Icon icon={ICON_MAP.Image} size={28} /> : null}
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                {domain || 'example.com'}
              </div>
              <div style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
                {config.title.trim() || 'Shared page title preview'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                {config.description.trim() || 'Your Open Graph description will appear here when shared on social media platforms.'}
              </div>
            </div>
          </div>

          <div className="panel-label">Generated Tags</div>
          <textarea className="textarea" value={output} readOnly style={{ minHeight: 280 }} />
        </>
      }
      options={
        <>
          {[
            ['title', 'Title'],
            ['description', 'Description'],
            ['imageUrl', 'Image URL'],
            ['url', 'Page URL'],
            ['siteName', 'Site Name'],
          ].map(([key, label]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div className="options-label">{label}</div>
              {key === 'description' ? (
                <textarea
                  className="textarea"
                  value={config[key]}
                  onChange={(event) => setConfig((current) => ({ ...current, [key]: event.target.value }))}
                  style={{ minHeight: 90 }}
                />
              ) : (
                <input
                  type="text"
                  className="textarea"
                  value={config[key]}
                  onChange={(event) => setConfig((current) => ({ ...current, [key]: event.target.value }))}
                  style={{ minHeight: 'auto', padding: '12px 14px' }}
                />
              )}
            </div>
          ))}

          <div className="options-label">Open Graph Type</div>
          <select
            className="textarea"
            value={config.type}
            onChange={(event) => setConfig((current) => ({ ...current, type: event.target.value }))}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }}
          >
            <option value="website">Website</option>
            <option value="article">Article</option>
            <option value="product">Product</option>
          </select>

          <div className="options-label">Twitter Card</div>
          <select
            className="textarea"
            value={config.twitterCard}
            onChange={(event) => setConfig((current) => ({ ...current, twitterCard: event.target.value }))}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          >
            <option value="summary_large_image">Summary Large Image</option>
            <option value="summary">Summary</option>
          </select>

          <div className="panel-divider" />
        </>
      }
      onClear={() =>
        setConfig({
          title: '',
          description: '',
          imageUrl: '',
          url: '',
          siteName: '',
          type: 'website',
          twitterCard: 'summary_large_image',
        })
      }
      copyValue={output}
      downloadConfig={{
        filename: 'og-tags.html',
        mimeType: 'text/html;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
