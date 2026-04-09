'use client';

import { useState } from 'react';
import BackendConversionStub from '@/tools/_shared/backend-conversion-stub';
import { inspectPptxPresentation } from '@/lib/document-conversion-utils';

export default function PowerPointToPdf() {
  const [options, setOptions] = useState({
    pageSize: 'a4',
    includeNotes: false,
  });

  return (
    <BackendConversionStub
      accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
      actionLabel="Prepare PDF Conversion"
      endpoint="/api/convert/pptx-to-pdf"
      fileLabel="Presentation"
      iconName="FileText"
      title="Drop a PowerPoint file to prepare PDF export"
      subtitle="The frontend upload flow is ready, including slide inspection and print options. Rendering PPTX to PDF still needs backend processing."
      inspectFile={async (file) => {
        if (!/\.pptx$/i.test(file.name)) {
          throw new Error('Only .pptx files are supported in this workflow.');
        }

        const details = await inspectPptxPresentation(file);

        return {
          primaryValue: file.name,
          description: `${details.slideCount} slides detected`,
          summary: 'The presentation structure has been inspected successfully. Converting PPTX slides to a final PDF still requires a server-side rendering pipeline.',
          metrics: [
            {
              label: 'Slides',
              value: String(details.slideCount),
              description: options.includeNotes ? 'Speaker notes requested' : 'Slides only',
              iconName: 'Layers',
            },
            {
              label: 'Paper',
              value: options.pageSize.toUpperCase(),
              description: 'Ready for backend print rendering',
              iconName: 'FileText',
            },
          ],
        };
      }}
      integrationMessage="PPTX to PDF requires server processing. The UI is complete and ready for API integration at POST /api/convert/pptx-to-pdf."
      privacyNote="PptxGenJS is excellent for creating PowerPoint files, but it does not read or render uploaded PPTX decks into PDF. This frontend is intentionally honest about that limitation."
      optionsContent={(
        <>
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

          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={options.includeNotes}
              onChange={(event) => setOptions((current) => ({ ...current, includeNotes: event.target.checked }))}
            />
            <span className="checkbox-label">Request speaker notes in PDF</span>
          </label>
        </>
      )}
    />
  );
}
