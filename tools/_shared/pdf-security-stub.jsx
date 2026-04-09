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
import { getPdfPageCount, isPdfFile } from '@/lib/pdf-tool-utils';

export default function PdfSecurityStub({ mode = 'protect' }) {
  const isProtect = mode === 'protect';
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [options, setOptions] = useState({
    userPassword: '',
    ownerPassword: '',
    password: '',
    allowPrint: true,
    allowCopy: false,
    allowEdit: false,
  });

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!isPdfFile(nextFile)) {
      setError('Please upload a PDF file.');
      return;
    }

    setProcessing(true);
    setError(null);
    setNotice('');

    try {
      const count = await getPdfPageCount(nextFile);
      setFile(nextFile);
      setPageCount(count);
    } catch (loadError) {
      setFile(null);
      setPageCount(0);
      setError(loadError.message || 'Unable to inspect that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAction = () => {
    if (!file) return;
    if (isProtect && !options.ownerPassword.trim()) {
      setError('An owner password is required before protection can be applied.');
      return;
    }

    setError(null);
    setNotice(
      isProtect
        ? 'This project\'s current browser PDF stack can edit documents, but it cannot add password encryption yet. The UI is complete and ready for a stronger PDF security backend or future WASM-based encryption engine.'
        : 'This project\'s current browser PDF stack can inspect PDFs, but it cannot remove password encryption yet. The UI is complete and ready for a stronger PDF security backend or future WASM-based decryption engine.'
    );
  };

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setProcessing(false);
    setError(null);
    setNotice('');
    setOptions({
      userPassword: '',
      ownerPassword: '',
      password: '',
      allowPrint: true,
      allowCopy: false,
      allowEdit: false,
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title={isProtect ? 'Drop a PDF to configure password protection' : 'Drop a PDF to configure unlock settings'}
            subtitle={isProtect
              ? 'Set owner and user passwords, choose permissions, and prepare a protected-PDF workflow.'
              : 'Enter the current password and prepare an unlock workflow for encrypted PDFs.'}
            icon={<Icon icon={isProtect ? ICON_MAP.Lock : ICON_MAP.FileMinus} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pageCount),
                  description: `${formatBytes(file.size)} source PDF`,
                  iconName: 'FileText',
                },
                {
                  label: 'Mode',
                  value: isProtect ? 'Protect' : 'Unlock',
                  description: isProtect ? 'Password + permissions setup' : 'Password removal flow',
                  iconName: isProtect ? 'Lock' : 'FileMinus',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {notice ? (
              <div
                style={{
                  border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--warning-bg)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Icon icon={ICON_MAP.AlertTriangle} size={18} color="var(--warning)" />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>
                      {isProtect ? 'Backend or WASM integration needed' : 'Decryption engine needed'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                      {notice}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                iconName={isProtect ? 'Lock' : 'FileMinus'}
                title={isProtect ? 'Configure PDF protection details' : 'Provide the current PDF password'}
                message={isProtect
                  ? 'The controls are ready for owner password, user password, and permission choices. Running the action will surface the current client-side limitation honestly.'
                  : 'The unlock form is ready, including an optional password field. Running the action will explain the current client-side limitation honestly.'}
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        {isProtect ? (
          <>
            <div className="options-label">User Password</div>
            <input
              type="password"
              className="input"
              value={options.userPassword}
              onChange={(event) => setOptions((current) => ({ ...current, userPassword: event.target.value }))}
              placeholder="Optional open password"
              style={{ marginBottom: 16 }}
            />

            <div className="options-label">Owner Password</div>
            <input
              type="password"
              className="input"
              value={options.ownerPassword}
              onChange={(event) => setOptions((current) => ({ ...current, ownerPassword: event.target.value }))}
              placeholder="Required permissions password"
              style={{ marginBottom: 16 }}
            />

            <div className="options-label">Permissions</div>
            <div className="options-row" style={{ marginBottom: 16 }}>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={options.allowPrint}
                  onChange={(event) => setOptions((current) => ({ ...current, allowPrint: event.target.checked }))}
                />
                <span className="checkbox-label">Allow print</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={options.allowCopy}
                  onChange={(event) => setOptions((current) => ({ ...current, allowCopy: event.target.checked }))}
                />
                <span className="checkbox-label">Allow copy</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={options.allowEdit}
                  onChange={(event) => setOptions((current) => ({ ...current, allowEdit: event.target.checked }))}
                />
                <span className="checkbox-label">Allow edit</span>
              </label>
            </div>
          </>
        ) : (
          <>
            <div className="options-label">Current Password</div>
            <input
              type="password"
              className="input"
              value={options.password}
              onChange={(event) => setOptions((current) => ({ ...current, password: event.target.value }))}
              placeholder="Optional if the PDF opens without one"
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          {isProtect
            ? 'The tracker expects a PDF security workflow here, but the installed client-side PDF library cannot add encryption in this build. RC4 and stronger PDF security flows require a different engine.'
            : 'The tracker expects a PDF unlock workflow here, but the installed client-side PDF library cannot remove encryption in this build. Password removal needs a different engine.'}
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleAction}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : isProtect ? ICON_MAP.Lock : ICON_MAP.FileMinus} size={14} className={processing ? 'spin' : ''} />
          {isProtect ? 'Prepare Protection Flow' : 'Prepare Unlock Flow'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !notice}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
