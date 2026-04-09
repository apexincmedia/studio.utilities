'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { extractEmailsFromText } from '@/lib/text-tool-utils';

export default function EmailExtractor() {
  const [input, setInput] = useState('');
  const [deduplicate, setDeduplicate] = useState(true);
  const [sortAlphabetically, setSortAlphabetically] = useState(true);

  const debouncedInput = useDebounce(input, 150);
  const values = debouncedInput
    ? extractEmailsFromText(debouncedInput, {
        deduplicate,
        sort: sortAlphabetically,
      })
    : [];
  const output = values.join('\n');

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Source Text"
      inputPlaceholder="Paste copy, HTML, or page source to extract email addresses…"
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel="Extracted Emails"
      error={input.trim() && !values.length ? 'No email addresses were found in the provided text.' : null}
      output={output}
      outputLabel="Email List"
      outputPlaceholder="Email addresses will appear here…"
      outputStats={
        values.length ? (
          <TextStatLine items={[`${values.length} addresses`]} marginBottom={0} />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Mail"
          title="Extract every email address"
          message="Pull email addresses out of any block of text, deduplicate them, sort them, and export the final list."
        />
      }
      options={
        <>
          <div className="options-label">Options</div>
          <div className="options-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={deduplicate}
                onChange={(event) => setDeduplicate(event.target.checked)}
              />
              <span className="checkbox-label">Deduplicate results</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={sortAlphabetically}
                onChange={(event) => setSortAlphabetically(event.target.checked)}
              />
              <span className="checkbox-label">Sort alphabetically</span>
            </label>
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'emails.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
