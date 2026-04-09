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
  buildWorkbookPdfHtml,
  parseWorkbookDocument,
  renderHtmlDocumentToPdf,
} from '@/lib/document-conversion-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

export default function ExcelToPdf() {
  const [file, setFile] = useState(null);
  const [workbookInfo, setWorkbookInfo] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    selectedSheetName: '',
    orientation: 'landscape',
    pageSize: 'a4',
    scale: '100',
  });

  const activeSheet = useMemo(
    () => workbookInfo?.sheets?.find((sheet) => sheet.name === options.selectedSheetName) || null,
    [options.selectedSheetName, workbookInfo]
  );

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await parseWorkbookDocument(nextFile);
      setFile(nextFile);
      setWorkbookInfo({
        sheets: parsed.sheets,
      });
      setOptions((current) => ({
        ...current,
        selectedSheetName: parsed.selectedSheetName,
      }));
      setPreviewHtml(parsed.html);
    } catch (loadError) {
      setFile(null);
      setWorkbookInfo(null);
      setPreviewHtml('');
      setError(loadError.message || 'Unable to read that spreadsheet.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSheetChange = async (sheetName) => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const parsed = await parseWorkbookDocument(file, { selectedSheetName: sheetName });
      setOptions((current) => ({
        ...current,
        selectedSheetName: parsed.selectedSheetName,
      }));
      setPreviewHtml(parsed.html);
    } catch (loadError) {
      setError(loadError.message || 'Unable to update that sheet preview.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!file || !previewHtml) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const html = buildWorkbookPdfHtml(previewHtml, {
        fileName: file.name,
        sheetName: options.selectedSheetName,
        scale: Number.parseInt(options.scale, 10) || 100,
      });
      const blob = await renderHtmlDocumentToPdf(html, {
        pageSize: options.pageSize,
        orientation: options.orientation,
        margin: 'tight',
      });

      setResult({
        blob,
        size: blob.size,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to convert that spreadsheet to PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setWorkbookInfo(null);
    setPreviewHtml('');
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({
      selectedSheetName: '',
      orientation: 'landscape',
      pageSize: 'a4',
      scale: '100',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onFiles={handleFiles}
            title="Drop a spreadsheet to convert it into PDF"
            subtitle="Choose the sheet to render, set the page orientation, and export a print-friendly PDF preview."
            icon={<Icon icon={ICON_MAP.FileSpreadsheet} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Sheets',
                  value: String(workbookInfo?.sheets?.length || 0),
                  description: `${formatBytes(file.size)} source file`,
                  iconName: 'FileSpreadsheet',
                },
                {
                  label: 'Active Sheet',
                  value: activeSheet?.name || '—',
                  description: activeSheet ? `${activeSheet.rowCount} rows • ${activeSheet.columnCount} columns` : 'Choose a sheet to preview',
                  iconName: 'Layers',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? 'PDF is ready to download' : 'Generate to export',
                  tone: result ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {previewHtml ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 20,
                  overflowX: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <EmptyState
                iconName="FileSpreadsheet"
                title="Spreadsheet preview will appear here"
                message="CSV and workbook sheets are rendered as HTML tables before PDF export, which keeps the workflow fully client-side."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Sheet</div>
        <select
          className="input"
          value={options.selectedSheetName}
          onChange={(event) => handleSheetChange(event.target.value)}
          style={{ marginBottom: 16 }}
          disabled={!workbookInfo?.sheets?.length}
        >
          {workbookInfo?.sheets?.map((sheet) => (
            <option key={sheet.name} value={sheet.name}>
              {sheet.name}
            </option>
          ))}
        </select>

        <div className="options-label">Orientation</div>
        <select
          className="input"
          value={options.orientation}
          onChange={(event) => setOptions((current) => ({ ...current, orientation: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>

        <div className="options-label">Page Size</div>
        <select
          className="input"
          value={options.pageSize}
          onChange={(event) => setOptions((current) => ({ ...current, pageSize: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>

        <div className="options-label">Scale</div>
        <select
          className="input"
          value={options.scale}
          onChange={(event) => setOptions((current) => ({ ...current, scale: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="80">80%</option>
          <option value="100">100%</option>
          <option value="120">120%</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Workbook formulas and charts are rendered visually into the PDF preview. If you need print areas, repeated headers, or advanced spreadsheet pagination, those are still best handled in desktop spreadsheet software.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!previewHtml || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileText} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : 'Generate PDF'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, file.name.replace(/\.[^.]+$/, '.pdf'))}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download PDF
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
