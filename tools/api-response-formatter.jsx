'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { copyToClipboard, useDebounce } from '@/lib/tool-utils';
import {
  EmptyState,
  MetricGrid,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import {
  extractErrorLocation,
  getJsonStructureStats,
} from '@/lib/developer-tool-utils';

function collectExpandablePaths(value, path = 'root') {
  if (!value || typeof value !== 'object') return [];

  const childEntries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);

  return [
    path,
    ...childEntries.flatMap(([key, child]) => collectExpandablePaths(child, `${path}.${key}`)),
  ];
}

function countMatchingKeys(value, searchTerm) {
  if (!searchTerm) return 0;
  if (!value || typeof value !== 'object') return 0;

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);

  return entries.reduce((total, [key, child]) => {
    const nextTotal = total + (key.toLowerCase().includes(searchTerm) ? 1 : 0);
    return nextTotal + countMatchingKeys(child, searchTerm);
  }, 0);
}

function renderHighlighted(text, searchTerm) {
  if (!searchTerm) return text;
  const lower = text.toLowerCase();
  const index = lower.indexOf(searchTerm);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + searchTerm.length)}</mark>
      {text.slice(index + searchTerm.length)}
    </>
  );
}

function formatPrimitive(value) {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null) return 'null';
  return String(value);
}

function JsonNode({
  label,
  value,
  path,
  depth,
  expandedPaths,
  onToggle,
  onCopyPath,
  onCopyValue,
  searchTerm,
  copiedNode,
}) {
  const isExpandable = Boolean(value) && typeof value === 'object';
  const isExpanded = expandedPaths.has(path);
  const entries = isExpandable
    ? Array.isArray(value)
      ? value.map((item, index) => [String(index), item])
      : Object.entries(value)
    : [];

  const summary = Array.isArray(value)
    ? `[${value.length} items]`
    : value && typeof value === 'object'
      ? `{${entries.length} keys}`
      : formatPrimitive(value);

  return (
    <div style={{ marginLeft: depth ? 16 : 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          background: depth % 2 === 0 ? 'var(--surface)' : 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          marginBottom: 6,
        }}
      >
        <button
          type="button"
          className="btn-ghost"
          style={{ minWidth: 34, justifyContent: 'center', paddingInline: 0 }}
          onClick={() => {
            if (isExpandable) onToggle(path);
          }}
        >
          <Icon
            icon={
              isExpandable
                ? isExpanded
                  ? ICON_MAP.ChevronDown
                  : ICON_MAP.ChevronRight
                : ICON_MAP.Type
            }
            size={14}
          />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: 'var(--text)',
                fontSize: 12,
              }}
            >
              {renderHighlighted(label, searchTerm)}
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: 'var(--muted)',
                fontSize: 12,
                wordBreak: 'break-word',
              }}
            >
              {summary}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>{path}</div>
        </div>

        <button
          type="button"
          className={`copy-btn${copiedNode === `${path}:path` ? ' copied' : ''}`}
          style={{ padding: '6px 10px' }}
          onClick={() => onCopyPath(path)}
        >
          <Icon icon={copiedNode === `${path}:path` ? ICON_MAP.Check : ICON_MAP.Copy} size={12} />
          Path
        </button>

        <button
          type="button"
          className={`copy-btn${copiedNode === `${path}:value` ? ' copied' : ''}`}
          style={{ padding: '6px 10px' }}
          onClick={() => onCopyValue(isExpandable ? JSON.stringify(value, null, 2) : formatPrimitive(value), path)}
        >
          <Icon icon={copiedNode === `${path}:value` ? ICON_MAP.Check : ICON_MAP.Copy} size={12} />
          Value
        </button>
      </div>

      {isExpandable && isExpanded ? (
        <div style={{ display: 'grid', gap: 6, marginBottom: 6 }}>
          {entries.map(([nextLabel, child]) => (
            <JsonNode
              key={`${path}.${nextLabel}`}
              label={nextLabel}
              value={child}
              path={`${path}.${nextLabel}`}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
              onCopyPath={onCopyPath}
              onCopyValue={onCopyValue}
              searchTerm={searchTerm}
              copiedNode={copiedNode}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ApiResponseFormatter() {
  const [input, setInput] = useState('');
  const [expandedPaths, setExpandedPaths] = useState(new Set(['root']));
  const [search, setSearch] = useState('');
  const [copiedNode, setCopiedNode] = useState('');
  const debouncedInput = useDebounce(input, 150);
  const debouncedSearch = useDebounce(search, 150).trim().toLowerCase();

  const parsed = useMemo(() => {
    if (!debouncedInput.trim()) {
      return { value: null, error: null, formatted: '', stats: null };
    }

    try {
      const value = JSON.parse(debouncedInput);
      return {
        value,
        error: null,
        formatted: JSON.stringify(value, null, 2),
        stats: getJsonStructureStats(value),
      };
    } catch (error) {
      const details = extractErrorLocation(debouncedInput, error);
      return {
        value: null,
        formatted: '',
        stats: null,
        error:
          details.line && details.column
            ? `${details.message} (line ${details.line}, column ${details.column})`
            : details.message,
      };
    }
  }, [debouncedInput]);

  useEffect(() => {
    if (parsed.value !== null) {
      setExpandedPaths(new Set(['root']));
    }
  }, [parsed.formatted, parsed.value]);

  useEffect(() => {
    if (!copiedNode) return undefined;
    const timer = setTimeout(() => setCopiedNode(''), 1200);
    return () => clearTimeout(timer);
  }, [copiedNode]);

  const allPaths = useMemo(
    () => (parsed.value !== null ? collectExpandablePaths(parsed.value) : []),
    [parsed.value]
  );

  const matchingKeys = useMemo(
    () => (parsed.value !== null ? countMatchingKeys(parsed.value, debouncedSearch) : 0),
    [debouncedSearch, parsed.value]
  );

  async function handleCopy(text, suffix) {
    const copied = await copyToClipboard(text);
    if (copied) {
      setCopiedNode(suffix);
    }
  }

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="API JSON Response"
      inputPlaceholder='{"data":{"tools":[{"slug":"json-formatter","live":true}]}}'
      dividerLabel="Collapsible Tree"
      error={parsed.error}
      output={parsed.formatted}
      outputRenderer={
        !input.trim() ? (
          <EmptyState
            iconName="Braces"
            title="Explore JSON responses with a collapsible tree"
            message="Paste an API response to expand nested objects, inspect arrays, search for keys, and copy exact node paths or values."
          />
        ) : parsed.value !== null ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Keys',
                  value: String(parsed.stats?.keys ?? 0),
                  description: 'Object properties discovered',
                  iconName: 'Braces',
                },
                {
                  label: 'Arrays / Objects',
                  value: `${parsed.stats?.arrays ?? 0} / ${parsed.stats?.objects ?? 0}`,
                  description: 'Structured nodes in the tree',
                  iconName: 'Layers',
                },
                {
                  label: 'Search Hits',
                  value: String(matchingKeys),
                  description: 'Keys matching the current search term',
                  iconName: 'Search',
                },
              ]}
              marginBottom={16}
            />

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                maxHeight: 520,
                overflow: 'auto',
              }}
            >
              <JsonNode
                label="root"
                value={parsed.value}
                path="root"
                depth={0}
                expandedPaths={expandedPaths}
                onToggle={(path) =>
                  setExpandedPaths((current) => {
                    const next = new Set(current);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  })
                }
                onCopyPath={(path) => handleCopy(path, `${path}:path`)}
                onCopyValue={(value, path) => handleCopy(value, `${path}:value`)}
                searchTerm={debouncedSearch}
                copiedNode={copiedNode}
              />
            </div>
          </>
        ) : undefined
      }
      showEmptyState={false}
      options={
        <>
          <div className="options-label">Search Keys</div>
          <input
            type="text"
            className="textarea"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a key name..."
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
            disabled={parsed.value === null}
          />

          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setExpandedPaths(new Set(allPaths))}
              disabled={parsed.value === null}
            >
              Expand All
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setExpandedPaths(new Set(['root']))}
              disabled={parsed.value === null}
            >
              Collapse All
            </button>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: 12,
              color: 'var(--text-dim)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Copy buttons on each row let you grab either a node path or its JSON value.
          </div>

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setSearch('');
        setExpandedPaths(new Set(['root']));
        setCopiedNode('');
      }}
      copyValue={parsed.formatted}
      downloadConfig={{
        filename: 'api-response.json',
        mimeType: 'application/json;charset=utf-8',
        text: parsed.formatted,
        enabled: Boolean(parsed.formatted),
      }}
    />
  );
}
