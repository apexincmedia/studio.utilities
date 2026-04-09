'use client';

import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { useCopyState } from '@/lib/tool-utils';

export function CalculatorField({ label, children, help }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="panel-label" style={{ marginBottom: 10 }}>
        {label}
      </div>
      {children}
      {help ? (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--faint)', lineHeight: 1.6 }}>
          {help}
        </div>
      ) : null}
    </div>
  );
}

export function CalculatorInput(props) {
  return (
    <input
      {...props}
      className="textarea"
      style={{
        minHeight: 'auto',
        padding: '12px 14px',
        ...(props.style || {}),
      }}
    />
  );
}

export function CalculatorSelect(props) {
  return (
    <select
      {...props}
      className="textarea"
      style={{
        minHeight: 'auto',
        padding: '12px 14px',
        ...(props.style || {}),
      }}
    />
  );
}

export function CalculatorSectionDivider({ label = 'Results' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '4px 0 20px',
        color: 'var(--faint)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}
    >
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <Icon icon={ICON_MAP.ChevronDown} size={14} />
      {label}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

export function CalculatorPrimaryResult({ label, value, detail }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 24px',
        textAlign: 'center',
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 34, color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      {detail ? (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function CalculatorStatGrid({ items = [], columns = 'repeat(2, minmax(0, 1fr))' }) {
  if (!items.length) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: columns, gap: 12 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: item.tone === 'success' ? 'var(--success-bg)' : item.tone === 'warning' ? 'var(--warning-bg)' : 'var(--surface)',
            border: `1px solid ${item.tone === 'success' ? 'var(--success)' : item.tone === 'warning' ? 'var(--warning)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            {item.label}
          </div>
          <div style={{ fontSize: 22, color: 'var(--text)', lineHeight: 1.2 }}>{item.value}</div>
          {item.detail ? (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {item.detail}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function CalculatorEmptyState({ iconName = 'Calculator', title, message }) {
  return (
    <div
      style={{
        minHeight: 260,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 10,
        color: 'var(--faint)',
        padding: '24px 12px',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
        }}
      >
        <Icon icon={ICON_MAP[iconName] ?? ICON_MAP.Calculator} size={24} />
      </div>
      <div style={{ fontSize: 14, color: 'var(--text)' }}>{title}</div>
      <div style={{ maxWidth: 360, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        {message}
      </div>
    </div>
  );
}

export function CalculatorNotice({ tone = 'default', message, iconName }) {
  const palette =
    tone === 'error'
      ? { background: 'var(--error-bg)', border: 'var(--error)', color: 'var(--text)' }
      : tone === 'warning'
        ? { background: 'var(--warning-bg)', border: 'var(--warning)', color: 'var(--text)' }
        : { background: 'var(--surface)', border: 'var(--border)', color: 'var(--muted)' };
  const resolvedIcon =
    iconName || (tone === 'error' ? 'AlertCircle' : tone === 'warning' ? 'Info' : null);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        background: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        fontSize: 12,
        color: palette.color,
        lineHeight: 1.7,
      }}
    >
      {resolvedIcon ? (
        <Icon
          icon={ICON_MAP[resolvedIcon] ?? ICON_MAP.Info}
          size={14}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
      ) : null}
      <div>{message}</div>
    </div>
  );
}

export function CalculatorShell({
  children,
  options,
  copyValue = '',
  onClear,
  clearLabel = 'Clear',
  copyLabel = 'Copy Result',
  privacyNote,
}) {
  const [copied, copy] = useCopyState();

  return (
    <ToolLayout>
      {children}
      <OptionsPanel>
        {options}
        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
          onClick={() => copy(copyValue)}
          disabled={!copyValue}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : copyLabel}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          onClick={onClear}
        >
          {clearLabel}
        </button>

        <div className="privacy-note">
          {privacyNote ?? '100% client-side · your calculations stay on this device'}
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}

export { OutputPanel };
