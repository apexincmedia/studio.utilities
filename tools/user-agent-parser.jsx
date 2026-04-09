'use client';

import { useEffect, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';
import {
  EmptyState,
  MetricGrid,
} from '@/tools/_shared/text-tool-kit';
import { parseUserAgentString } from '@/lib/security-network-utils';

export default function UserAgentParser() {
  const [mode, setMode] = useState('auto');
  const [input, setInput] = useState('');
  const [copied, copy] = useCopyState();

  useEffect(() => {
    if (mode === 'auto' && typeof navigator !== 'undefined') {
      setInput(navigator.userAgent);
    }
  }, [mode]);

  const parsed = useMemo(() => parseUserAgentString(input), [input]);
  const report = input
    ? [
        `Browser: ${parsed.browser} ${parsed.browserVersion}`,
        `OS: ${parsed.os} ${parsed.osVersion}`,
        `Device: ${parsed.deviceType}`,
        `Engine: ${parsed.engine}`,
        '',
        parsed.raw,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">User Agent String</div>
        <textarea
          className="textarea"
          value={input}
          onChange={(event) => {
            setMode('manual');
            setInput(event.target.value);
          }}
          placeholder="Paste a user agent string to parse…"
          style={{ minHeight: 160, marginBottom: 16 }}
        />

        {input ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Browser',
                  value: parsed.browser,
                  description: parsed.browserVersion,
                  iconName: 'Globe',
                },
                {
                  label: 'OS',
                  value: parsed.os,
                  description: parsed.osVersion,
                  iconName: 'Cpu',
                },
                {
                  label: 'Device',
                  value: parsed.deviceType,
                  description: parsed.engine,
                  iconName: 'Layers',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                padding: '14px 16px',
                fontSize: 12,
                color: 'var(--muted)',
                lineHeight: 1.7,
                wordBreak: 'break-word',
              }}
            >
              {parsed.raw}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Globe"
            title="Parse browsers, devices, and engines from any UA string"
            message="Auto-detect your current user agent or paste a custom one to identify browser version, OS family, device type, and rendering engine."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Mode</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          <button type="button" className={`mode-btn${mode === 'auto' ? ' active' : ''}`} onClick={() => setMode('auto')}>
            Auto-Detect
          </button>
          <button type="button" className={`mode-btn${mode === 'manual' ? ' active' : ''}`} onClick={() => setMode('manual')}>
            Manual
          </button>
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Report'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setMode('auto');
              if (typeof navigator !== 'undefined') {
                setInput(navigator.userAgent);
              }
            }}
          >
            Use Current UA
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setMode('manual');
              setInput('');
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'user-agent-report.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">Parsing happens locally from the raw UA string only</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
