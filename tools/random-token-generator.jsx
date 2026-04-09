'use client';

import { useEffect, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { generateRandomTokens } from '@/lib/security-network-utils';

const DEFAULT_OPTIONS = {
  byteLength: 32,
  format: 'hex',
  quantity: 5,
};

export default function RandomTokenGenerator() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copied, copy] = useCopyState();

  useEffect(() => {
    try {
      const nextTokens = generateRandomTokens(options);
      setTokens(nextTokens);
      setError(null);
    } catch (nextError) {
      setTokens([]);
      setError(nextError.message || 'Unable to generate tokens.');
    }
  }, [options]);

  const report = tokens.join('\n');

  const copyToken = async (token, index) => {
    await navigator.clipboard.writeText(token);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1200);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <ErrorCallout message={error} />

        <MetricGrid
          items={[
            {
              label: 'Bytes',
              value: String(options.byteLength),
              description: 'Random bytes per token',
              iconName: 'Hash',
            },
            {
              label: 'Format',
              value: options.format === 'alphanumeric' ? 'AlphaNum' : options.format.toUpperCase(),
              description: 'Current token encoding',
              iconName: 'Key',
            },
            {
              label: 'Quantity',
              value: String(options.quantity),
              description: 'Tokens in this batch',
              iconName: 'Layers',
            },
          ]}
          columns="repeat(3, minmax(0, 1fr))"
          marginBottom={16}
        />

        <div style={{ display: 'grid', gap: 10 }}>
          {tokens.map((token, index) => (
            <div
              key={`${token}-${index}`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 13,
                  color: 'var(--text)',
                  wordBreak: 'break-all',
                  flex: 1,
                }}
              >
                {token}
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => copyToken(token, index)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Icon icon={copiedIndex === index ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
                {copiedIndex === index ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Byte Length</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {[16, 32, 64, 128].map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.byteLength === value ? ' active' : ''}`}
              onClick={() => setOptions((current) => ({ ...current, byteLength: value }))}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="options-label">Format</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            ['hex', 'Hex'],
            ['base64', 'Base64'],
            ['alphanumeric', 'AlphaNum'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.format === value ? ' active' : ''}`}
              onClick={() => setOptions((current) => ({ ...current, format: value }))}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="options-label">Quantity</div>
        <div className="range-wrap" style={{ marginBottom: 20 }}>
          <input type="range" min="1" max="50" value={options.quantity} onChange={(event) => setOptions((current) => ({ ...current, quantity: Number(event.target.value) }))} />
          <span className="range-value">{options.quantity}</span>
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy All'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setOptions((current) => ({ ...current }))}
          >
            <Icon icon={ICON_MAP.Zap} size={13} />
            Regenerate
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setOptions(DEFAULT_OPTIONS)}
          >
            Reset
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'tokens.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">Generated locally with secure random bytes</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
