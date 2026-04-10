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

async function rebuildProtectedPdf(file, options) {
  const pdfjs = await loadPdfJs();
  const jsPDF = await loadJsPdf();
  const sourceBytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: sourceBytes });
  const pdf = await loadingTask.promise;
  const renderScale = 2;
  const encryption = {
    userPassword: options.userPassword,
    ownerPassword: options.ownerPassword || options.userPassword,
    userPermissions: [
      ...(options.allowPrinting ? ['print'] : []),
      ...(options.allowCopying ? ['copy'] : []),
    ],
  };

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
          encryption,
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
    throw new Error('That PDF did not contain any pages to protect.');
  }

  return doc.output('blob');
}

export default function PdfProtect() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    userPassword: '',
    ownerPassword: '',
    allowPrinting: true,
    allowCopying: false,
  });

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

  const handleProtect = async () => {
    if (!file) return;
    if (!options.userPassword.trim()) {
      setError('Enter at least a user password.');
      return;
    }

    setProcessing(true);
    setDone(false);
    setError(null);

    try {
      const protectedBlob = await rebuildProtectedPdf(file, options);
      downloadBlob(protectedBlob, `${getPdfBaseName(file.name)}_protected.pdf`);
      setDone(true);
    } catch (protectError) {
      setError(protectError.message || 'Could not protect that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setProcessing(false);
    setDone(false);
    setError(null);
    setOptions({
      userPassword: '',
      ownerPassword: '',
      allowPrinting: true,
      allowCopying: false,
    });
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
                PDF protected and downloaded successfully.
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                Pages are rebuilt locally in your browser before encryption is applied, so links, forms, and selectable text may be flattened in the protected copy.
              </div>
            )}
          </div>
        ) : (
          <DropZone
            onFiles={handleFiles}
            accept=".pdf,application/pdf"
            title="Drop a PDF to protect it"
            subtitle="The document is rebuilt and encrypted entirely in your browser before download."
            icon={<Icon icon={ICON_MAP.Lock} size={30} />}
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">
          User Password <span style={{ color: 'var(--error)' }}>*</span>
        </div>
        <input
          className="input"
          type="password"
          placeholder="Password to open the PDF"
          value={options.userPassword}
          onChange={(event) => setOptions((current) => ({ ...current, userPassword: event.target.value }))}
          style={{ marginBottom: 16 }}
        />

        <div className="options-label">
          Owner Password <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
        </div>
        <input
          className="input"
          type="password"
          placeholder="Defaults to the user password"
          value={options.ownerPassword}
          onChange={(event) => setOptions((current) => ({ ...current, ownerPassword: event.target.value }))}
          style={{ marginBottom: 16 }}
        />

        <div className="options-label">Permissions</div>
        <label className="checkbox-row" style={{ marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={options.allowPrinting}
            onChange={(event) => setOptions((current) => ({ ...current, allowPrinting: event.target.checked }))}
          />
          <span className="checkbox-label">Allow printing</span>
        </label>
        <label className="checkbox-row" style={{ marginBottom: 20 }}>
          <input
            type="checkbox"
            checked={options.allowCopying}
            onChange={(event) => setOptions((current) => ({ ...current, allowCopying: event.target.checked }))}
          />
          <span className="checkbox-label">Allow copying text</span>
        </label>

        <ErrorCallout message={error} />

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleProtect}
          disabled={!file || processing || !options.userPassword.trim()}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Lock} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Protecting…' : 'Protect PDF'}
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
          Encryption happens locally in your browser using the installed client-side PDF stack. Nothing is uploaded from this tool.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
