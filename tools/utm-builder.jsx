'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  ErrorCallout,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import { ensureUrlProtocol } from '@/lib/seo-web-utils';

function buildTaggedUrl(config) {
  if (!config.baseUrl.trim()) {
    return { output: '', error: null };
  }

  const normalizedBaseUrl = ensureUrlProtocol(config.baseUrl);
  if (!normalizedBaseUrl) {
    return { output: '', error: 'Enter a valid page URL before adding campaign parameters.' };
  }

  if (!config.source.trim() || !config.medium.trim() || !config.campaign.trim()) {
    return { output: '', error: null };
  }

  const url = new URL(normalizedBaseUrl);
  const params = {
    utm_source: config.source.trim(),
    utm_medium: config.medium.trim(),
    utm_campaign: config.campaign.trim(),
    utm_term: config.term.trim(),
    utm_content: config.content.trim(),
  };

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return { output: url.toString(), error: null };
}

export default function UtmBuilder() {
  const [config, setConfig] = useState({
    baseUrl: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });

  const result = useMemo(() => buildTaggedUrl(config), [config]);
  const hasRequired = Boolean(
    config.baseUrl.trim() &&
      config.source.trim() &&
      config.medium.trim() &&
      config.campaign.trim()
  );

  return (
    <TextGeneratorTool
      output={result.output}
      showEmptyState={!hasRequired && !result.error}
      emptyState={
        <EmptyState
          iconName="Link2"
          title="Build campaign-tracked URLs"
          message="Add a destination URL plus source, medium, and campaign values to generate a clean UTM-tagged link for analytics tracking."
        />
      }
      outputRenderer={
        result.error ? (
          <ErrorCallout message={result.error} />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Length',
                  value: result.output ? String(result.output.length) : '0',
                  description: result.output && result.output.length > 2000 ? 'This URL is getting long for some channels' : 'Total URL length including query parameters',
                  tone: result.output && result.output.length > 2000 ? 'warning' : 'default',
                  iconName: 'Type',
                },
                {
                  label: 'UTM Params',
                  value: String(
                    ['source', 'medium', 'campaign', 'term', 'content'].filter((key) => config[key].trim()).length
                  ),
                  description: 'Tracking values currently included',
                  iconName: 'List',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                marginBottom: 16,
                fontSize: 14,
                color: 'var(--text)',
                lineHeight: 1.7,
                wordBreak: 'break-word',
              }}
            >
              {result.output || 'Complete the required fields to generate a UTM URL.'}
            </div>

            <div className="panel-label">Tagged URL</div>
            <textarea className="textarea" value={result.output} readOnly style={{ minHeight: 220 }} />
          </>
        )
      }
      options={
        <>
          <div className="options-label">Quick Presets</div>
          <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            <button type="button" className="mode-btn" onClick={() => setConfig((current) => ({ ...current, source: 'google', medium: 'cpc' }))}>
              Google Ads
            </button>
            <button type="button" className="mode-btn" onClick={() => setConfig((current) => ({ ...current, source: 'newsletter', medium: 'email' }))}>
              Newsletter
            </button>
            <button type="button" className="mode-btn" onClick={() => setConfig((current) => ({ ...current, source: 'linkedin', medium: 'social' }))}>
              LinkedIn
            </button>
          </div>

          {[
            ['baseUrl', 'Base URL'],
            ['source', 'UTM Source'],
            ['medium', 'UTM Medium'],
            ['campaign', 'UTM Campaign'],
            ['term', 'UTM Term'],
            ['content', 'UTM Content'],
          ].map(([key, label]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div className="options-label">{label}</div>
              <input
                type="text"
                className="textarea"
                value={config[key]}
                onChange={(event) => setConfig((current) => ({ ...current, [key]: event.target.value }))}
                style={{ minHeight: 'auto', padding: '12px 14px' }}
                placeholder={key === 'baseUrl' ? 'https://example.com/landing-page' : ''}
              />
            </div>
          ))}

          <div className="panel-divider" />
        </>
      }
      onClear={() =>
        setConfig({
          baseUrl: '',
          source: '',
          medium: '',
          campaign: '',
          term: '',
          content: '',
        })
      }
      copyValue={result.output}
      downloadConfig={{
        filename: 'utm-link.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
