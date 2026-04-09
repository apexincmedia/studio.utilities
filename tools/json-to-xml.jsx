'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { convertJsonToXml } from '@/lib/data-format-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function getJsonToXmlResult(input, options) {
  if (!input.trim()) {
    return {
      output: '',
      error: null,
    };
  }

  try {
    return {
      output: convertJsonToXml(input, options),
      error: null,
    };
  } catch (error) {
    return {
      output: '',
      error: error.message || 'Unable to convert that JSON input into XML.',
    };
  }
}

export default function JsonToXml() {
  const [input, setInput] = useState('');
  const [rootName, setRootName] = useState('root');
  const [prettyPrint, setPrettyPrint] = useState(true);
  const debouncedInput = useDebounce(input, 150);

  const result = useMemo(
    () => getJsonToXmlResult(debouncedInput, { rootName, prettyPrint }),
    [debouncedInput, rootName, prettyPrint]
  );

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="JSON Input"
      inputPlaceholder='{"name":"Apex","priority":"high"}'
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel="XML Output"
      error={result.error}
      output={result.output}
      outputLabel="Generated XML"
      outputPlaceholder="Converted XML will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.length} characters`]} marginBottom={0} />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Braces"
          title="Wrap JSON in a clean XML document"
          message="Paste JSON to generate XML with an explicit root node, an XML declaration, and optional pretty-print formatting."
        />
      }
      options={
        <>
          <div className="options-label">Root Element</div>
          <input
            type="text"
            className="input"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            placeholder="root"
            style={{ marginBottom: 16 }}
          />

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={prettyPrint}
              onChange={(event) => setPrettyPrint(event.target.checked)}
            />
            <span className="checkbox-label">Pretty print XML</span>
          </label>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setRootName('root');
        setPrettyPrint(true);
      }}
      downloadConfig={{
        filename: 'converted.xml',
        mimeType: 'application/xml;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
      privacyNote="JSON arrays and primitive values are wrapped in the chosen root node automatically so the XML output is always well-formed."
    />
  );
}
