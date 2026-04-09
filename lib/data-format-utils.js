'use client';

import { XMLBuilder, XMLParser } from 'fast-xml-parser';

const DELIMITER_MAP = {
  auto: null,
  comma: ',',
  semicolon: ';',
  tab: '\t',
};

function detectDelimiter(firstLine = '') {
  const candidates = [',', ';', '\t', '|'];
  const counts = candidates.map((delimiter) => ({
    delimiter,
    count: (firstLine.match(new RegExp(delimiter === '\t' ? '\\t' : `\\${delimiter}`, 'g')) || []).length,
  }));

  const winner = counts.sort((left, right) => right.count - left.count)[0];
  return winner?.count ? winner.delimiter : ',';
}

function parseCsvRows(input, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((rowValues) => rowValues.some((value) => value !== ''));
}

export function parseCsvToJson(input, { delimiter = 'auto', trimWhitespace = true } = {}) {
  const normalized = input.replace(/\uFEFF/g, '');
  const firstLine = normalized.split(/\r?\n/, 1)[0] || '';
  const delimiterChar = DELIMITER_MAP[delimiter] ?? detectDelimiter(firstLine);
  const rows = parseCsvRows(normalized, delimiterChar);

  if (!rows.length) {
    return {
      rows: [],
      headers: [],
      delimiter: delimiterChar,
    };
  }

  const headers = rows[0].map((header, index) => {
    const nextHeader = trimWhitespace ? header.trim() : header;
    return nextHeader || `column_${index + 1}`;
  });

  return {
    headers,
    delimiter: delimiterChar,
    rows: rows.slice(1).map((rowValues) => {
      const rowObject = {};
      headers.forEach((header, index) => {
        const rawValue = rowValues[index] ?? '';
        rowObject[header] = trimWhitespace ? rawValue.trim() : rawValue;
      });
      return rowObject;
    }),
  };
}

export function flattenObject(value, prefix = '', target = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenObject(item, prefix ? `${prefix}.${index}` : String(index), target);
    });
    return target;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) => {
      flattenObject(nestedValue, prefix ? `${prefix}.${key}` : key, target);
    });
    return target;
  }

  target[prefix] = value;
  return target;
}

function escapeCsvValue(value) {
  if (value === null || typeof value === 'undefined') return '';
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function convertJsonToCsv(input, { flattenNested = true, includeHeader = true } = {}) {
  const parsed = JSON.parse(input);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const normalizedRows = rows.map((row) => {
    if (!flattenNested || !row || typeof row !== 'object' || Array.isArray(row)) {
      return row && typeof row === 'object' && !Array.isArray(row) ? row : { value: row };
    }

    return flattenObject(row);
  });
  const headers = [...new Set(normalizedRows.flatMap((row) => Object.keys(row)))];

  const lines = normalizedRows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(',')
  );

  return {
    output: includeHeader ? [headers.join(','), ...lines].join('\n') : lines.join('\n'),
    rowCount: normalizedRows.length,
    columnCount: headers.length,
  };
}

export function convertXmlToJson(input, { preserveAttributes = true, parseNumbers = true } = {}) {
  const parser = new XMLParser({
    ignoreAttributes: !preserveAttributes,
    attributeNamePrefix: '@_',
    parseTagValue: parseNumbers,
    parseAttributeValue: parseNumbers,
    trimValues: true,
  });

  const parsed = parser.parse(input);
  return JSON.stringify(parsed, null, 2);
}

export function convertJsonToXml(input, { rootName = 'root', prettyPrint = true } = {}) {
  const parsed = JSON.parse(input);
  const safeRoot = rootName.trim() || 'root';
  const payload = Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null
    ? { [safeRoot]: parsed }
    : Object.keys(parsed).length === 1 && Object.keys(parsed)[0] === safeRoot
      ? parsed
      : { [safeRoot]: parsed };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: prettyPrint,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(payload)}`;
}
