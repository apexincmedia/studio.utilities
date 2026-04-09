'use client';

import { useState } from 'react';
import BackendConversionStub from '@/tools/_shared/backend-conversion-stub';

export default function NumbersToExcel() {
  const [options, setOptions] = useState({
    includeHiddenSheets: false,
    normalizeDates: true,
  });

  return (
    <BackendConversionStub
      accept=".numbers,application/octet-stream"
      actionLabel="Prepare Excel Conversion"
      endpoint="/api/convert/numbers-to-excel"
      fileLabel="Spreadsheet"
      iconName="FileSpreadsheet"
      title="Drop a Numbers file to prepare Excel export"
      subtitle="The frontend flow is ready for Apple Numbers uploads, metadata review, and a backend handoff for .xlsx generation."
      inspectFile={async (file) => {
        if (!/\.numbers$/i.test(file.name)) {
          throw new Error('Please upload a .numbers file.');
        }

        return {
          primaryValue: file.name,
          description: options.normalizeDates ? 'Date normalization enabled' : 'Raw value export requested',
          summary: 'The file has been staged successfully. Converting Apple Numbers packages into reliable XLSX output requires server-side parsing of the proprietary archive structure.',
          metrics: [
            {
              label: 'Target',
              value: 'XLSX',
              description: options.includeHiddenSheets ? 'Hidden sheets included' : 'Visible sheets only',
              iconName: 'FileSpreadsheet',
            },
          ],
        };
      }}
      integrationMessage="This format requires server-side processing. The UI is complete and ready for API integration at POST /api/convert/numbers-to-excel."
      privacyNote="Numbers files are packaged archives with Apple-specific table metadata. This frontend stops at a polished handoff instead of pretending it can safely rebuild the workbook in-browser."
      optionsContent={(
        <>
          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={options.includeHiddenSheets}
              onChange={(event) => setOptions((current) => ({ ...current, includeHiddenSheets: event.target.checked }))}
            />
            <span className="checkbox-label">Include hidden sheets</span>
          </label>

          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={options.normalizeDates}
              onChange={(event) => setOptions((current) => ({ ...current, normalizeDates: event.target.checked }))}
            />
            <span className="checkbox-label">Normalize Apple date values</span>
          </label>
        </>
      )}
    />
  );
}
