'use client';

import { useCallback, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { cleanupImageEntries } from '@/tools/_shared/image-batch-tool';
import { createImageEntries } from '@/lib/image-tool-utils';

const OCR_LANGUAGES = [
  ['eng', 'English'],
  ['fra', 'French'],
  ['deu', 'German'],
  ['spa', 'Spanish'],
  ['ita', 'Italian'],
  ['por', 'Portuguese'],
  ['chi_sim', 'Chinese (Simplified)'],
  ['jpn', 'Japanese'],
];

export default function OcrTool() {
  const [entries, setEntries] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('Preparing OCR engine...');
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();
  const [options, setOptions] = useState({
    language: 'eng',
    outputMode: 'plain',
    preserveLayout: true,
  });

  const handleFiles = useCallback(async (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const nextEntries = await createImageEntries(imageFiles);
    setEntries((current) => [...current, ...nextEntries.map((entry) => ({
      ...entry,
      text: '',
      confidence: null,
    }))]);
  }, []);

  const handleRemove = (id) => {
    setEntries((current) => {
      const entry = current.find((item) => item.id === id);
      if (entry) {
        cleanupImageEntries([entry]);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const runOcr = async (targetEntries) => {
    const module = await import('tesseract.js');
    const Tesseract = module.default ?? module;

    for (let index = 0; index < targetEntries.length; index += 1) {
      const entry = targetEntries[index];

      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id ? { ...item, status: 'processing', error: null } : item
        )
      );
      setStatusLabel(`Recognizing text in ${entry.file.name} (${index + 1}/${targetEntries.length})...`);
      setProgress(0);

      try {
        const { data } = await Tesseract.recognize(entry.file, options.language, {
          logger: (message) => {
            if (typeof message.progress === 'number') {
              setProgress(Math.round(message.progress * 100));
            }

            if (message.status) {
              setStatusLabel(`${message.status} — ${entry.file.name}`);
            }
          },
        });

        const text = options.preserveLayout
          ? data.text.trim()
          : data.text.replace(/\s+/g, ' ').trim();

        setEntries((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: 'done',
                  text,
                  confidence: Number.isFinite(data.confidence) ? Math.round(data.confidence) : null,
                }
              : item
          )
        );
      } catch (ocrError) {
        setEntries((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: 'error',
                  error: ocrError.message || 'Unable to extract text from that image.',
                }
              : item
          )
        );
      }
    }
  };

  const handleRun = async () => {
    const targetEntries = entries.filter((entry) => entry.status === 'pending' || entry.status === 'error');
    if (!targetEntries.length) return;

    setProcessing(true);
    setError(null);

    try {
      await runOcr(targetEntries);
    } catch (runError) {
      setError(runError.message || 'Unable to complete OCR for the selected images.');
    } finally {
      setProcessing(false);
      setProgress(100);
      setStatusLabel('OCR complete');
    }
  };

  const handleClear = () => {
    cleanupImageEntries(entries);
    setEntries([]);
    setProcessing(false);
    setProgress(0);
    setStatusLabel('Preparing OCR engine...');
    setError(null);
  };

  const combinedOutput = useMemo(
    () =>
      entries
        .filter((entry) => entry.text)
        .map((entry) =>
          [
            `# ${entry.file.name}`,
            options.outputMode === 'confidence' && entry.confidence !== null
              ? `Confidence: ${entry.confidence}%`
              : null,
            entry.text,
          ]
            .filter(Boolean)
            .join('\n')
        )
        .join('\n\n'),
    [entries, options.outputMode]
  );

  const completedCount = entries.filter((entry) => entry.status === 'done').length;

  return (
    <ToolLayout>
      <OutputPanel>
        {!entries.length ? (
          <DropZone
            accept="image/*"
            multiple
            onFiles={handleFiles}
            title="Drop images to extract text"
            subtitle="Run OCR in your browser with language selection, progress feedback, and multi-image processing."
            icon={<Icon icon={ICON_MAP.Eye} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Images',
                  value: String(entries.length),
                  description: `${completedCount} completed so far`,
                  iconName: 'Image',
                },
                {
                  label: 'Language',
                  value: options.language.toUpperCase(),
                  description: options.outputMode === 'plain' ? 'Plain text output' : 'Confidence summary enabled',
                  tone: completedCount ? 'success' : 'default',
                  iconName: 'Type',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {processing ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 18,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Icon icon={ICON_MAP.Loader2} size={18} className="spin" />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{statusLabel}</div>
                </div>

                <div
                  style={{
                    height: 10,
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg-elevated)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'var(--success)',
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{progress}%</div>
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 12, marginBottom: combinedOutput ? 16 : 0 }}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: `1px solid ${entry.status === 'error' ? 'var(--error)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: 14,
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <img
                    src={entry.thumb}
                    alt={entry.file.name}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                      {entry.file.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                      {entry.status === 'done'
                        ? entry.confidence !== null
                          ? `Confidence ${entry.confidence}%`
                          : 'Text extracted'
                        : entry.status === 'processing'
                          ? 'Processing...'
                          : entry.status === 'error'
                            ? 'Needs retry'
                            : 'Waiting to run'}
                    </div>

                    {entry.error ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--error-bg)',
                          border: '1px solid var(--error)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          fontSize: 12,
                          color: 'var(--error)',
                          marginBottom: 8,
                        }}
                      >
                        <Icon icon={ICON_MAP.AlertCircle} size={13} />
                        {entry.error}
                      </div>
                    ) : null}

                    {entry.text ? (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text)',
                          lineHeight: 1.6,
                          maxHeight: 120,
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {entry.text}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(entry.id)}
                    disabled={processing}
                    style={{ background: 'none', border: 'none', color: 'var(--faint)', padding: 4 }}
                  >
                    <Icon icon={ICON_MAP.X} size={14} />
                  </button>
                </div>
              ))}
            </div>

            {combinedOutput ? (
              <>
                <div className="panel-label">Combined OCR Output</div>
                <textarea
                  className="textarea"
                  value={combinedOutput}
                  readOnly
                  style={{ minHeight: 220 }}
                />
              </>
            ) : null}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Language</div>
        <select
          className="textarea"
          value={options.language}
          onChange={(event) => setOptions((current) => ({ ...current, language: event.target.value }))}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          disabled={!entries.length || processing}
        >
          {OCR_LANGUAGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="options-label">Output Mode</div>
        <div className="mode-toggle" style={{ marginBottom: 16 }}>
          {[
            ['plain', 'Plain'],
            ['confidence', 'Confidence'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.outputMode === value ? ' active' : ''}`}
              onClick={() => setOptions((current) => ({ ...current, outputMode: value }))}
              disabled={!entries.length || processing}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="checkbox-row" style={{ marginBottom: 20 }}>
          <input
            type="checkbox"
            checked={options.preserveLayout}
            onChange={(event) => setOptions((current) => ({ ...current, preserveLayout: event.target.checked }))}
            disabled={!entries.length || processing}
          />
          <span className="checkbox-label">Preserve original line breaks</span>
        </label>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          The first run downloads the selected language data into the browser cache. Large batches are processed one image at a time for stability.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleRun}
          disabled={!entries.length || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Running OCR...' : 'Extract Text'}
        </button>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(combinedOutput)}
          disabled={!combinedOutput}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Output'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadText(combinedOutput, 'ocr-output.txt', 'text/plain;charset=utf-8')}
          disabled={!combinedOutput}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download Text
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!entries.length && !error}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
