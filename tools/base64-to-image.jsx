'use client';

import { useEffect, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes, useDebounce, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid, TextStatLine } from '@/tools/_shared/text-tool-kit';
import {
  blobToDataUrl,
  bytesToBlob,
  decodeBase64ToBytes,
  detectImageType,
  getMimeFromDataUri,
  stripDataUriPrefix,
} from '@/lib/base64-image-utils';

async function parseBase64Image(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: null, result: null };
  }

  try {
    const bytes = decodeBase64ToBytes(trimmed);
    const mimeFromUri = getMimeFromDataUri(trimmed);
    const detected = detectImageType(bytes);
    const mime = mimeFromUri || detected?.mime;
    const extension = detected?.extension || (mimeFromUri ? mimeFromUri.split('/')[1] : 'png');

    if (!mime?.startsWith('image/')) {
      return {
        error: 'That Base64 string does not appear to be a supported image format.',
        result: null,
      };
    }

    const blob = bytesToBlob(bytes, mime);
    const previewUrl = await blobToDataUrl(blob);

    return {
      error: null,
      result: {
        blob,
        previewUrl,
        size: blob.size,
        mime,
        extension,
        hasPrefix: /^data:/i.test(trimmed),
      },
    };
  } catch {
    return {
      error: 'Invalid Base64 input. Paste a full data URI or a raw Base64 image string.',
      result: null,
    };
  }
}

export default function Base64ToImage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    parseBase64Image(debouncedInput).then((parsed) => {
      if (cancelled) {
        return;
      }

      setError(parsed.error);
      setResult(parsed.result);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedInput]);

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Base64 Input</div>
        <textarea
          className={`textarea${error ? ' textarea-error' : ''}`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste a Base64 data URI or raw Base64 image string..."
          style={{ minHeight: 220, marginBottom: 8 }}
        />

        <TextStatLine
          items={input ? [`${input.length} characters`, result?.hasPrefix ? 'Data URI detected' : 'Raw Base64 or data URI'] : []}
          marginBottom={16}
        />

        <ErrorCallout message={error} />

        {result ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Format',
                  value: result.mime.replace('image/', '').toUpperCase(),
                  description: 'Detected from the data URI or image signature',
                  iconName: 'FileImage',
                },
                {
                  label: 'Size',
                  value: formatBytes(result.size),
                  description: 'Decoded output size',
                  iconName: 'Package',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div
              style={{
                minHeight: 280,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
              }}
            >
              <img
                src={result.previewUrl}
                alt="Decoded image preview"
                style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
              />
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Image"
            title="Preview the decoded image"
            message="Paste a Base64 image string to detect its format, render a preview, and download the recovered file."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Format detection uses image magic bytes for PNG, JPG, GIF, WebP, and BMP. Data URI prefixes are supported automatically.
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(result?.previewUrl || '')}
          disabled={!result?.previewUrl}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Data URI'}
        </button>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadBlob(result.blob, `decoded-image.${result.extension}`)}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download Image
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!input && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
