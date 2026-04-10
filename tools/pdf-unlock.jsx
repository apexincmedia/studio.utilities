'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { getPdfBaseName, isPdfFile, loadPdfJs } from '@/lib/pdf-tool-utils';
import { ErrorCallout } from '@/tools/_shared/text-tool-kit';

async function loadJsPdf() {
  const module = await import('jspdf');
  return module.jsPDF;
}

async function rebuildUnlockedPdf(file, password) {
  const pdfjs = await loadPdfJs();
  const jsPDF = await loadJsPdf();
  const sourceBytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: sourceBytes,
    password: password || undefined,
  });
  const pdf = await loadingTask.promise;
  const renderScale = 2;

  let doc = null;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale: renderScale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(renderViewport.width);
      canvas.height = Math.ceil(renderViewport.height);

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create a canvas context for PDF rendering.');
      }

      await page.render({ canvasContext: context, viewport: renderViewport }).promise;

      const pageSize = [baseViewport.width, baseViewport.height];
      const orientation = baseViewport.width >= baseViewport.height ? 'landscape' : 'portrait';

      if (!doc) {
        doc = new jsPDF({
          unit: 'pt',
          format: pageSize,
          orientation,
          compress: true,
        });
      } else {
        doc.addPage(pageSize, orientation);
      }

      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageSize[0], pageSize[1], undefined, 'FAST');

      if (typeof page.cleanup === 'function') {
        page.cleanup();
      }
    }
  } finally {
    if (typeof pdf.cleanup === 'function') {
      pdf.cleanup();
    }
    if (typeof pdf.destroy === 'function') {
      pdf.destroy();
    }
  }

  if (!doc) {
    throw new Error('That PDF did not contain any pages to unlock.');
  }

  return doc.output('blob');
}

export default function PdfUnlock() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = (files) => {
    const nextFile = files[0];
    if (!nextFile || !isPdfFile(nextFile)) {
      setError('Please upload a PDF file.');
      return;
    }

    setFile(nextFile);
    setDone(false);
    setError(null);
  };

  const handleUnlock = async () => {
    if (!file) return;

    setProcessing(true);
    setDone(false);
    setError(null);

    try {
      const unlockedBlob = await rebuildUnlockedPdf(file, password);
      downloadBlob(unlockedBlob, `${getPdfBaseName(file.name)}_unlocked.pdf`);
      setDone(true);
    } catch (unlockError) {
      const message = unlockError?.message || 'Could not unlock that PDF.';
      if (unlockError?.name === 'PasswordException' || /password|encrypted|decrypt/i.test(message)) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPassword('');
    setShowPassword(false);
    setProcessing(false);
    setDone(false);
    setError(null);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {file ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              background: 'var(--surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Icon icon={ICON_MAP.FileText} size={24} color="var(--muted)" />
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{formatBytes(file.size)}</div>
              </div>
            </div>

            {done ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  color: 'var(--success)',
                }}
              >
                <Icon icon={ICON_MAP.CheckCircle2} size={15} />
                PDF unlocked and downloaded successfully.
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                The unlocked copy is rebuilt locally in your browser, so interactive fields, links, and selectable text may be flattened during the process.
              </div>
            )}
          </div>
        ) : (
          <DropZone
            onFiles={handleFiles}
            accept=".pdf,application/pdf"
            title="Drop a password-protected PDF"
            subtitle="Enter the password below and rebuild an unlocked copy entirely in your browser."
            icon={<Icon icon={ICON_MAP.Key} size={30} />}
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">PDF Password</div>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter the PDF password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: 0,
            }}
          >
            <Icon icon={showPassword ? ICON_MAP.EyeOff : ICON_MAP.Eye} size={16} />
          </button>
        </div>

        <ErrorCallout message={error} />

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleUnlock}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Key} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Unlocking…' : 'Unlock PDF'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !done}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>

        <div className="privacy-note" style={{ marginTop: 16 }}>
          Decryption and export run entirely in your browser using the installed client-side PDF stack. Nothing is uploaded from this tool.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
