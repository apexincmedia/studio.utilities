'use client';

import { readAsArrayBuffer } from '@/lib/tool-utils';
import { loadPdfJs } from '@/lib/pdf-tool-utils';
import { renderHtmlToPdfBlob } from '@/lib/document-pdf-utils';

const PDF_LINE_THRESHOLD = 4;
const PDF_COLUMN_THRESHOLD = 24;
const MAX_PDF_COLUMNS = 8;

function normalizeWhitespace(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalizePdfItem(item) {
  const width = Number(item.width) || 0;
  const height = Number(item.height) || 0;
  const x = Number(item.transform?.[4]) || 0;
  const y = Number(item.transform?.[5]) || 0;

  return {
    text: item.str ?? '',
    x,
    y,
    width,
    height,
  };
}

function itemsBelongToSameLine(line, item) {
  return Math.abs(line.y - item.y) <= PDF_LINE_THRESHOLD;
}

function buildPdfLineText(tokens) {
  if (!tokens.length) return '';

  const sorted = [...tokens].sort((left, right) => left.x - right.x);
  let output = '';
  let previousRight = null;

  sorted.forEach((token) => {
    const text = token.text.trim();
    if (!text) return;

    if (!output) {
      output = text;
      previousRight = token.x + token.width;
      return;
    }

    const gap = token.x - (previousRight ?? token.x);
    const shouldAddSpace = gap > Math.max(5, token.height * 0.35);

    output += shouldAddSpace ? ` ${text}` : text;
    previousRight = token.x + token.width;
  });

  return normalizeWhitespace(output);
}

function groupPdfItemsIntoLines(items) {
  const sorted = [...items]
    .map(normalizePdfItem)
    .filter((item) => item.text.trim())
    .sort((left, right) => {
      if (Math.abs(right.y - left.y) > PDF_LINE_THRESHOLD) {
        return right.y - left.y;
      }
      return left.x - right.x;
    });

  const lines = [];

  sorted.forEach((item) => {
    const existing = lines.find((line) => itemsBelongToSameLine(line, item));

    if (existing) {
      const previousCount = existing.tokens.length;
      existing.tokens.push(item);
      existing.y = (existing.y * previousCount + item.y) / (previousCount + 1);
      return;
    }

    lines.push({
      y: item.y,
      tokens: [item],
    });
  });

  return lines
    .map((line) => {
      const tokens = [...line.tokens].sort((left, right) => left.x - right.x);
      return {
        y: line.y,
        tokens,
        text: buildPdfLineText(tokens),
      };
    })
    .filter((line) => line.text);
}

function buildColumnAnchors(lines) {
  const anchors = [];

  lines
    .flatMap((line) => line.tokens)
    .sort((left, right) => left.x - right.x)
    .forEach((token) => {
      const existing = anchors.find((anchor) => Math.abs(anchor.value - token.x) <= PDF_COLUMN_THRESHOLD);

      if (existing) {
        existing.value = (existing.value * existing.count + token.x) / (existing.count + 1);
        existing.count += 1;
        return;
      }

      if (anchors.length < MAX_PDF_COLUMNS) {
        anchors.push({ value: token.x, count: 1 });
      }
    });

  return anchors
    .sort((left, right) => left.value - right.value)
    .map((anchor) => anchor.value);
}

function buildTableRowsForPage(page, detectTables) {
  if (!page.lines.length) {
    return [['']];
  }

  if (!detectTables) {
    return page.lines.map((line) => [line.text]);
  }

  const anchors = buildColumnAnchors(page.lines);

  if (anchors.length < 2) {
    return page.lines.map((line) => [line.text]);
  }

  return page.lines
    .map((line) => {
      const row = Array.from({ length: anchors.length }, () => []);

      line.tokens.forEach((token) => {
        let columnIndex = 0;

        for (let index = anchors.length - 1; index >= 0; index -= 1) {
          if (token.x >= anchors[index] - PDF_COLUMN_THRESHOLD / 2) {
            columnIndex = index;
            break;
          }
        }

        row[columnIndex].push(token.text.trim());
      });

      return row.map((cell) => normalizeWhitespace(cell.join(' ')));
    })
    .filter((row) => row.some((cell) => cell));
}

function buildWorkbookSheetSummary(xlsx, workbook) {
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const range = sheet['!ref'] ? xlsx.utils.decode_range(sheet['!ref']) : null;

    return {
      name,
      rowCount: range ? range.e.r + 1 : 0,
      columnCount: range ? range.e.c + 1 : 0,
    };
  });
}

async function loadWorkbook(file) {
  const xlsxModule = await import('xlsx');
  const xlsx = xlsxModule.default ?? xlsxModule;
  const buffer = await readAsArrayBuffer(file);
  const workbook = xlsx.read(buffer, { type: 'array' });

  return {
    xlsx,
    workbook,
    sheets: buildWorkbookSheetSummary(xlsx, workbook),
  };
}

function wrapHtmlDocument(content, { title = '', subtitle = '' } = {}) {
  return `
    <article>
      ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
      ${subtitle ? `<p style="color: rgb(75, 85, 99); margin-top: -8px;">${escapeHtml(subtitle)}</p>` : ''}
      ${content}
    </article>
  `;
}

export async function extractPdfPages(file) {
  const pdfjs = await loadPdfJs();
  const buffer = await readAsArrayBuffer(file);
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = groupPdfItemsIntoLines(content.items || []);
      const text = lines.map((line) => line.text).join('\n').trim();

      pages.push({
        pageNumber,
        lines,
        text,
      });

      if (typeof page.cleanup === 'function') {
        page.cleanup();
      }
    }
  } finally {
    if (typeof pdf.cleanup === 'function') {
      pdf.cleanup();
    }
    if (typeof pdf.destroy === 'function') {
      pdf.destroy();
    }
  }

  return {
    pageCount: pages.length,
    pages,
  };
}

export function buildPdfPlainText(pages = []) {
  return pages
    .map((page) => {
      const heading = pages.length > 1 ? `Page ${page.pageNumber}\n` : '';
      return `${heading}${page.text || '[No selectable text detected on this page.]'}`.trim();
    })
    .join('\n\n');
}

export async function buildPdfWordBlob(pages = []) {
  const docxModule = await import('docx');
  const {
    Document,
    HeadingLevel,
    Packer,
    PageBreak,
    Paragraph,
  } = docxModule;

  const children = [];

  pages.forEach((page, index) => {
    if (pages.length > 1) {
      children.push(
        new Paragraph({
          text: `Page ${page.pageNumber}`,
          heading: HeadingLevel.HEADING_1,
        })
      );
    }

    const pageLines = page.lines.length
      ? page.lines.map((line) => line.text)
      : ['[No selectable text detected on this page.]'];

    pageLines.forEach((line) => {
      children.push(new Paragraph({ text: line }));
    });

    if (index < pages.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        children: children.length
          ? children
          : [new Paragraph({ text: 'No selectable text was extracted from this PDF.' })],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function buildPdfSpreadsheetExport(pages = [], { format = 'xlsx', detectTables = true } = {}) {
  const xlsxModule = await import('xlsx');
  const xlsx = xlsxModule.default ?? xlsxModule;

  if (format === 'csv') {
    const combinedRows = [];

    pages.forEach((page, index) => {
      if (pages.length > 1) {
        combinedRows.push([`Page ${page.pageNumber}`]);
      }

      buildTableRowsForPage(page, detectTables).forEach((row) => {
        combinedRows.push(row);
      });

      if (index < pages.length - 1) {
        combinedRows.push([]);
      }
    });

    const sheet = xlsx.utils.aoa_to_sheet(combinedRows.length ? combinedRows : [['']]);
    const csv = xlsx.utils.sheet_to_csv(sheet);

    return {
      blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      rowCount: combinedRows.length,
      sheetCount: 1,
    };
  }

  const workbook = xlsx.utils.book_new();
  let rowCount = 0;

  pages.forEach((page) => {
    const rows = buildTableRowsForPage(page, detectTables);
    rowCount += rows.length;
    const sheet = xlsx.utils.aoa_to_sheet(rows.length ? rows : [['']]);
    xlsx.utils.book_append_sheet(workbook, sheet, `Page ${page.pageNumber}`.slice(0, 31));
  });

  const buffer = xlsx.write(workbook, { type: 'array', bookType: 'xlsx' });

  return {
    blob: new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    rowCount,
    sheetCount: pages.length || 1,
  };
}

export function getPdfSpreadsheetPreviewRows(pages = [], { detectTables = true, maxRows = 12 } = {}) {
  return pages
    .flatMap((page) => buildTableRowsForPage(page, detectTables))
    .slice(0, maxRows);
}

export async function parseWordDocument(file) {
  const mammothModule = await import('mammoth');
  const mammoth = mammothModule.default ?? mammothModule;
  const buffer = await readAsArrayBuffer(file);
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });

  return {
    html: wrapHtmlDocument(result.value || '', {
      title: file.name.replace(/\.docx$/i, ''),
      subtitle: 'Converted from DOCX with Mammoth. Complex Word formatting may simplify during browser export.',
    }),
    warnings: result.messages || [],
  };
}

export async function parseWorkbookDocument(file, { selectedSheetName = '' } = {}) {
  const { workbook, sheets, xlsx } = await loadWorkbook(file);
  const sheetName = selectedSheetName || workbook.SheetNames[0] || '';
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  const rawHtml = sheet ? xlsx.utils.sheet_to_html(sheet) : '<p>No sheet data found.</p>';
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const bodyHtml = doc.body?.innerHTML?.trim() || rawHtml;

  return {
    workbook,
    sheets,
    selectedSheetName: sheetName,
    html: bodyHtml,
  };
}

export function buildWorkbookPdfHtml(rawHtml, {
  fileName = '',
  sheetName = '',
  scale = 100,
} = {}) {
  const fontSize = Math.max(11, Math.round((Number(scale) || 100) * 0.12));
  const subtitle = [fileName, sheetName].filter(Boolean).join(' • ');

  return wrapHtmlDocument(
    `<div style="font-size: ${fontSize}px;">${rawHtml}</div>`,
    {
      title: fileName ? fileName.replace(/\.[^.]+$/, '') : 'Workbook Export',
      subtitle,
    }
  );
}

export async function parseEpubDocument(file) {
  const epubModule = await import('epubjs');
  const ePub = epubModule.default ?? epubModule;
  const buffer = await readAsArrayBuffer(file);
  const book = ePub(buffer, { replacements: 'blobUrl' });

  try {
    await book.ready;
    const metadata = await book.loaded.metadata;
    const sections = [];

    await Promise.all(
      book.spine.spineItems.map(async (item, index) => {
        const section = item;
        const markup = await section.render(book.load.bind(book));
        const parser = new DOMParser();
        const doc = parser.parseFromString(markup, 'application/xhtml+xml');
        const body = doc.querySelector('body');
        const bodyMarkup = body?.innerHTML?.trim() || markup;
        const title = section?.href?.split('/').pop()?.replace(/\.[^.]+$/, '') || `Chapter ${index + 1}`;

        sections.push({
          index,
          title,
          html: bodyMarkup,
        });
      })
    );

    sections.sort((left, right) => left.index - right.index);

    return {
      metadata,
      chapterCount: sections.length,
      html: wrapHtmlDocument(
        sections
          .map((section) => `<section><h2>${escapeHtml(section.title)}</h2>${section.html}</section>`)
          .join(''),
        {
          title: metadata?.title || file.name.replace(/\.epub$/i, ''),
          subtitle: metadata?.creator || 'EPUB export',
        }
      ),
    };
  } finally {
    book.destroy?.();
  }
}

export async function parseRtfDocument(file) {
  const rtfModule = await import('rtf.js');
  const { EMFJS, RTFJS, WMFJS } = rtfModule;

  RTFJS.loggingEnabled(false);
  WMFJS.loggingEnabled(false);
  EMFJS.loggingEnabled(false);

  const buffer = await readAsArrayBuffer(file);
  const doc = new RTFJS.Document(buffer);
  const htmlElements = await doc.render();
  const wrapper = document.createElement('div');
  wrapper.append(...htmlElements);

  return {
    metadata: doc.metadata?.() ?? {},
    html: wrapHtmlDocument(wrapper.innerHTML, {
      title: file.name.replace(/\.rtf$/i, ''),
      subtitle: 'Rendered from RTF in the browser. Advanced layouts can simplify during PDF export.',
    }),
  };
}

export async function inspectPptxPresentation(file) {
  const { default: JSZip } = await import('jszip');
  const buffer = await readAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(buffer);
  const slideEntries = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name));

  return {
    slideCount: slideEntries.length,
  };
}

export async function renderHtmlDocumentToPdf(html, options) {
  return renderHtmlToPdfBlob(html, options);
}
