export function getByteSize(text = '') {
  return new TextEncoder().encode(String(text)).length;
}

export function getSavingsPercent(input = '', output = '') {
  const inputBytes = getByteSize(input);
  const outputBytes = getByteSize(output);
  if (!inputBytes) return null;
  if (!outputBytes) return 100;
  return Math.round(((inputBytes - outputBytes) / inputBytes) * 100);
}

export function extractErrorLocation(input = '', errorLike) {
  const message = String(errorLike?.message || errorLike || '');
  const lineColumnMatch =
    message.match(/line\s+(\d+)\s+column\s+(\d+)/i) ||
    message.match(/at\s+line\s+(\d+),?\s+column\s+(\d+)/i) ||
    message.match(/\((\d+):(\d+)\)/);

  if (lineColumnMatch) {
    return {
      line: Number.parseInt(lineColumnMatch[1], 10),
      column: Number.parseInt(lineColumnMatch[2], 10),
      message,
    };
  }

  const positionMatch = message.match(/position\s+(\d+)/i);
  if (positionMatch) {
    const position = Number.parseInt(positionMatch[1], 10);
    const before = String(input).slice(0, position);
    const lines = before.split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
      message,
    };
  }

  return {
    line: null,
    column: null,
    message,
  };
}

export function getJsonStructureStats(value) {
  const stats = {
    keys: 0,
    arrays: 0,
    objects: 0,
    primitives: 0,
  };

  function visit(node) {
    if (Array.isArray(node)) {
      stats.arrays += 1;
      node.forEach(visit);
      return;
    }

    if (node && typeof node === 'object') {
      stats.objects += 1;
      const entries = Object.entries(node);
      stats.keys += entries.length;
      entries.forEach(([, child]) => visit(child));
      return;
    }

    stats.primitives += 1;
  }

  visit(value);
  return stats;
}

export function stripHtmlComments(input = '', removeComments = true) {
  if (!removeComments) return input;
  return String(input).replace(/<!--[\s\S]*?-->/g, '');
}

export function minifyHtml(input = '', { removeComments = true } = {}) {
  return stripHtmlComments(input, removeComments)
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function fallbackBeautifyHtml(input = '', indentSize = 2, removeComments = false) {
  const source = stripHtmlComments(input, removeComments);
  const tokens = source.match(/<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g) ?? [];
  const lines = [];
  let depth = 0;

  const inlineTags = new Set(['a', 'span', 'strong', 'em', 'b', 'i', 'code', 'small', 'label']);

  tokens.forEach((rawToken) => {
    const token = rawToken.trim();
    if (!token) return;

    if (token.startsWith('</')) {
      depth = Math.max(0, depth - 1);
    }

    const tagMatch = token.match(/^<\/?([a-zA-Z0-9-:]+)/);
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
    const isInline = inlineTags.has(tagName);
    const isComment = token.startsWith('<!--');
    const isSelfClosing = /\/>$/.test(token) || /^<(?:br|hr|img|input|meta|link)/i.test(token);

    if (token.startsWith('<') && !isInline) {
      lines.push(`${' '.repeat(depth * indentSize)}${token}`);
    } else if (token.startsWith('<')) {
      const previous = lines.pop() || '';
      lines.push(previous ? `${previous}${token}` : `${' '.repeat(depth * indentSize)}${token}`);
    } else {
      lines.push(`${' '.repeat(depth * indentSize)}${token}`);
    }

    if (!token.startsWith('</') && token.startsWith('<') && !isSelfClosing && !isComment && !isInline) {
      depth += 1;
    }
  });

  return lines.join('\n');
}

export function minifyCss(input = '', { preserveImportantComments = true } = {}) {
  const placeholders = [];
  let source = String(input);

  if (preserveImportantComments) {
    source = source.replace(/\/\*![\s\S]*?\*\//g, (match) => {
      const token = `__IMPORTANT_COMMENT_${placeholders.length}__`;
      placeholders.push(match);
      return token;
    });
  }

  source = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

  placeholders.forEach((comment, index) => {
    source = source.replace(`__IMPORTANT_COMMENT_${index}__`, comment);
  });

  return source;
}

export function beautifyCss(input = '', { indentSize = 2, preserveImportantComments = true } = {}) {
  const placeholders = [];
  let source = String(input);

  if (preserveImportantComments) {
    source = source.replace(/\/\*![\s\S]*?\*\//g, (match) => {
      const token = `__IMPORTANT_COMMENT_${placeholders.length}__`;
      placeholders.push(match);
      return token;
    });
  }

  const cleaned = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let indent = 0;
  let output = '';

  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    const nextChar = cleaned[index + 1];

    if (char === '{') {
      output = `${output.trim()} {\n`;
      indent += 1;
      output += ' '.repeat(indent * indentSize);
      continue;
    }

    if (char === '}') {
      indent = Math.max(0, indent - 1);
      output = `${output.trim()}\n${' '.repeat(indent * indentSize)}}\n${' '.repeat(indent * indentSize)}`;
      continue;
    }

    if (char === ';') {
      output = `${output.trim()};\n${' '.repeat(indent * indentSize)}`;
      continue;
    }

    if (char === ':' && nextChar !== ' ') {
      output += ': ';
      continue;
    }

    output += char;
  }

  let formatted = output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, lineIndex, lines) => line || (lineIndex > 0 && lines[lineIndex - 1]))
    .join('\n')
    .trim();

  placeholders.forEach((comment, index) => {
    formatted = formatted.replace(`__IMPORTANT_COMMENT_${index}__`, `${comment}\n`);
  });

  return formatted.replace(/\n{3,}/g, '\n\n').trim();
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function collectRegexMatches(pattern, flags, input) {
  const safeFlags = flags.includes('g') ? flags : `${flags}g`;
  const regex = new RegExp(pattern, safeFlags);
  const matches = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    matches.push({
      match: match[0],
      index: match.index,
      groups: match.slice(1),
    });

    if (match[0] === '') {
      regex.lastIndex += 1;
    }
  }

  return matches;
}

export function runRegexTool({ pattern, flags = '', input = '', mode = 'match', replacement = '' }) {
  const baseRegex = new RegExp(pattern, flags);

  if (mode === 'test') {
    const passed = baseRegex.test(input);
    return {
      passed,
      matches: collectRegexMatches(pattern, flags, input),
      output: passed ? 'Pattern matches the input.' : 'Pattern does not match the input.',
      highlighted: highlightRegexMatches(input, collectRegexMatches(pattern, flags, input)),
    };
  }

  const matches = collectRegexMatches(pattern, flags, input);

  if (mode === 'replace') {
    const safeFlags = flags.includes('g') ? flags : `${flags}g`;
    const regex = new RegExp(pattern, safeFlags);
    const output = input.replace(regex, replacement);
    return {
      matches,
      output,
      highlighted: highlightRegexMatches(input, matches),
    };
  }

  return {
    matches,
    output: matches.map((entry) => entry.match).join('\n'),
    highlighted: highlightRegexMatches(input, matches),
  };
}

export function highlightRegexMatches(input = '', matches = []) {
  if (!matches.length) {
    return escapeHtml(input);
  }

  let cursor = 0;
  let output = '';

  matches.forEach((match, index) => {
    output += escapeHtml(input.slice(cursor, match.index));
    output += `<mark data-match="${index}">${escapeHtml(match.match)}</mark>`;
    cursor = match.index + match.match.length;
  });

  output += escapeHtml(input.slice(cursor));
  return output.replace(/\n/g, '<br />');
}

function parseCronToken(token, min, max) {
  const trimmed = token.trim();
  if (!trimmed || trimmed === '*') {
    return new Set(Array.from({ length: max - min + 1 }, (_, index) => min + index));
  }

  if (/^\*\/\d+$/.test(trimmed)) {
    const step = Number.parseInt(trimmed.slice(2), 10);
    if (!step) return new Set();
    const values = new Set();
    for (let value = min; value <= max; value += step) {
      values.add(value);
    }
    return values;
  }

  const set = new Set();
  trimmed.split(',').forEach((part) => {
    if (/^\d+$/.test(part)) {
      const value = Number.parseInt(part, 10);
      if (value >= min && value <= max) {
        set.add(value);
      }
      return;
    }

    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Number.parseInt(rangeMatch[1], 10);
      const end = Number.parseInt(rangeMatch[2], 10);
      for (let value = start; value <= end; value += 1) {
        if (value >= min && value <= max) {
          set.add(value);
        }
      }
      return;
    }

    const rangeStepMatch = part.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (rangeStepMatch) {
      const start = Number.parseInt(rangeStepMatch[1], 10);
      const end = Number.parseInt(rangeStepMatch[2], 10);
      const step = Number.parseInt(rangeStepMatch[3], 10);
      if (!step) return;
      for (let value = start; value <= end; value += step) {
        if (value >= min && value <= max) {
          set.add(value);
        }
      }
    }
  });

  return set;
}

function matchesCronField(value, field, min, max) {
  return parseCronToken(field, min, max).has(value);
}

function cronMatches(date, fields, withSeconds) {
  const secondField = withSeconds ? fields.second : '0';
  const dayWildcard = fields.day.trim() === '*';
  const weekdayWildcard = fields.weekday.trim() === '*';
  const dayMatches = matchesCronField(date.getDate(), fields.day, 1, 31);
  const weekdayMatches = matchesCronField(date.getDay(), fields.weekday, 0, 6);
  const dayRule =
    dayWildcard && weekdayWildcard
      ? true
      : dayWildcard
        ? weekdayMatches
        : weekdayWildcard
          ? dayMatches
          : dayMatches || weekdayMatches;

  return (
    matchesCronField(date.getSeconds(), secondField, 0, 59) &&
    matchesCronField(date.getMinutes(), fields.minute, 0, 59) &&
    matchesCronField(date.getHours(), fields.hour, 0, 23) &&
    dayRule &&
    matchesCronField(date.getMonth() + 1, fields.month, 1, 12)
  );
}

export function getNextCronRuns(fields, { withSeconds = false, count = 5, startDate = new Date() } = {}) {
  const results = [];
  const probe = new Date(startDate);
  probe.setMilliseconds(0);
  probe.setSeconds(withSeconds ? probe.getSeconds() + 1 : 0);
  if (!withSeconds) {
    probe.setMinutes(probe.getMinutes() + 1);
  }

  const maxIterations = withSeconds ? 600000 : 200000;
  for (let step = 0; step < maxIterations && results.length < count; step += 1) {
    if (cronMatches(probe, fields, withSeconds)) {
      results.push(new Date(probe));
    }
    probe.setSeconds(probe.getSeconds() + (withSeconds ? 1 : 60));
  }

  return results;
}

export function buildCronExpression(fields, withSeconds = false) {
  if (withSeconds) {
    return [fields.second, fields.minute, fields.hour, fields.day, fields.month, fields.weekday].join(' ');
  }

  return [fields.minute, fields.hour, fields.day, fields.month, fields.weekday].join(' ');
}
