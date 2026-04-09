'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import {
  ErrorCallout,
  MetricGrid,
} from '@/tools/_shared/text-tool-kit';
import { generatePasswords, scorePassword } from '@/lib/security-network-utils';

const DEFAULT_OPTIONS = {
  length: 24,
  quantity: 5,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  excludeSimilar: false,
  customExclude: '',
};

export default function PasswordGenerator() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [passwords, setPasswords] = useState([]);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copied, copy] = useCopyState();

  useEffect(() => {
    try {
      const nextPasswords = generatePasswords(options);
      setPasswords(nextPasswords);
      setError(null);
    } catch (nextError) {
      setPasswords([]);
      setError(nextError.message || 'Unable to generate passwords.');
    }
  }, [options]);

  const averageScore = useMemo(() => {
    if (!passwords.length) return 0;
    return Math.round(
      passwords.reduce((total, password) => total + scorePassword(password).score, 0) / passwords.length
    );
  }, [passwords]);

  const averageCategory = scorePassword(passwords[0] || '').category;
  const report = passwords.join('\n');

  const copyPassword = async (password, index) => {
    await navigator.clipboard.writeText(password);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1200);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <ErrorCallout message={error} />

        {passwords.length ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Generated',
                  value: String(passwords.length),
                  description: 'Passwords in the current batch',
                  iconName: 'Key',
                },
                {
                  label: 'Length',
                  value: String(options.length),
                  description: 'Characters per password',
                  iconName: 'Type',
                },
                {
                  label: 'Strength',
                  value: `${averageScore}`,
                  description: averageCategory,
                  tone: averageScore >= 80 ? 'success' : averageScore >= 55 ? 'warning' : 'error',
                  iconName: 'ShieldCheck',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {passwords.map((password, index) => (
                <div
                  key={`${password}-${index}`}
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
                    {password}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => copyPassword(password, index)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icon icon={copiedIndex === index ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              minHeight: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              textAlign: 'center',
            }}
          >
            Select at least one character group to generate passwords.
          </div>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Length</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input type="range" min="8" max="128" value={options.length} onChange={(event) => setOptions((current) => ({ ...current, length: Number(event.target.value) }))} />
          <span className="range-value">{options.length}</span>
        </div>

        <div className="options-label">Quantity</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input type="range" min="1" max="20" value={options.quantity} onChange={(event) => setOptions((current) => ({ ...current, quantity: Number(event.target.value) }))} />
          <span className="range-value">{options.quantity}</span>
        </div>

        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {[
            ['uppercase', 'Uppercase letters'],
            ['lowercase', 'Lowercase letters'],
            ['digits', 'Digits'],
            ['symbols', 'Symbols'],
            ['excludeAmbiguous', 'Exclude ambiguous characters'],
            ['excludeSimilar', 'Exclude similar characters'],
          ].map(([key, label]) => (
            <label key={key} className="checkbox-row">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
              />
              <span className="checkbox-label">{label}</span>
            </label>
          ))}
        </div>

        <div className="options-label">Custom Exclude Characters</div>
        <input
          type="text"
          className="textarea"
          value={options.customExclude}
          onChange={(event) => setOptions((current) => ({ ...current, customExclude: event.target.value }))}
          placeholder="{}[]()"
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
        />

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
          onClick={() => downloadText(report, 'passwords.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">Generated locally with `crypto.getRandomValues`</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
