'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import { escapeHtml, ensureUrlProtocol, getDomainFromUrl } from '@/lib/seo-web-utils';

function getLengthTone(count, warningLimit, errorLimit) {
  if (count > errorLimit) return 'error';
  if (count > warningLimit) return 'warning';
  return 'success';
}

function buildMetaMarkup(config) {
  const canonicalUrl = ensureUrlProtocol(config.canonicalUrl);
  const pageUrl = canonicalUrl || ensureUrlProtocol(config.url);
  const tags = [];

  tags.push(`<meta charset="${escapeHtml(config.charset)}">`);

  if (config.title.trim()) {
    tags.push(`<title>${escapeHtml(config.title.trim())}</title>`);
  }

  if (config.description.trim()) {
    tags.push(`<meta name="description" content="${escapeHtml(config.description.trim())}">`);
  }

  if (config.keywords.trim()) {
    tags.push(`<meta name="keywords" content="${escapeHtml(config.keywords.trim())}">`);
  }

  if (config.author.trim()) {
    tags.push(`<meta name="author" content="${escapeHtml(config.author.trim())}">`);
  }

  tags.push(`<meta name="robots" content="${escapeHtml(config.robots)}">`);
  tags.push(`<meta name="viewport" content="${escapeHtml(config.viewport)}">`);

  if (canonicalUrl) {
    tags.push(`<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`);
  }

  if (config.title.trim()) {
    tags.push(`<meta property="og:title" content="${escapeHtml(config.title.trim())}">`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(config.title.trim())}">`);
  }

  if (config.description.trim()) {
    tags.push(`<meta property="og:description" content="${escapeHtml(config.description.trim())}">`);
    tags.push(`<meta name="twitter:description" content="${escapeHtml(config.description.trim())}">`);
  }

  tags.push(`<meta property="og:type" content="${escapeHtml(config.ogType)}">`);
  tags.push(`<meta name="twitter:card" content="${escapeHtml(config.twitterCard)}">`);

  if (config.siteName.trim()) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(config.siteName.trim())}">`);
  }

  if (pageUrl) {
    tags.push(`<meta property="og:url" content="${escapeHtml(pageUrl)}">`);
    tags.push(`<meta name="twitter:url" content="${escapeHtml(pageUrl)}">`);
  }

  if (config.imageUrl.trim()) {
    const imageUrl = ensureUrlProtocol(config.imageUrl) || config.imageUrl.trim();
    tags.push(`<meta property="og:image" content="${escapeHtml(imageUrl)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`);
  }

  return tags.join('\n');
}

export default function MetaTagGenerator() {
  const [config, setConfig] = useState({
    title: '',
    description: '',
    keywords: '',
    author: '',
    robots: 'index, follow',
    viewport: 'width=device-width, initial-scale=1',
    charset: 'UTF-8',
    canonicalUrl: '',
    url: '',
    siteName: '',
    imageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
  });

  const output = useMemo(() => buildMetaMarkup(config), [config]);
  const hasInput = Boolean(
    config.title.trim() ||
      config.description.trim() ||
      config.canonicalUrl.trim() ||
      config.url.trim() ||
      config.siteName.trim() ||
      config.imageUrl.trim()
  );
  const titleLength = config.title.trim().length;
  const descriptionLength = config.description.trim().length;
  const canonicalPreview = ensureUrlProtocol(config.canonicalUrl) || ensureUrlProtocol(config.url);
  const domain = getDomainFromUrl(canonicalPreview);

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!hasInput}
      emptyState={
        <EmptyState
          iconName="Search"
          title="Generate complete meta tags for a page"
          message="Add your page title, description, canonical URL, and social fields to produce standard SEO, Open Graph, and Twitter tags."
        />
      }
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'Title Length',
                value: String(titleLength),
                description: 'Aim for roughly 50-60 characters',
                tone: getLengthTone(titleLength, 60, 70),
                iconName: 'Type',
              },
              {
                label: 'Description',
                value: String(descriptionLength),
                description: 'Aim for roughly 140-160 characters',
                tone: getLengthTone(descriptionLength, 160, 180),
                iconName: 'FileText',
              },
              {
                label: 'Domain',
                value: domain || 'Not set',
                description: 'Search preview source domain',
                iconName: 'Globe',
              },
            ]}
            columns="repeat(3, minmax(0, 1fr))"
            marginBottom={16}
          />

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 20, color: 'var(--accent)', marginBottom: 6 }}>
              {config.title.trim() || 'Your page title will appear here'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>
              {(canonicalPreview || 'https://example.com').replace(/\/$/, '')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              {config.description.trim() || 'Your meta description preview will appear here once you add one.'}
            </div>
          </div>

          <div className="panel-label">Generated HTML</div>
          <textarea className="textarea" value={output} readOnly style={{ minHeight: 360 }} />
        </>
      }
      options={
        <>
          <div className="options-label">Core SEO</div>
          {[
            ['title', 'Page Title'],
            ['description', 'Meta Description'],
            ['keywords', 'Keywords'],
            ['author', 'Author'],
            ['canonicalUrl', 'Canonical URL'],
            ['url', 'Page URL'],
            ['siteName', 'Site Name'],
            ['imageUrl', 'Social Image URL'],
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

          <div className="options-label">Robots</div>
          <select
            className="textarea"
            value={config.robots}
            onChange={(event) => setConfig((current) => ({ ...current, robots: event.target.value }))}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }}
          >
            <option value="index, follow">Index, Follow</option>
            <option value="noindex, follow">Noindex, Follow</option>
            <option value="index, nofollow">Index, Nofollow</option>
            <option value="noindex, nofollow">Noindex, Nofollow</option>
          </select>

          <div className="options-label">Viewport</div>
          <input
            type="text"
            className="textarea"
            value={config.viewport}
            onChange={(event) => setConfig((current) => ({ ...current, viewport: event.target.value }))}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }}
          />

          <div className="options-label">Charset</div>
          <input
            type="text"
            className="textarea"
            value={config.charset}
            onChange={(event) => setConfig((current) => ({ ...current, charset: event.target.value }))}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }}
          />

          <div className="options-label">Open Graph Type</div>
          <select
            className="textarea"
            value={config.ogType}
            onChange={(event) => setConfig((current) => ({ ...current, ogType: event.target.value }))}
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
          keywords: '',
          author: '',
          robots: 'index, follow',
          viewport: 'width=device-width, initial-scale=1',
          charset: 'UTF-8',
          canonicalUrl: '',
          url: '',
          siteName: '',
          imageUrl: '',
          ogType: 'website',
          twitterCard: 'summary_large_image',
        })
      }
      copyValue={output}
      downloadConfig={{
        filename: 'meta-tags.html',
        mimeType: 'text/html;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
