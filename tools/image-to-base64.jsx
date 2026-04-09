'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, formatBytes, readAsDataURL, useCopyState } from '@/lib/tool-utils';
import { ErrorCallout, TextStatLine } from '@/tools/_shared/text-tool-kit';

const LARGE_FILE_WARNING_BYTES = 500 * 1024;

export default function ImageToBase64() {
  const [fileInfo, setFileInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullDataUri, setFullDataUri] = useState('');
  const [rawBase64, setRawBase64] = useState('');
  const [showFullUri, setShowFullUri] = useState(true);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  const output = showFullUri ? fullDataUri : rawBase64;
  const isLargeFile = (fileInfo?.size ?? 0) >= LARGE_FILE_WARNING_BYTES;

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    try {
      const dataUrl = await readAsDataURL(file);
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type || 'image/*',
      });
      setPreviewUrl(dataUrl);
      setFullDataUri(dataUrl);
      setRawBase64(dataUrl.split(',')[1] || '');
    } catch {
      setError('The selected image could not be read.');
    }
  };

  const handleClear = () => {
    setFileInfo(null);
    setPreviewUrl('');
    setFullDataUri('');
    setRawBase64('');
    setError(null);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!previewUrl ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop an image to encode"
            subtitle="Convert any image into a Base64 data URI or raw Base64 string without leaving your browser."
            icon={<Icon icon={ICON_MAP.FileImage} size={30} />}
          >
            <div className="drop-zone-formats">
              {['JPG', 'PNG', 'WebP', 'GIF', 'AVIF'].map((format) => (
                <span key={format} className="drop-zone-format-pill">
                  {format}
                </span>
              ))}
            </div>
          </DropZone>
        ) : (
          <>
            {isLargeFile ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text)',
                }}
              >
                <Icon icon={ICON_MAP.AlertTriangle} size={15} color="var(--warning)" />
                Large images create very long Base64 strings. Expect slower copy and paste in other tools.
              </div>
            ) : null}

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                marginBottom: 16,
              }}
            >
              <img
                src={previewUrl}
                alt={fileInfo?.name || 'Image preview'}
                style={{
                  width: '100%',
                  maxHeight: 320,
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                }}
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
              items={[
                `${output.length} characters`,
                fileInfo ? `${formatBytes(fileInfo.size)} input` : '',
                fileInfo?.type || '',
              ].filter(Boolean)}
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
              disabled={!previewUrl}
            >
              {label}
            </button>
          ))}
        </div>

        {fileInfo ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6 }}>
              {fileInfo.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {formatBytes(fileInfo.size)} · {fileInfo.type}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(output)}
          disabled={!output}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Output'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() =>
            downloadText(
              output,
              showFullUri ? 'image-data-uri.txt' : 'image-base64.txt',
              'text/plain;charset=utf-8'
            )
          }
          disabled={!output}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!previewUrl && !error}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>

        <div className="privacy-note">
          The conversion uses FileReader only. Your image stays on this device the entire time.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
