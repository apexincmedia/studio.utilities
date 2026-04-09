'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import {
  extractErrorLocation,
  getByteSize,
} from '@/lib/developer-tool-utils';
import { generateTypeScriptDefinitions } from '@/lib/json-to-typescript';

export default function JsonToTypeScript() {
  const [input, setInput] = useState('');
  const [rootName, setRootName] = useState('Root');
  const [declarationKind, setDeclarationKind] = useState('interface');
  const [optionalFields, setOptionalFields] = useState(true);
  const debouncedInput = useDebounce(input, 150);

  const result = useMemo(() => {
    if (!debouncedInput.trim()) {
      return { output: '', error: null, definitionCount: 0, rootType: 'Root' };
    }

    try {
      const parsed = JSON.parse(debouncedInput);
      return {
        ...generateTypeScriptDefinitions(parsed, {
          rootName,
          declarationKind,
          optionalFields,
        }),
        error: null,
      };
    } catch (error) {
      const details = extractErrorLocation(debouncedInput, error);
      return {
        output: '',
        error:
          details.line && details.column
            ? `${details.message} (line ${details.line}, column ${details.column})`
            : details.message,
        definitionCount: 0,
        rootType: rootName || 'Root',
      };
    }
  }, [debouncedInput, declarationKind, optionalFields, rootName]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="JSON Input"
      inputPlaceholder='{"name":"Apex","tools":[{"slug":"json-formatter","live":true}]}'
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="TypeScript Definitions"
      error={result.error}
      output={result.output}
      outputLabel="Generated Types"
      outputPlaceholder="TypeScript output will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.split('\n').length} lines`, `${getByteSize(result.output)} bytes`]} marginBottom={0} />
        ) : null
      }
      extraActions={
        result.output ? (
          <MetricGrid
            items={[
              {
                label: 'Root Type',
                value: result.rootType,
                description: 'Top-level generated name',
                iconName: 'FileCode',
              },
              {
                label: 'Definitions',
                value: String(result.definitionCount),
                description: 'Generated interfaces or type aliases',
                iconName: 'Layers',
              },
            ]}
            columns="repeat(2, minmax(0, 1fr))"
            marginBottom={8}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Generate clean TypeScript types from JSON"
          message="Paste a JSON payload to produce strongly typed interfaces or type aliases for nested objects, arrays, and unions."
        />
      }
      options={
        <>
          <div className="options-label">Root Name</div>
          <input
            type="text"
            className="textarea"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          />

          <div className="options-label">Declaration Style</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            {[
              ['interface', 'Interface'],
              ['type', 'Type'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${declarationKind === value ? ' active' : ''}`}
                onClick={() => setDeclarationKind(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={optionalFields}
              onChange={(event) => setOptionalFields(event.target.checked)}
            />
            <span className="checkbox-label">Mark array-missing fields as optional</span>
          </label>

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setRootName('Root');
        setDeclarationKind('interface');
        setOptionalFields(true);
      }}
      downloadConfig={{
        filename: 'types.ts',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
