'use client';

import { useState } from 'react';
import BackendConversionStub from '@/tools/_shared/backend-conversion-stub';

export default function PagesToPdf() {
  const [options, setOptions] = useState({
    pageSize: 'a4',
    includeComments: false,
  });

  return (
    <BackendConversionStub
      accept=".pages,application/octet-stream"
      actionLabel="Prepare PDF Conversion"
      endpoint="/api/convert/pages-to-pdf"
      fileLabel="Document"
      iconName="FileText"
      title="Drop a Pages document to prepare PDF export"
      subtitle="The upload, validation, and handoff UI is ready. Converting Apple Pages files into production PDFs still requires backend processing."
      inspectFile={async (file) => {
        if (!/\.pages$/i.test(file.name)) {
          throw new Error('Please upload a .pages file.');
        }

        return {
          primaryValue: file.name,
          description: `${options.pageSize.toUpperCase()} target size`,
          summary: 'The file upload is ready for a backend document conversion service. Pages archives are not safely renderable client-side with this project stack, so the frontend stops at a truthful integration boundary.',
          metrics: [
            {
              label: 'Target',
              value: 'PDF',
              description: options.includeComments ? 'Comments requested' : 'Document pages only',
              iconName: 'FileText',
            },
          ],
        };
      }}
      integrationMessage="This format requires server-side processing. The UI is complete and ready for API integration at POST /api/convert/pages-to-pdf."
      privacyNote="Apple Pages files use a proprietary packaged format. Rather than fake a fragile browser-only conversion, this tool ships a polished frontend that is ready for backend connection."
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
              checked={options.includeComments}
              onChange={(event) => setOptions((current) => ({ ...current, includeComments: event.target.checked }))}
            />
            <span className="checkbox-label">Request comments in exported PDF</span>
          </label>
        </>
      )}
    />
  );
}
