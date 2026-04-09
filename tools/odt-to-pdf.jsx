'use client';

import { useState } from 'react';
import BackendConversionStub from '@/tools/_shared/backend-conversion-stub';

export default function OdtToPdf() {
  const [options, setOptions] = useState({
    pageSize: 'a4',
    preserveComments: false,
  });

  return (
    <BackendConversionStub
      accept=".odt,application/vnd.oasis.opendocument.text"
      actionLabel="Prepare PDF Conversion"
      endpoint="/api/convert/odt-to-pdf"
      fileLabel="Document"
      iconName="FileText"
      title="Drop an ODT file to prepare PDF conversion"
      subtitle="The polished upload and output flow is ready. Converting OpenDocument text to final PDF requires server-side processing."
      inspectFile={async (file) => {
        if (!/\.odt$/i.test(file.name)) {
          throw new Error('Please upload an .odt file.');
        }

        return {
          primaryValue: file.name,
          description: `${options.pageSize.toUpperCase()} target size`,
          summary: 'The upload has been validated successfully. ODT parsing and layout fidelity require a server-side office conversion pipeline for production-quality PDF output.',
          metrics: [
            {
              label: 'Target',
              value: 'PDF',
              description: options.preserveComments ? 'Comments requested' : 'Document pages only',
              iconName: 'FileText',
            },
          ],
        };
      }}
      integrationMessage="This format requires server-side processing. The UI is complete and ready for API integration at POST /api/convert/odt-to-pdf."
      privacyNote="There is no mature client-side ODT renderer in this stack that can preserve document fidelity for production PDF output, so this tool intentionally stops at a backend-ready handoff."
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
              checked={options.preserveComments}
              onChange={(event) => setOptions((current) => ({ ...current, preserveComments: event.target.checked }))}
            />
            <span className="checkbox-label">Request comments in exported PDF</span>
          </label>
        </>
      )}
    />
  );
}
