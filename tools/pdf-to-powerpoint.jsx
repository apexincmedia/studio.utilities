'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { buildPdfPowerPointBlob } from '@/lib/pdf-presentation-utils';
import { getPdfBaseName, getPdfPageCount, isPdfFile } from '@/lib/pdf-tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

export default function PdfToPowerPoint() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    dpi: '144',
    slideSize: 'widescreen',
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
    setResult(null);

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

  const handleGenerate = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const generated = await buildPdfPowerPointBlob(file, {
        dpi: Number.parseInt(options.dpi, 10) || 144,
        slideSize: options.slideSize,
      });

      setResult({
        blob: generated.blob,
        size: generated.blob.size,
        slideCount: generated.slideCount,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the PowerPoint export from that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({
      dpi: '144',
      slideSize: 'widescreen',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title="Drop a PDF to turn each page into a slide"
            subtitle="Each PDF page becomes an image-based slide inside a downloadable PPTX presentation."
            icon={<Icon icon={ICON_MAP.FileText} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pageCount),
                  description: `${formatBytes(file.size)} source PDF`,
                  iconName: 'Layers',
                },
                {
                  label: 'Slides',
                  value: result ? String(result.slideCount) : String(pageCount),
                  description: options.slideSize === 'standard' ? '4:3 layout' : '16:9 layout',
                  iconName: 'FileText',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? 'PPTX is ready to download' : 'Generate to export',
                  tone: result ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <EmptyState
              iconName="FileText"
              title="Slides are exported as images"
              message="This workflow preserves each PDF page visually by embedding a full-page image on every slide. Text and shapes are not recreated as editable PowerPoint objects."
            />
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Resolution</div>
        <select
          className="input"
          value={options.dpi}
          onChange={(event) => setOptions((current) => ({ ...current, dpi: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="96">96 DPI</option>
          <option value="144">144 DPI</option>
          <option value="192">192 DPI</option>
        </select>

        <div className="options-label">Slide Size</div>
        <select
          className="input"
          value={options.slideSize}
          onChange={(event) => setOptions((current) => ({ ...current, slideSize: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="widescreen">16:9 Widescreen</option>
          <option value="standard">4:3 Standard</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Generated slides are image-based, which keeps the layout faithful to the PDF. The tradeoff is that slide text won’t be individually editable after export.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileText} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : 'Generate PPTX'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, `${getPdfBaseName(file?.name)}.pptx`)}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download PPTX
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
