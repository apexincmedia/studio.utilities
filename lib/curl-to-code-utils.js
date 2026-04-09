const BODY_FLAGS = new Set([
  '-d',
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-urlencode',
]);

const FORM_FLAGS = new Set([
  '-F',
  '--form',
  '--form-string',
]);

const SILENT_FLAGS = new Set([
  '-s',
  '--silent',
  '--show-error',
  '-v',
  '--verbose',
  '-i',
  '--include',
  '--http1.1',
  '--http2',
]);

const WARNING_FLAGS = {
  '-k': 'TLS verification is disabled in the cURL command. Review certificate handling in the generated code.',
  '--insecure':
    'TLS verification is disabled in the cURL command. Review certificate handling in the generated code.',
  '--compressed':
    'Compressed responses are handled automatically by many clients, so this flag is omitted.',
  '--location':
    'Redirect behavior differs by client. Confirm how your runtime should follow redirects.',
  '-L': 'Redirect behavior differs by client. Confirm how your runtime should follow redirects.',
  '--retry': 'Retry options were not translated and may need to be added manually.',
  '--connect-timeout': 'Timeout options were not translated and may need to be added manually.',
  '--max-time': 'Timeout options were not translated and may need to be added manually.',
};

function uniqueWarnings(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

export function unquoteToken(token = '') {
  const trimmed = token.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const quote = trimmed[0];
    const inner = trimmed.slice(1, -1);

    if (quote === "'") {
      return inner.replace(/\\'/g, "'");
    }

    return inner
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  return trimmed.replace(/\\ /g, ' ');
}

export function tokenizeCurl(command = '') {
  const tokens = [];
  let current = '';
  let quote = null;
  let escaping = false;

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];

    if (escaping) {
      if (char !== '\n' && char !== '\r') {
        current += char;
      }
      escaping = false;
      continue;
    }

    if (char === '\\' && quote !== "'") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function encodeBase64(value = '') {
  const bytes = new TextEncoder().encode(value);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);

    output += alphabet[(triple >> 18) & 63];
    output += alphabet[(triple >> 12) & 63];
    output += typeof b === 'number' ? alphabet[(triple >> 6) & 63] : '=';
    output += typeof c === 'number' ? alphabet[triple & 63] : '=';
  }

  return output;
}

function escapeSingleQuotes(value = '') {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeDoubleQuotes(value = '') {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function detectJson(value = '') {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  return null;
}

function isProbablyFormEncoded(value = '') {
  return /^[^=&?#\s]+=[^]*$/.test(value) && !value.trim().startsWith('{');
}

function parseFormEncoded(value = '') {
  const params = new URLSearchParams(value);
  const entries = Array.from(params.entries());

  if (!entries.length) {
    return null;
  }

  return entries.reduce((accumulator, [key, entryValue]) => {
    if (key in accumulator) {
      const previous = accumulator[key];
      accumulator[key] = Array.isArray(previous)
        ? [...previous, entryValue]
        : [previous, entryValue];
    } else {
      accumulator[key] = entryValue;
    }

    return accumulator;
  }, {});
}

function serializeObject(value, indent = 2) {
  return JSON.stringify(value, null, indent);
}

function serializePythonValue(value, indent = 0) {
  const spacing = ' '.repeat(indent);
  const nextSpacing = ' '.repeat(indent + 4);

  if (Array.isArray(value)) {
    if (!value.length) return '[]';

    return `[\n${value
      .map((item) => `${nextSpacing}${serializePythonValue(item, indent + 4)}`)
      .join(',\n')}\n${spacing}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';

    return `{\n${entries
      .map(
        ([key, item]) =>
          `${nextSpacing}${JSON.stringify(key)}: ${serializePythonValue(item, indent + 4)}`
      )
      .join(',\n')}\n${spacing}}`;
  }

  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'None';
  return JSON.stringify(String(value));
}

function serializePhpValue(value, indent = 0) {
  const spacing = ' '.repeat(indent);
  const nextSpacing = ' '.repeat(indent + 4);

  if (Array.isArray(value)) {
    if (!value.length) return '[]';

    return `[\n${value
      .map((item) => `${nextSpacing}${serializePhpValue(item, indent + 4)}`)
      .join(',\n')}\n${spacing}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '[]';

    return `[\n${entries
      .map(
        ([key, item]) =>
          `${nextSpacing}${JSON.stringify(key)} => ${serializePhpValue(item, indent + 4)}`
      )
      .join(',\n')}\n${spacing}]`;
  }

  if (typeof value === 'string') return `'${escapeSingleQuotes(value)}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  return `'${escapeSingleQuotes(String(value))}'`;
}

function serializeRubyValue(value, indent = 0) {
  const spacing = ' '.repeat(indent);
  const nextSpacing = ' '.repeat(indent + 2);

  if (Array.isArray(value)) {
    if (!value.length) return '[]';

    return "[\n" + value
      .map((item) => `${nextSpacing}${serializeRubyValue(item, indent + 2)}`)
      .join(",\n") + `\n${spacing}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';

    return "{\n" + entries
      .map(
        ([key, item]) =>
          `${nextSpacing}${JSON.stringify(key)} => ${serializeRubyValue(item, indent + 2)}`
      )
      .join(",\n") + `\n${spacing}}`;
  }

  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'nil';
  return JSON.stringify(String(value));
}

function serializeGoJsonValue(value) {
  return JSON.stringify(value);
}

function serializeRustJsonValue(value) {
  return JSON.stringify(value, null, 2);
}

function looksLikeUrl(token = '') {
  return /^[a-z]+:\/\//i.test(token) || token.startsWith('localhost') || token.startsWith('/');
}

function readOptionValue(tokens, index, token) {
  if (token.includes('=')) {
    return { value: token.slice(token.indexOf('=') + 1), nextIndex: index };
  }

  return {
    value: tokens[index + 1] ?? '',
    nextIndex: index + 1,
  };
}

function parseHeader(value = '') {
  const separatorIndex = value.indexOf(':');

  if (separatorIndex === -1) {
    return [value.trim(), ''];
  }

  return [
    value.slice(0, separatorIndex).trim(),
    value.slice(separatorIndex + 1).trim(),
  ];
}

function appendQuery(url, payload) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${payload}`;
}

function formatJsHeaders(headers) {
  if (!headers.length) return '';

  return serializeObject(
    headers.reduce((accumulator, [key, value]) => {
      accumulator[key] = value;
      return accumulator;
    }, {})
  );
}

function formatPythonHeaders(headers) {
  if (!headers.length) return '{}';

  return serializePythonValue(
    headers.reduce((accumulator, [key, value]) => {
      accumulator[key] = value;
      return accumulator;
    }, {})
  );
}

function formatPhpHeaders(headers) {
  if (!headers.length) return '[]';

  return `[\n${headers
    .map(([key, value]) => `    '${escapeSingleQuotes(`${key}: ${value}`)}'`)
    .join(',\n')}\n]`;
}

function buildFormDataLines(forms) {
  return forms.map(({ key, value }) => {
    if (value.startsWith('@')) {
      const fileName = value.slice(1);
      return `formData.append(${JSON.stringify(
        key
      )}, fileInput.files?.[0] ?? new Blob([], { type: 'application/octet-stream' }), ${JSON.stringify(
        fileName
      )});`;
    }

    return `formData.append(${JSON.stringify(key)}, ${JSON.stringify(value)});`;
  });
}

export function parseCurlCommand(command = '') {
  const tokens = tokenizeCurl(command);

  if (!tokens.length) {
    throw new Error('Paste a cURL command to convert.');
  }

  const commandTokens = tokens[0] === 'curl' ? tokens.slice(1) : tokens.slice();

  if (!commandTokens.length) {
    throw new Error('Paste a complete cURL command to convert.');
  }

  const parsed = {
    url: '',
    method: 'GET',
    methodExplicit: false,
    headers: [],
    warnings: [],
    body: '',
    bodyKind: 'none',
    bodyObject: null,
    forms: [],
    followGetMode: false,
  };

  for (let index = 0; index < commandTokens.length; index += 1) {
    const token = commandTokens[index];

    if (!token.startsWith('-')) {
      if (!parsed.url && looksLikeUrl(token)) {
        parsed.url = token;
      } else if (!parsed.url) {
        parsed.url = token;
      } else {
        parsed.warnings.push(`Ignored extra token: ${token}`);
      }
      continue;
    }

    if (token === '-X' || token === '--request' || token.startsWith('--request=')) {
      const { value, nextIndex } = readOptionValue(commandTokens, index, token);
      parsed.method = unquoteToken(value).toUpperCase() || parsed.method;
      parsed.methodExplicit = true;
      index = nextIndex;
      continue;
    }

    if (/^-X[A-Za-z]+$/.test(token)) {
      parsed.method = token.slice(2).toUpperCase();
      parsed.methodExplicit = true;
      continue;
    }

    if (
      token === '--url' ||
      token.startsWith('--url=')
    ) {
      const { value, nextIndex } = readOptionValue(commandTokens, index, token);
      parsed.url = unquoteToken(value);
      index = nextIndex;
      continue;
    }

    if (token === '-I' || token === '--head') {
      parsed.method = 'HEAD';
      parsed.methodExplicit = true;
      continue;
    }

    if (token === '-G' || token === '--get') {
      parsed.followGetMode = true;
      continue;
    }

    if (
      token === '-H' ||
      token === '--header' ||
      token.startsWith('--header=') ||
      token.startsWith('-H')
    ) {
      const { value, nextIndex } =
        token === '-H' || token === '--header' || token.startsWith('--header=')
          ? readOptionValue(commandTokens, index, token)
          : { value: token.slice(2), nextIndex: index };
      const [name, headerValue] = parseHeader(unquoteToken(value));
      if (name) {
        parsed.headers.push([name, headerValue]);
      }
      index = nextIndex;
      continue;
    }

    if (
      BODY_FLAGS.has(token) ||
      token.startsWith('--data=') ||
      token.startsWith('--data-raw=') ||
      token.startsWith('--data-binary=') ||
      token.startsWith('--data-urlencode=') ||
      (token.startsWith('-d') && token !== '-d')
    ) {
      const { value, nextIndex } =
        BODY_FLAGS.has(token) || token.startsWith('--data')
          ? readOptionValue(commandTokens, index, token)
          : { value: token.slice(2), nextIndex: index };
      const cleaned = unquoteToken(value);
      parsed.body = parsed.body ? `${parsed.body}&${cleaned}` : cleaned;
      index = nextIndex;
      continue;
    }

    if (
      FORM_FLAGS.has(token) ||
      token.startsWith('--form=') ||
      token.startsWith('--form-string=')
    ) {
      const { value, nextIndex } = readOptionValue(commandTokens, index, token);
      const cleaned = unquoteToken(value);
      const separatorIndex = cleaned.indexOf('=');
      const key = separatorIndex === -1 ? cleaned : cleaned.slice(0, separatorIndex);
      const fieldValue = separatorIndex === -1 ? '' : cleaned.slice(separatorIndex + 1);
      parsed.forms.push({ key, value: fieldValue });
      index = nextIndex;
      continue;
    }

    if (
      token === '-u' ||
      token === '--user' ||
      token.startsWith('--user=')
    ) {
      const { value, nextIndex } = readOptionValue(commandTokens, index, token);
      parsed.headers.push(['Authorization', `Basic ${encodeBase64(unquoteToken(value))}`]);
      index = nextIndex;
      continue;
    }

    if (
      token === '-A' ||
      token === '--user-agent' ||
      token.startsWith('--user-agent=')
    ) {
      const { value, nextIndex } = readOptionValue(commandTokens, index, token);
      parsed.headers.push(['User-Agent', unquoteToken(value)]);
      index = nextIndex;
      continue;
    }

    if (
      token === '-e' ||
      token === '--referer' ||
      token.startsWith('--referer=')
    ) {
      const { value, nextIndex } = readOptionValue(commandTokens, index, token);
      parsed.headers.push(['Referer', unquoteToken(value)]);
      index = nextIndex;
      continue;
    }

    if (
      token === '-b' ||
      token === '--cookie' ||
      token.startsWith('--cookie=')
    ) {
      const { value, nextIndex } = readOptionValue(commandTokens, index, token);
      parsed.headers.push(['Cookie', unquoteToken(value)]);
      index = nextIndex;
      continue;
    }

    if (token in WARNING_FLAGS) {
      parsed.warnings.push(WARNING_FLAGS[token]);
      if (token.includes('=')) {
        continue;
      }
      if (['--retry', '--connect-timeout', '--max-time'].includes(token)) {
        index += 1;
      }
      continue;
    }

    if (SILENT_FLAGS.has(token)) {
      continue;
    }

    parsed.warnings.push(`Ignored unsupported flag: ${token}`);
  }

  if (!parsed.url) {
    throw new Error('Could not find a request URL in that cURL command.');
  }

  if (parsed.forms.length) {
    parsed.bodyKind = 'form-data';
    if (!parsed.methodExplicit) {
      parsed.method = 'POST';
    }
    if (parsed.forms.some((field) => field.value.startsWith('@'))) {
      parsed.warnings.push(
        'File uploads were converted into placeholders. Replace them with real browser or runtime file objects.'
      );
    }
  } else if (parsed.body) {
    const contentTypeHeader = parsed.headers.find(
      ([name]) => name.toLowerCase() === 'content-type'
    );
    const contentType = contentTypeHeader?.[1]?.toLowerCase() ?? '';
    const jsonBody = detectJson(parsed.body);

    if (jsonBody !== null || contentType.includes('application/json')) {
      parsed.bodyKind = 'json';
      parsed.bodyObject = jsonBody;
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      isProbablyFormEncoded(parsed.body)
    ) {
      parsed.bodyKind = 'form';
      parsed.bodyObject = parseFormEncoded(parsed.body);
    } else {
      parsed.bodyKind = 'text';
    }

    if (!parsed.methodExplicit) {
      parsed.method = 'POST';
    }
  }

  if (parsed.followGetMode && parsed.body) {
    parsed.url = appendQuery(parsed.url, parsed.body);
    parsed.body = '';
    parsed.bodyKind = 'none';
    parsed.bodyObject = null;
    parsed.method = 'GET';
  }

  parsed.warnings = uniqueWarnings(parsed.warnings);
  return parsed;
}

function buildJavaScriptFetch(parsed) {
  const lines = [`const url = ${JSON.stringify(parsed.url)};`, ''];

  if (parsed.bodyKind === 'form-data') {
    lines.push('const formData = new FormData();');
    lines.push(...buildFormDataLines(parsed.forms));
    lines.push('');
  } else if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push(`const payload = ${serializeObject(parsed.bodyObject)};`);
    lines.push('');
  } else if (parsed.bodyKind === 'form' && parsed.bodyObject) {
    lines.push(`const form = ${serializeObject(parsed.bodyObject)};`);
    lines.push('');
  }

  lines.push('const response = await fetch(url, {');
  lines.push(`  method: ${JSON.stringify(parsed.method)},`);

  if (parsed.headers.length) {
    lines.push(`  headers: ${formatJsHeaders(parsed.headers)},`);
  }

  if (parsed.bodyKind === 'json') {
    lines.push(
      parsed.bodyObject !== null
        ? '  body: JSON.stringify(payload),'
        : `  body: ${JSON.stringify(parsed.body)},`
    );
  } else if (parsed.bodyKind === 'form') {
    lines.push(
      parsed.bodyObject
        ? '  body: new URLSearchParams(form),'
        : `  body: ${JSON.stringify(parsed.body)},`
    );
  } else if (parsed.bodyKind === 'form-data') {
    lines.push('  body: formData,');
  } else if (parsed.bodyKind === 'text') {
    lines.push(`  body: ${JSON.stringify(parsed.body)},`);
  }

  lines.push('});');
  lines.push('');
  lines.push('if (!response.ok) {');
  lines.push("  throw new Error(`HTTP ${response.status}`);");
  lines.push('}');
  lines.push('');
  lines.push('const data = await response.json();');
  lines.push('console.log(data);');

  return lines.join('\n');
}

function buildJavaScriptAxios(parsed) {
  const lines = ["import axios from 'axios';", ''];

  if (parsed.bodyKind === 'form-data') {
    lines.push('const formData = new FormData();');
    lines.push(...buildFormDataLines(parsed.forms));
    lines.push('');
  } else if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push(`const payload = ${serializeObject(parsed.bodyObject)};`);
    lines.push('');
  } else if (parsed.bodyKind === 'form' && parsed.bodyObject) {
    lines.push(`const form = ${serializeObject(parsed.bodyObject)};`);
    lines.push('');
  }

  lines.push('const response = await axios({');
  lines.push(`  url: ${JSON.stringify(parsed.url)},`);
  lines.push(`  method: ${JSON.stringify(parsed.method.toLowerCase())},`);

  if (parsed.headers.length) {
    lines.push(`  headers: ${formatJsHeaders(parsed.headers)},`);
  }

  if (parsed.bodyKind === 'json') {
    lines.push(
      parsed.bodyObject !== null
        ? '  data: payload,'
        : `  data: ${JSON.stringify(parsed.body)},`
    );
  } else if (parsed.bodyKind === 'form') {
    lines.push(
      parsed.bodyObject
        ? '  data: new URLSearchParams(form),'
        : `  data: ${JSON.stringify(parsed.body)},`
    );
  } else if (parsed.bodyKind === 'form-data') {
    lines.push('  data: formData,');
  } else if (parsed.bodyKind === 'text') {
    lines.push(`  data: ${JSON.stringify(parsed.body)},`);
  }

  lines.push('});');
  lines.push('');
  lines.push('console.log(response.data);');

  return lines.join('\n');
}

function buildPython(parsed) {
  const lines = ['import requests', ''];
  const method = parsed.method.toUpperCase();

  lines.push(`url = ${JSON.stringify(parsed.url)}`);

  if (parsed.headers.length) {
    lines.push(`headers = ${formatPythonHeaders(parsed.headers)}`);
  }

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push(`payload = ${serializePythonValue(parsed.bodyObject)}`);
  } else if (parsed.bodyKind === 'form' && parsed.bodyObject) {
    lines.push(`payload = ${serializePythonValue(parsed.bodyObject)}`);
  } else if (parsed.bodyKind === 'text') {
    lines.push(`payload = ${JSON.stringify(parsed.body)}`);
  } else if (parsed.bodyKind === 'form-data') {
    lines.push(
      '# Multipart form uploads vary by runtime. Replace placeholder values with files or strings as needed.'
    );
    lines.push(
      `files = ${serializePythonValue(
        parsed.forms.reduce((accumulator, field) => {
          accumulator[field.key] = field.value.startsWith('@') ? field.value.slice(1) : field.value;
          return accumulator;
        }, {})
      )}`
    );
  }

  lines.push('');

  const requestArgs = [`${JSON.stringify(method)}`, 'url'];
  if (parsed.headers.length) requestArgs.push('headers=headers');

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    requestArgs.push('json=payload');
  } else if (parsed.bodyKind === 'json') {
    requestArgs.push(`data=${JSON.stringify(parsed.body)}`);
  } else if (parsed.bodyKind === 'form') {
    requestArgs.push(parsed.bodyObject ? 'data=payload' : `data=${JSON.stringify(parsed.body)}`);
  } else if (parsed.bodyKind === 'text') {
    requestArgs.push('data=payload');
  } else if (parsed.bodyKind === 'form-data') {
    requestArgs.push('files=files');
  }

  lines.push(`response = requests.request(${requestArgs.join(', ')})`);
  lines.push('print(response.text)');

  return lines.join('\n');
}

function buildPhp(parsed) {
  const lines = ['<?php', '', `$url = '${escapeSingleQuotes(parsed.url)}';`];

  if (parsed.headers.length) {
    lines.push(`$headers = ${formatPhpHeaders(parsed.headers)};`);
  }

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push(`$payload = json_encode(${serializePhpValue(parsed.bodyObject)});`);
  } else if (parsed.bodyKind === 'form' && parsed.bodyObject) {
    lines.push(`$payload = http_build_query(${serializePhpValue(parsed.bodyObject)});`);
  } else if (parsed.bodyKind === 'text' || parsed.bodyKind === 'json' || parsed.bodyKind === 'form') {
    lines.push(`$payload = '${escapeSingleQuotes(parsed.body)}';`);
  } else if (parsed.bodyKind === 'form-data') {
    lines.push(
      '// Multipart conversion is partially stubbed here. Replace placeholder values with CURLFile or string fields as needed.'
    );
    lines.push(
      `$payload = ${serializePhpValue(
        parsed.forms.reduce((accumulator, field) => {
          accumulator[field.key] = field.value.startsWith('@') ? field.value.slice(1) : field.value;
          return accumulator;
        }, {})
      )};`
    );
  }

  lines.push('');
  lines.push('$ch = curl_init($url);');
  lines.push('curl_setopt_array($ch, [');
  lines.push('    CURLOPT_RETURNTRANSFER => true,');
  lines.push(`    CURLOPT_CUSTOMREQUEST => '${escapeSingleQuotes(parsed.method)}',`);

  if (parsed.headers.length) {
    lines.push('    CURLOPT_HTTPHEADER => $headers,');
  }

  if (parsed.bodyKind !== 'none') {
    lines.push('    CURLOPT_POSTFIELDS => $payload,');
  }

  lines.push(']);');
  lines.push('');
  lines.push('$response = curl_exec($ch);');
  lines.push('');
  lines.push('if ($response === false) {');
  lines.push("    throw new RuntimeException(curl_error($ch));");
  lines.push('}');
  lines.push('');
  lines.push('curl_close($ch);');
  lines.push('echo $response;');

  return lines.join('\n');
}

function buildRuby(parsed) {
  const requestClass = {
    GET: 'Net::HTTP::Get',
    POST: 'Net::HTTP::Post',
    PUT: 'Net::HTTP::Put',
    PATCH: 'Net::HTTP::Patch',
    DELETE: 'Net::HTTP::Delete',
    HEAD: 'Net::HTTP::Head',
  }[parsed.method] ?? 'Net::HTTPGenericRequest';

  const lines = [
    "require 'net/http'",
    "require 'uri'",
  ];

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push("require 'json'");
  }

  lines.push('', `uri = URI(${JSON.stringify(parsed.url)})`);
  lines.push('http = Net::HTTP.new(uri.host, uri.port)');
  lines.push("http.use_ssl = uri.scheme == 'https'");
  lines.push(`request = ${requestClass}.new(uri)`);

  if (parsed.headers.length) {
    lines.push('');
    parsed.headers.forEach(([key, value]) => {
      lines.push(`request[${JSON.stringify(key)}] = ${JSON.stringify(value)}`);
    });
  }

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push('');
    lines.push(`payload = ${serializeRubyValue(parsed.bodyObject)}`);
    lines.push('request.body = JSON.generate(payload)');
  } else if (parsed.bodyKind === 'form' && parsed.bodyObject) {
    lines.push('');
    lines.push(`payload = ${serializeRubyValue(parsed.bodyObject)}`);
    lines.push('request.set_form_data(payload)');
  } else if (parsed.bodyKind === 'form-data') {
    lines.push('');
    lines.push(
      '# Multipart uploads need extra handling in Ruby. Replace the placeholder Hash with the right upload objects.'
    );
    lines.push(
      `payload = ${serializeRubyValue(
        parsed.forms.reduce((accumulator, field) => {
          accumulator[field.key] = field.value.startsWith('@') ? field.value.slice(1) : field.value;
          return accumulator;
        }, {})
      )}`
    );
    lines.push('request.set_form(payload, "multipart/form-data")');
  } else if (parsed.bodyKind === 'text' || parsed.bodyKind === 'json' || parsed.bodyKind === 'form') {
    lines.push('');
    lines.push(`request.body = ${JSON.stringify(parsed.body)}`);
  }

  lines.push('');
  lines.push('response = http.request(request)');
  lines.push('puts response.body');

  return lines.join('\n');
}

function buildGo(parsed) {
  const imports = ['"fmt"', '"io"', '"net/http"', '"strings"'];
  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    imports.push('"bytes"', '"encoding/json"');
  }

  const lines = ['package main', '', 'import (', ...imports.map((entry) => `    ${entry}`), ')', '', 'func main() {'];

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push(`    payload := ${JSON.stringify(serializeGoJsonValue(parsed.bodyObject))}`);
    lines.push('    body := bytes.NewBufferString(payload)');
  } else if (parsed.bodyKind === 'text' || parsed.bodyKind === 'json' || parsed.bodyKind === 'form') {
    lines.push(`    body := strings.NewReader(${JSON.stringify(parsed.body)})`);
  } else if (parsed.bodyKind === 'form-data') {
    lines.push('    body := strings.NewReader("")');
    lines.push('    // Multipart uploads need mime/multipart handling added for production use.');
  } else {
    lines.push('    body := http.NoBody');
  }

  lines.push(`    req, err := http.NewRequest(${JSON.stringify(parsed.method)}, ${JSON.stringify(parsed.url)}, body)`);
  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');

  if (parsed.headers.length) {
    lines.push('');
    parsed.headers.forEach(([key, value]) => {
      lines.push(`    req.Header.Set(${JSON.stringify(key)}, ${JSON.stringify(value)})`);
    });
  }

  lines.push('');
  lines.push('    client := &http.Client{}');
  lines.push('    res, err := client.Do(req)');
  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');
  lines.push('    defer res.Body.Close()');
  lines.push('');
  lines.push('    responseBody, err := io.ReadAll(res.Body)');
  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');
  lines.push('');
  lines.push('    fmt.Println(string(responseBody))');
  lines.push('}');

  return lines.join('\n');
}

function buildRust(parsed) {
  const lines = [
    'use reqwest::blocking::Client;',
  ];

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push('use serde_json::json;');
  }

  lines.push('');
  lines.push('fn main() -> Result<(), Box<dyn std::error::Error>> {');
  lines.push('    let client = Client::new();');

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push(`    let payload = json!(${serializeRustJsonValue(parsed.bodyObject)});`);
  }

  lines.push(
    `    let response = client.${parsed.method.toLowerCase()}(${JSON.stringify(parsed.url)})`
  );

  parsed.headers.forEach(([key, value]) => {
    lines.push(`        .header(${JSON.stringify(key)}, ${JSON.stringify(value)})`);
  });

  if (parsed.bodyKind === 'json' && parsed.bodyObject !== null) {
    lines.push('        .json(&payload)');
  } else if (parsed.bodyKind === 'form' && parsed.bodyObject) {
    lines.push(`        .form(&${serializeRustJsonValue(parsed.bodyObject)})`);
  } else if (parsed.bodyKind === 'text' || parsed.bodyKind === 'json' || parsed.bodyKind === 'form') {
    lines.push(`        .body(${JSON.stringify(parsed.body)})`);
  } else if (parsed.bodyKind === 'form-data') {
    lines.push('        // Multipart uploads need reqwest::multipart configuration added here');
  }

  lines.push('        .send()?;');
  lines.push('');
  lines.push('    println!("{}", response.text()?);');
  lines.push('    Ok(())');
  lines.push('}');

  return lines.join('\n');
}

export function convertCurlCommand(command, target = 'js-fetch') {
  const parsed = parseCurlCommand(command);

  const generators = {
    'js-fetch': buildJavaScriptFetch,
    'js-axios': buildJavaScriptAxios,
    python: buildPython,
    php: buildPhp,
    ruby: buildRuby,
    go: buildGo,
    rust: buildRust,
  };

  const generator = generators[target];

  if (!generator) {
    throw new Error('Choose a supported language target.');
  }

  return {
    output: generator(parsed),
    warnings: parsed.warnings,
    parsed: {
      url: parsed.url,
      method: parsed.method,
      headerCount: parsed.headers.length,
      bodyKind: parsed.bodyKind,
      hasBody: parsed.bodyKind !== 'none',
      formFieldCount: parsed.forms.length,
    },
  };
}
