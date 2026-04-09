'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';

function buildHtaccess(config) {
  const blocks = [];

  if (config.forceHttps) {
    blocks.push([
      'RewriteEngine On',
      'RewriteCond %{HTTPS} !=on',
      'RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    ].join('\n'));
  }

  if (config.wwwToNonWww) {
    blocks.push([
      'RewriteEngine On',
      'RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]',
      'RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]',
    ].join('\n'));
  }

  if (config.custom404Path.trim()) {
    blocks.push(`ErrorDocument 404 ${config.custom404Path.trim()}`);
  }

  if (config.gzip) {
    blocks.push([
      '<IfModule mod_deflate.c>',
      '  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css application/xml application/xhtml+xml application/rss+xml application/javascript application/x-javascript application/json',
      '</IfModule>',
    ].join('\n'));
  }

  if (config.browserCaching) {
    blocks.push([
      '<IfModule mod_expires.c>',
      '  ExpiresActive On',
      '  ExpiresByType image/jpg "access plus 1 year"',
      '  ExpiresByType image/jpeg "access plus 1 year"',
      '  ExpiresByType image/gif "access plus 1 year"',
      '  ExpiresByType image/png "access plus 1 year"',
      '  ExpiresByType text/css "access plus 1 month"',
      '  ExpiresByType application/pdf "access plus 1 month"',
      '  ExpiresByType application/javascript "access plus 1 month"',
      '</IfModule>',
    ].join('\n'));
  }

  if (config.disableDirectoryListing) {
    blocks.push('Options -Indexes');
  }

  if (config.hotlinkProtection && config.hotlinkDomain.trim()) {
    blocks.push([
      'RewriteEngine On',
      'RewriteCond %{HTTP_REFERER} !^$ [NC]',
      `RewriteCond %{HTTP_REFERER} !^https?://(www\\.)?${config.hotlinkDomain.trim().replace(/\./g, '\\.')} [NC]`,
      'RewriteRule \\.(jpg|jpeg|png|gif|webp)$ - [F,NC,L]',
    ].join('\n'));
  }

  const blockedIps = config.blockedIps
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (blockedIps.length) {
    blocks.push([
      '<RequireAll>',
      '  Require all granted',
      ...blockedIps.map((ip) => `  Require not ip ${ip}`),
      '</RequireAll>',
    ].join('\n'));
  }

  return blocks.join('\n\n');
}

export default function HtaccessGenerator() {
  const [config, setConfig] = useState({
    forceHttps: true,
    wwwToNonWww: false,
    custom404Path: '/404.html',
    gzip: true,
    browserCaching: true,
    disableDirectoryListing: true,
    hotlinkProtection: false,
    hotlinkDomain: 'example.com',
    blockedIps: '',
  });

  const output = useMemo(() => buildHtaccess(config), [config]);
  const enabledSections = Object.entries(config).filter(([key, value]) => {
    if (typeof value === 'boolean') return value;
    if (key === 'custom404Path') return value.trim().length > 0;
    if (key === 'hotlinkDomain') return false;
    return value.trim().length > 0;
  }).length;

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!output}
      emptyState={
        <EmptyState
          iconName="Server"
          title="Assemble Apache rules visually"
          message="Enable redirects, compression, caching, and security blocks to generate a ready-to-paste `.htaccess` file."
        />
      }
      outputRenderer={
        output ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Enabled Blocks',
                  value: String(enabledSections),
                  description: 'Rule sections included in this file',
                  iconName: 'Layers',
                },
              ]}
              columns="1fr"
              marginBottom={16}
            />
            <div className="panel-label">Generated .htaccess</div>
            <textarea
              className="textarea"
              value={output}
              readOnly
              style={{ minHeight: 420 }}
            />
          </>
        ) : null
      }
      options={
        <>
          {[
            ['forceHttps', 'Force HTTPS'],
            ['wwwToNonWww', 'Redirect www to non-www'],
            ['gzip', 'Enable GZIP compression'],
            ['browserCaching', 'Enable browser caching'],
            ['disableDirectoryListing', 'Disable directory listing'],
            ['hotlinkProtection', 'Enable hotlink protection'],
          ].map(([key, label]) => (
            <label key={key} className="checkbox-row" style={{ marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={config[key]}
                onChange={(event) => setConfig((current) => ({ ...current, [key]: event.target.checked }))}
              />
              <span className="checkbox-label">{label}</span>
            </label>
          ))}

          <div className="options-label" style={{ marginTop: 8 }}>Custom 404 Path</div>
          <input
            type="text"
            className="textarea"
            value={config.custom404Path}
            onChange={(event) => setConfig((current) => ({ ...current, custom404Path: event.target.value }))}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          />

          {config.hotlinkProtection ? (
            <>
              <div className="options-label">Allowed Domain</div>
              <input
                type="text"
                className="textarea"
                value={config.hotlinkDomain}
                onChange={(event) => setConfig((current) => ({ ...current, hotlinkDomain: event.target.value }))}
                style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
              />
            </>
          ) : null}

          <div className="options-label">Blocked IPs</div>
          <textarea
            className="textarea"
            value={config.blockedIps}
            onChange={(event) => setConfig((current) => ({ ...current, blockedIps: event.target.value }))}
            placeholder="203.0.113.10&#10;198.51.100.24"
            style={{ minHeight: 120, marginBottom: 20 }}
          />

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setConfig({
          forceHttps: true,
          wwwToNonWww: false,
          custom404Path: '/404.html',
          gzip: true,
          browserCaching: true,
          disableDirectoryListing: true,
          hotlinkProtection: false,
          hotlinkDomain: 'example.com',
          blockedIps: '',
        });
      }}
      copyValue={output}
      downloadConfig={{
        filename: '.htaccess',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
