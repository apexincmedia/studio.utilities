/**
 * Shared text-processing utilities for Apex Studio Utilities.
 * Pure functions only. Safe to reuse across client-side tools.
 */

export function normalizeLineBreaks(text = '') {
  return String(text).replace(/\r\n?/g, '\n');
}

export function splitLines(text = '') {
  return normalizeLineBreaks(text).split('\n');
}

export function getWords(text = '') {
  return normalizeLineBreaks(text).trim().match(/\S+/g) ?? [];
}

export function getSentences(text = '') {
  return (
    normalizeLineBreaks(text)
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}

export function getParagraphs(text = '') {
  return normalizeLineBreaks(text)
    .trim()
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function formatDurationLabel(minutesFloat = 0) {
  const totalSeconds = Math.max(0, Math.round(minutesFloat * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0 && seconds === 0) return '0 sec';
  if (minutes === 0) return `${seconds} sec`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

export function getWordCounterMetrics(text = '') {
  const normalized = normalizeLineBreaks(text);
  const words = getWords(normalized);
  const sentences = getSentences(normalized);
  const paragraphs = getParagraphs(normalized);
  const characters = normalized.length;
  const charactersNoSpaces = normalized.replace(/\s/g, '').length;

  return {
    wordCount: words.length,
    characterCount: characters,
    characterCountNoSpaces: charactersNoSpaces,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    readingTime: formatDurationLabel(words.length / 238),
    speakingTime: formatDurationLabel(words.length / 130),
    averageWordLength:
      words.length > 0
        ? (
            words.reduce((total, word) => total + word.replace(/[^\p{L}\p{N}]/gu, '').length, 0) /
            words.length
          ).toFixed(1)
        : '0.0',
  };
}

export function splitIntoWordParts(text = '') {
  return normalizeLineBreaks(text)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_./-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function capitalizeWord(word = '') {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toSentenceCase(text = '') {
  const normalized = normalizeLineBreaks(text).toLowerCase();
  return normalized.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) => match.toUpperCase());
}

export const CASE_TRANSFORMS = {
  uppercase: (text = '') => text.toUpperCase(),
  lowercase: (text = '') => text.toLowerCase(),
  title: (text = '') =>
    normalizeLineBreaks(text).replace(/\S+/g, (word) => capitalizeWord(word)),
  sentence: (text = '') => toSentenceCase(text),
  camel: (text = '') => {
    const parts = splitIntoWordParts(text);
    if (!parts.length) return '';
    return parts[0].toLowerCase() + parts.slice(1).map(capitalizeWord).join('');
  },
  pascal: (text = '') => splitIntoWordParts(text).map(capitalizeWord).join(''),
  snake: (text = '') => splitIntoWordParts(text).map((part) => part.toLowerCase()).join('_'),
  kebab: (text = '') => splitIntoWordParts(text).map((part) => part.toLowerCase()).join('-'),
  constant: (text = '') => splitIntoWordParts(text).map((part) => part.toUpperCase()).join('_'),
};

export function slugifyText(
  text = '',
  { separator = '-', lowercase = true, maxLength = 0 } = {}
) {
  const safeSeparator = separator || '-';
  const normalized = normalizeLineBreaks(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let slug = normalized
    .replace(/[^\p{L}\p{N}]+/gu, safeSeparator)
    .replace(new RegExp(`${escapeRegExp(safeSeparator)}{2,}`, 'g'), safeSeparator)
    .replace(new RegExp(`^${escapeRegExp(safeSeparator)}+|${escapeRegExp(safeSeparator)}+$`, 'g'), '');

  if (lowercase) slug = slug.toLowerCase();

  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    slug = slug.replace(new RegExp(`${escapeRegExp(safeSeparator)}+$`, 'g'), '');
  }

  return slug;
}

export function escapeRegExp(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function shuffleArray(items = []) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function countSyllables(word = '') {
  const normalized = word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/g, '')
    .replace(/^y/, '');

  if (!normalized) return 0;
  const matches = normalized.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 0);
}

export function getReadabilityMetrics(text = '') {
  const normalized = normalizeLineBreaks(text);
  const words = getWords(normalized);
  const sentences = getSentences(normalized);
  const syllableCount = words.reduce((total, word) => total + countSyllables(word), 0);
  const complexWords = words.filter((word) => countSyllables(word) >= 3).length;

  if (!words.length || !sentences.length) {
    return null;
  }

  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = syllableCount / words.length;
  const fleschReadingEase =
    206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const fleschKincaidGrade =
    0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const gunningFog =
    0.4 * (wordsPerSentence + 100 * (complexWords / words.length));
  const smog =
    1.043 * Math.sqrt(complexWords * (30 / sentences.length)) + 3.1291;

  const roundedGrade = Math.max(1, Math.round(fleschKincaidGrade));

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    syllableCount,
    complexWordCount: complexWords,
    wordsPerSentence,
    fleschReadingEase,
    fleschKincaidGrade,
    gunningFog,
    smog,
    roundedGrade,
    interpretation: getReadabilityInterpretation(fleschReadingEase, roundedGrade),
  };
}

export function getReadabilityInterpretation(fleschReadingEase, grade) {
  if (fleschReadingEase >= 90) return `Grade ${grade} - very easy to read`;
  if (fleschReadingEase >= 80) return `Grade ${grade} - easy for most readers`;
  if (fleschReadingEase >= 70) return `Grade ${grade} - fairly easy`;
  if (fleschReadingEase >= 60) return `Grade ${grade} - plain language`;
  if (fleschReadingEase >= 50) return `Grade ${grade} - moderately difficult`;
  if (fleschReadingEase >= 30) return `Grade ${grade} - difficult`;
  return `Grade ${grade} - very difficult`;
}

export function buildNumberRegex({
  includeDecimals = true,
  includeNegatives = true,
} = {}) {
  if (includeDecimals) {
    return new RegExp(
      `${includeNegatives ? '[-+]?' : ''}(?:\\d+\\.\\d+|\\d+)`,
      'g'
    );
  }

  return new RegExp(`${includeNegatives ? '[-+]?' : ''}\\d+`, 'g');
}

export function extractNumbersFromText(
  text = '',
  {
    includeDecimals = true,
    includeNegatives = true,
    deduplicate = true,
    sort = 'none',
  } = {}
) {
  const matches = normalizeLineBreaks(text).match(
    buildNumberRegex({ includeDecimals, includeNegatives })
  ) ?? [];

  let values = deduplicate ? Array.from(new Set(matches)) : matches;

  if (sort === 'asc') {
    values = [...values].sort((left, right) => Number(left) - Number(right));
  }

  if (sort === 'desc') {
    values = [...values].sort((left, right) => Number(right) - Number(left));
  }

  return values;
}

export function extractEmailsFromText(
  text = '',
  { deduplicate = true, sort = false } = {}
) {
  const matches =
    normalizeLineBreaks(text).match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) ?? [];

  let values = deduplicate ? Array.from(new Set(matches)) : matches;
  if (sort) {
    values = [...values].sort((left, right) => left.localeCompare(right));
  }

  return values;
}
