'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, readAsDataURL, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, TextStatLine } from '@/tools/_shared/text-tool-kit';

export default function PngToBase64() {
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullDataUri, setFullDataUri] = useState('');
  const [rawBase64, setRawBase64] = useState('');
  const [showFullUri, setShowFullUri] = useState(true);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  const output = showFullUri ? fullDataUri : rawBase64;

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    setError(null);

    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      setError('Please upload a PNG image.');
      return;
    }

    try {
      const dataUrl = await readAsDataURL(file);
      setFileName(file.name);
      setPreviewUrl(dataUrl);
      setFullDataUri(dataUrl);
      setRawBase64(dataUrl.split(',')[1] || '');
    } catch {
      setError('The PNG file could not be read.');
    }
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">PNG Input</div>
        {!previewUrl ? (
          <DropZone
            accept="image/png"
            onFiles={handleFiles}
            title="Drop a PNG here"
            subtitle="or click to browse"
            icon={<Icon icon={ICON_MAP.FileImage} size={28} />}
          />
        ) : (
          <>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: 16,
              }}
            >
              <img
                src={previewUrl}
                alt={fileName || 'PNG preview'}
                style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)' }}
              />
            </div>

            <div className="panel-label">{showFullUri ? 'Base64 Data URI' : 'Raw Base64'}</div>
            <textarea
              className="textarea"
              value={output}
              readOnly
              style={{ minHeight: 220, marginBottom: 8 }}
            />
            <TextStatLine
              items={[`${output.length} characters`, fileName || 'PNG file']}
              marginBottom={0}
            />
          </>
        )}

        <ErrorCallout message={error} />
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Output</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {[
            [true, 'Full URI'],
            [false, 'Raw Base64'],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              className={`mode-btn${showFullUri === value ? ' active' : ''}`}
              onClick={() => setShowFullUri(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="panel-divider" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(output)}
            disabled={!output}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setFileName('');
              setPreviewUrl('');
              setFullDataUri('');
              setRawBase64('');
              setError(null);
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => downloadText(output, showFullUri ? 'png-data-uri.txt' : 'png-base64.txt')}
          disabled={!output}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">
          PNG conversion uses FileReader only. The image never leaves your device.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
