'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import {
  buildPdfSpreadsheetExport,
  extractPdfPages,
  getPdfSpreadsheetPreviewRows,
} from '@/lib/document-conversion-utils';
import { getPdfBaseName, isPdfFile } from '@/lib/pdf-tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

export default function PdfToExcel() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    format: 'xlsx',
    detectTables: true,
  });

  const previewRows = useMemo(
    () => getPdfSpreadsheetPreviewRows(pages, { detectTables: options.detectTables }),
    [options.detectTables, pages]
  );

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!isPdfFile(nextFile)) {
      setError('Please upload a PDF file.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const extracted = await extractPdfPages(nextFile);
      setFile(nextFile);
      setPages(extracted.pages);
    } catch (loadError) {
      setFile(null);
      setPages([]);
      setError(loadError.message || 'Unable to inspect that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    if (!pages.some((page) => page.text.trim())) {
      setError('No selectable text was found in that PDF. Table extraction works only on machine-readable PDFs.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const generated = await buildPdfSpreadsheetExport(pages, options);
      setResult({
        blob: generated.blob,
        size: generated.blob.size,
        extension: options.format,
        rowCount: generated.rowCount,
        sheetCount: generated.sheetCount,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to build the spreadsheet export from that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPages([]);
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({
      format: 'xlsx',
      detectTables: true,
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title="Drop a PDF to extract spreadsheet data"
            subtitle="Best for clean tabular layouts such as invoices, reports, and statements. Extraction is heuristic."
            icon={<Icon icon={ICON_MAP.FileSpreadsheet} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pages.length),
                  description: `${formatBytes(file.size)} source PDF`,
                  iconName: 'FileText',
                },
                {
                  label: 'Preview Rows',
                  value: String(previewRows.length),
                  description: options.detectTables ? 'Column anchors detected automatically' : 'One text row per line',
                  iconName: 'FileSpreadsheet',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? `${result.extension.toUpperCase()} ready` : 'Generate to export',
                  tone: result ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {previewRows.length ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                <div className="panel-label" style={{ padding: '16px 16px 0' }}>
                  Preview Rows
                </div>
                <div style={{ overflowX: 'auto', padding: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`cell-${rowIndex}-${cellIndex}`}
                              style={{
                                border: '1px solid var(--border)',
                                padding: '8px 10px',
                                fontSize: 12,
                                color: 'var(--text)',
                                verticalAlign: 'top',
                              }}
                            >
                              {cell || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState
                iconName="FileSpreadsheet"
                title="No rows to preview yet"
                message="The PDF loaded, but no structured rows were detected from the visible text. This usually happens with scanned documents or dense freeform layouts."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Output Format</div>
        <select
          className="input"
          value={options.format}
          onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="xlsx">XLSX Workbook</option>
          <option value="csv">CSV</option>
        </select>

        <label className="checkbox-row" style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={options.detectTables}
            onChange={(event) => setOptions((current) => ({ ...current, detectTables: event.target.checked }))}
          />
          <span className="checkbox-label">Detect tables automatically</span>
        </label>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Table detection is based on text positions inside the PDF. Cleanly aligned columns work best. Complex merged cells, nested tables, and image-based PDFs may need manual cleanup after export.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileSpreadsheet} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : `Generate ${options.format.toUpperCase()}`}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, `${getPdfBaseName(file?.name)}.${result.extension}`)}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download Export
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
