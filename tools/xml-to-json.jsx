'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { convertXmlToJson } from '@/lib/data-format-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function getXmlToJsonResult(input, options) {
  if (!input.trim()) {
    return {
      output: '',
      error: null,
    };
  }

  try {
    return {
      output: convertXmlToJson(input, options),
      error: null,
    };
  } catch (error) {
    return {
      output: '',
      error: error.message || 'Unable to parse that XML input.',
    };
  }
}

export default function XmlToJson() {
  const [input, setInput] = useState('');
  const [preserveAttributes, setPreserveAttributes] = useState(true);
  const [parseNumbers, setParseNumbers] = useState(true);
  const debouncedInput = useDebounce(input, 150);

  const result = useMemo(
    () => getXmlToJsonResult(debouncedInput, { preserveAttributes, parseNumbers }),
    [debouncedInput, preserveAttributes, parseNumbers]
  );

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="XML Input"
      inputPlaceholder={'<note priority="high"><title>Apex</title></note>'}
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel="JSON Output"
      error={result.error}
      output={result.output}
      outputLabel="Parsed JSON"
      outputPlaceholder="Converted JSON will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.length} characters`]} marginBottom={0} />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Parse XML into readable JSON"
          message="Paste XML to preserve attributes, coerce numeric values when helpful, and export prettified JSON with clear parser errors."
        />
      }
      options={
        <>
          <div className="options-label">Parsing</div>
          <div className="options-row" style={{ marginBottom: 20 }}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={preserveAttributes}
                onChange={(event) => setPreserveAttributes(event.target.checked)}
              />
              <span className="checkbox-label">Preserve attributes</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={parseNumbers}
                onChange={(event) => setParseNumbers(event.target.checked)}
              />
              <span className="checkbox-label">Parse numbers</span>
            </label>
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setPreserveAttributes(true);
        setParseNumbers(true);
      }}
      downloadConfig={{
        filename: 'converted.json',
        mimeType: 'application/json;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
      privacyNote="Attributes are emitted with the `@_` prefix when preservation is enabled, matching the formatter tools elsewhere in the suite."
    />
  );
}
