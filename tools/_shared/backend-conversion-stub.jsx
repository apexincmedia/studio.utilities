'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { formatBytes } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

function IntegrationModal({ open, title, message, endpoint, onClose }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--bg) 72%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 40,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          boxShadow: '0 18px 60px color-mix(in srgb, var(--bg) 80%, transparent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon icon={ICON_MAP.AlertTriangle} size={18} color="var(--warning)" />
          </div>

          <div>
            <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{message}</div>
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            padding: 14,
            fontSize: 12,
            color: 'var(--text-dim)',
            marginBottom: 16,
          }}
        >
          Ready for backend integration at <strong>{endpoint}</strong>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onClose}
        >
          <Icon icon={ICON_MAP.Check} size={14} />
          Close
        </button>
      </div>
    </div>
  );
}

export default function BackendConversionStub({
  accept,
  actionLabel = 'Convert',
  endpoint,
  fileLabel = 'File',
  iconName = 'FileText',
  inspectFile,
  integrationMessage,
  modalTitle = 'Backend integration needed',
  optionsContent = null,
  privacyNote = '',
  subtitle,
  title,
}) {
  const [file, setFile] = useState(null);
  const [details, setDetails] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    setProcessing(true);
    setError(null);

    try {
      const inspected = inspectFile ? await inspectFile(nextFile) : {};
      setFile(nextFile);
      setDetails(inspected || {});
      setModalOpen(false);
    } catch (loadError) {
      setFile(null);
      setDetails(null);
      setError(loadError.message || 'Unable to inspect that file yet.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setDetails(null);
    setProcessing(false);
    setError(null);
    setModalOpen(false);
  };

  const metricItems = file
    ? [
        {
          label: fileLabel,
          value: details?.primaryValue || file.name,
          description: `${formatBytes(file.size)}${details?.description ? ` • ${details.description}` : ''}`,
          iconName,
        },
        ...(details?.metrics || []),
      ]
    : [];

  return (
    <>
      <ToolLayout>
        <OutputPanel>
          {!file ? (
            <DropZone
              accept={accept}
              onFiles={handleFiles}
              title={title}
              subtitle={subtitle}
              icon={<Icon icon={ICON_MAP[iconName] ?? ICON_MAP.FileText} size={30} />}
            />
          ) : (
            <>
              <MetricGrid
                items={metricItems}
                columns={`repeat(${Math.min(Math.max(metricItems.length, 1), 3)}, minmax(0, 1fr))`}
                marginBottom={16}
              />

              <ErrorCallout message={error} />

              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 18,
                  marginBottom: 16,
                }}
              >
                <div className="panel-label" style={{ marginBottom: 10 }}>
                  Upload Ready
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                  {details?.summary || 'The file has been inspected and the frontend conversion workflow is ready.'}
                </div>
              </div>

              <EmptyState
                iconName={iconName}
                title="Complete UI, waiting on backend processing"
                message={integrationMessage}
              />
            </>
          )}
        </OutputPanel>

        <OptionsPanel>
          {optionsContent}

          {privacyNote ? (
            <div className="privacy-note" style={{ marginBottom: 16 }}>
              {privacyNote}
            </div>
          ) : null}

          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
            onClick={() => setModalOpen(true)}
            disabled={!file || processing}
          >
            <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileText} size={14} className={processing ? 'spin' : ''} />
            {actionLabel}
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleClear}
            disabled={!file}
          >
            <Icon icon={ICON_MAP.Trash2} size={14} />
            Clear
          </button>
        </OptionsPanel>
      </ToolLayout>

      <IntegrationModal
        open={modalOpen}
        title={modalTitle}
        message={integrationMessage}
        endpoint={endpoint}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
