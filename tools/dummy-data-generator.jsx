'use client';

import { startTransition, useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';

const FIELD_CONFIGS = {
  id: { label: 'UUID', value: (faker) => faker.string.uuid() },
  name: { label: 'Name', value: (faker) => faker.person.fullName() },
  email: { label: 'Email', value: (faker) => faker.internet.email() },
  phone: { label: 'Phone', value: (faker) => faker.phone.number() },
  company: { label: 'Company', value: (faker) => faker.company.name() },
  url: { label: 'URL', value: (faker) => faker.internet.url() },
  ip: { label: 'IP', value: (faker) => faker.internet.ip() },
  address: { label: 'Address', value: (faker) => faker.location.streetAddress() },
  date: { label: 'Date', value: (faker) => faker.date.recent().toISOString() },
  number: { label: 'Number', value: (faker) => faker.number.int({ min: 1, max: 9999 }) },
  boolean: { label: 'Boolean', value: (faker) => faker.datatype.boolean() },
};

function escapeCsv(value) {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function rowsToCsv(rows, fields) {
  const header = fields.join(',');
  const body = rows.map((row) => fields.map((field) => escapeCsv(row[field])).join(','));
  return [header, ...body].join('\n');
}

function rowsToSql(rows, fields) {
  const columnList = fields.join(', ');
  const values = rows.map((row) => {
    const serialized = fields
      .map((field) => {
        const value = row[field];
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        return `'${String(value).replace(/'/g, "''")}'`;
      })
      .join(', ');
    return `(${serialized})`;
  });

  return `INSERT INTO dummy_data (${columnList})\nVALUES\n${values.join(',\n')};`;
}

export default function DummyDataGenerator() {
  const [selectedFields, setSelectedFields] = useState(['name', 'email', 'company']);
  const [rowCount, setRowCount] = useState(12);
  const [outputFormat, setOutputFormat] = useState('json');
  const [rows, setRows] = useState([]);

  const availableFields = Object.keys(FIELD_CONFIGS).filter((field) => !selectedFields.includes(field));

  const output = useMemo(() => {
    if (!rows.length) return '';
    if (outputFormat === 'csv') return rowsToCsv(rows, selectedFields);
    if (outputFormat === 'sql') return rowsToSql(rows, selectedFields);
    return JSON.stringify(rows, null, 2);
  }, [outputFormat, rows, selectedFields]);

  async function generateData() {
    const fakerModule = await import('@faker-js/faker');
    const faker = fakerModule.faker;
    const nextRows = Array.from({ length: rowCount }, () =>
      selectedFields.reduce((record, field) => {
        record[field] = FIELD_CONFIGS[field].value(faker);
        return record;
      }, {})
    );

    startTransition(() => {
      setRows(nextRows);
    });
  }

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!rows.length}
      emptyState={
        <EmptyState
          iconName="Database"
          title="Generate realistic fixture data on demand"
          message="Pick fields, choose how many rows you want, and export the result as JSON, CSV, or SQL insert statements."
        />
      }
      outputRenderer={
        rows.length ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Rows',
                  value: String(rows.length),
                  description: 'Records generated in the current batch',
                  iconName: 'Layers',
                },
                {
                  label: 'Fields',
                  value: String(selectedFields.length),
                  description: 'Columns included in each row',
                  iconName: 'Database',
                },
                {
                  label: 'Format',
                  value: outputFormat.toUpperCase(),
                  description: 'Current output representation',
                  iconName: 'FileCode',
                },
              ]}
              marginBottom={16}
            />
            <div className="panel-label">Generated Output</div>
            <textarea className="textarea" value={output} readOnly style={{ minHeight: 420 }} />
          </>
        ) : null
      }
      options={
        <>
          <div className="options-label">Selected Fields</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {selectedFields.map((field, index) => (
              <div
                key={field}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--text)',
                }}
              >
                <span>{FIELD_CONFIGS[field].label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn-ghost" onClick={() => setSelectedFields((current) => index > 0 ? current.map((item, itemIndex) => itemIndex === index - 1 ? current[index] : itemIndex === index ? current[index - 1] : item) : current)} disabled={index === 0}>Up</button>
                  <button type="button" className="btn-ghost" onClick={() => setSelectedFields((current) => index < current.length - 1 ? current.map((item, itemIndex) => itemIndex === index + 1 ? current[index] : itemIndex === index ? current[index + 1] : item) : current)} disabled={index === selectedFields.length - 1}>Down</button>
                  <button type="button" className="btn-ghost" onClick={() => setSelectedFields((current) => current.filter((item) => item !== field))}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="options-label">Add Field</div>
          <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            {availableFields.map((field) => (
              <button
                key={field}
                type="button"
                className="mode-btn"
                onClick={() => setSelectedFields((current) => [...current, field])}
              >
                {FIELD_CONFIGS[field].label}
              </button>
            ))}
          </div>

          <div className="options-label">Row Count</div>
          <div className="range-wrap" style={{ marginBottom: 16 }}>
            <input type="range" min="1" max="10000" value={rowCount} onChange={(event) => setRowCount(Number(event.target.value))} />
            <span className="range-value">{rowCount}</span>
          </div>

          <div className="options-label">Output Format</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['json', 'JSON'],
              ['csv', 'CSV'],
              ['sql', 'SQL'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${outputFormat === value ? ' active' : ''}`}
                onClick={() => setOutputFormat(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="panel-divider" />
        </>
      }
      primaryAction={{
        label: 'Generate Data',
        iconName: 'Zap',
        onClick: generateData,
        disabled: !selectedFields.length,
      }}
      onClear={() => {
        setSelectedFields(['name', 'email', 'company']);
        setRowCount(12);
        setOutputFormat('json');
        setRows([]);
      }}
      copyValue={output}
      downloadConfig={{
        filename:
          outputFormat === 'csv'
            ? 'dummy-data.csv'
            : outputFormat === 'sql'
              ? 'dummy-data.sql'
              : 'dummy-data.json',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
