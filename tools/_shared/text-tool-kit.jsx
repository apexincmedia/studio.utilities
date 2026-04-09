'use client';

import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';

export function ToolSectionDivider({ label = 'Output' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '4px 0 16px',
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

export function TextStatLine({ items = [], marginBottom = 16 }) {
  if (!items.length) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom,
        fontSize: 11,
        color: 'var(--faint)',
      }}
    >
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export function ErrorCallout({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        background: 'var(--error-bg)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        marginBottom: 16,
      }}
    >
      <Icon
        icon={ICON_MAP.AlertCircle}
        size={15}
        color="var(--error)"
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <span style={{ fontSize: 12, color: 'var(--error)', lineHeight: 1.5 }}>
        {message}
      </span>
    </div>
  );
}

export function EmptyState({
  iconName = 'Type',
  title = 'Nothing to show yet',
  message = 'Add some input to see the result.',
}) {
  return (
    <div
      style={{
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        textAlign: 'center',
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
        <Icon icon={ICON_MAP[iconName] ?? ICON_MAP.Type} size={24} />
      </div>
      <div style={{ fontSize: 14, color: 'var(--text)' }}>{title}</div>
      <div style={{ maxWidth: 360, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        {message}
      </div>
    </div>
  );
}

export function MetricGrid({
  items = [],
  columns = 'repeat(3, minmax(0, 1fr))',
  marginBottom = 0,
}) {
  if (!items.length) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        gap: 12,
        marginBottom,
      }}
    >
      {items.map((item) => (
        <MetricCard key={item.label} {...item} />
      ))}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  description,
  tone = 'default',
  align = 'left',
  iconName,
}) {
  const toneStyles = {
    default: {
      background: 'var(--surface)',
      border: 'var(--border)',
      valueColor: 'var(--text)',
    },
    success: {
      background: 'var(--success-bg)',
      border: 'var(--success)',
      valueColor: 'var(--text)',
    },
    warning: {
      background: 'var(--warning-bg)',
      border: 'var(--warning)',
      valueColor: 'var(--text)',
    },
    error: {
      background: 'var(--error-bg)',
      border: 'var(--error)',
      valueColor: 'var(--text)',
    },
  };

  const palette = toneStyles[tone] ?? toneStyles.default;

  return (
    <div
      style={{
        background: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
        textAlign: align,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {label}
        </div>
        {iconName ? (
          <Icon icon={ICON_MAP[iconName] ?? ICON_MAP.Type} size={14} color="var(--text-dim)" />
        ) : null}
      </div>
      <div
        style={{
          fontSize: 24,
          color: palette.valueColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {description ? (
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

function ActionsPanel({
  options,
  primaryAction,
  extraActions,
  copyValue,
  copyLabel = 'Copy',
  clearLabel = 'Clear',
  onClear,
  downloadConfig,
  privacyNote,
}) {
  const [copied, copy] = useCopyState();
  const canCopy = Boolean(copyValue);
  const canDownload = Boolean(downloadConfig && (downloadConfig.enabled ?? copyValue));

  return (
    <OptionsPanel>
      {options}

      {primaryAction ? (
        <button
          type="button"
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          <Icon icon={ICON_MAP[primaryAction.iconName ?? 'Zap']} size={14} />
          {primaryAction.label}
        </button>
      ) : null}

      {extraActions}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}
          onClick={() => copy(copyValue)}
          disabled={!canCopy}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : copyLabel}
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={onClear}
          style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
        >
          {clearLabel}
        </button>
      </div>

      {downloadConfig ? (
        <button
          type="button"
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => {
            if (downloadConfig.onDownload) {
              downloadConfig.onDownload();
              return;
            }

            downloadText(
              downloadConfig.text ?? copyValue ?? '',
              downloadConfig.filename ?? 'output.txt',
              downloadConfig.mimeType ?? 'text/plain;charset=utf-8'
            );
          }}
          disabled={!canDownload}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          {downloadConfig.label ?? 'Download'}
        </button>
      ) : null}

      <div className="privacy-note">
        {privacyNote ?? '100% client-side · your data never leaves this device'}
      </div>
    </OptionsPanel>
  );
}

export function TextTransformTool({
  input,
  onInputChange,
  inputLabel = 'Input',
  inputPlaceholder = 'Paste or type here…',
  inputStats,
  inputRenderer,
  outputLabel = 'Output',
  outputPlaceholder = 'Output will appear here…',
  output,
  outputStats,
  outputRenderer,
  dividerLabel = 'Output',
  error,
  showEmptyState = false,
  emptyState,
  inputMinHeight = 220,
  outputMinHeight = 220,
  options,
  primaryAction,
  extraActions,
  onClear,
  copyValue,
  copyLabel,
  clearLabel,
  downloadConfig,
  privacyNote,
}) {
  return (
    <ToolLayout>
      <OutputPanel>
        {inputRenderer ?? (
          <>
            <div className="panel-label">{inputLabel}</div>
            <textarea
              className="textarea"
              placeholder={inputPlaceholder}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              style={{ minHeight: inputMinHeight, marginBottom: 8 }}
            />
            {inputStats}
          </>
        )}

        {dividerLabel ? <ToolSectionDivider label={dividerLabel} /> : null}

        <ErrorCallout message={error} />

        {showEmptyState
          ? emptyState
          : outputRenderer ?? (
              <>
                <div className="panel-label">{outputLabel}</div>
                <textarea
                  className="textarea"
                  placeholder={outputPlaceholder}
                  value={output}
                  readOnly
                  style={{ minHeight: outputMinHeight }}
                />
                {outputStats}
              </>
            )}
      </OutputPanel>

      <ActionsPanel
        options={options}
        primaryAction={primaryAction}
        extraActions={extraActions}
        copyValue={copyValue ?? output}
        copyLabel={copyLabel}
        clearLabel={clearLabel}
        onClear={onClear}
        downloadConfig={downloadConfig}
        privacyNote={privacyNote}
      />
    </ToolLayout>
  );
}

export function TextGeneratorTool({
  output,
  outputLabel = 'Generated Output',
  outputPlaceholder = 'Generated output will appear here…',
  outputStats,
  outputRenderer,
  showEmptyState = false,
  emptyState,
  options,
  primaryAction,
  extraActions,
  onClear,
  copyValue,
  copyLabel,
  clearLabel,
  downloadConfig,
  privacyNote,
}) {
  return (
    <ToolLayout>
      <OutputPanel>
        {showEmptyState ? (
          emptyState
        ) : outputRenderer ? (
          outputRenderer
        ) : (
          <>
            <div className="panel-label">{outputLabel}</div>
            <textarea
              className="textarea"
              placeholder={outputPlaceholder}
              value={output}
              readOnly
              style={{ minHeight: 420, marginBottom: 8 }}
            />
            {outputStats}
          </>
        )}
      </OutputPanel>

      <ActionsPanel
        options={options}
        primaryAction={primaryAction}
        extraActions={extraActions}
        copyValue={copyValue ?? output}
        copyLabel={copyLabel}
        clearLabel={clearLabel}
        onClear={onClear}
        downloadConfig={downloadConfig}
        privacyNote={privacyNote}
      />
    </ToolLayout>
  );
}
