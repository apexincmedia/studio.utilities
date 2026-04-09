'use client';

import { useMemo, useState } from 'react';
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
import { scorePassword } from '@/lib/security-network-utils';

export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [copied, copy] = useCopyState();

  const analysis = useMemo(() => scorePassword(password), [password]);
  const report = password
    ? [
        `Score: ${analysis.score}`,
        `Category: ${analysis.category}`,
        '',
        ...analysis.suggestions.map((item) => `- ${item}`),
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Password</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type={visible ? 'text' : 'password'}
            className="textarea"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Type a password to analyze…"
            style={{ minHeight: 'auto', padding: '12px 14px', flex: 1 }}
          />
          <button type="button" className="btn-ghost" onClick={() => setVisible((current) => !current)}>
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>

        {!password ? (
          <EmptyState
            iconName="ShieldCheck"
            title="Check how strong a password really is"
            message="Type any password to score its length, variety, and common-pattern risks, then get specific improvement suggestions."
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Score',
                  value: `${analysis.score}`,
                  description: '0 to 100 password strength score',
                  tone: analysis.score >= 80 ? 'success' : analysis.score >= 55 ? 'warning' : 'error',
                  iconName: 'ShieldCheck',
                },
                {
                  label: 'Category',
                  value: analysis.category,
                  description: 'Overall strength classification',
                  iconName: 'Key',
                },
                {
                  label: 'Length',
                  value: String(analysis.checks.length),
                  description: 'Total characters in the password',
                  iconName: 'Type',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {analysis.suggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: '14px 16px',
                    fontSize: 13,
                    color: 'var(--text)',
                    lineHeight: 1.6,
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Checks happen locally against length, character variety, common password patterns, and simple keyboard sequences.
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Analysis'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? 'Mask Password' : 'Reveal Password'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setPassword('');
              setVisible(false);
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'password-strength.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
