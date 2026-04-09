/**
 * categories.js — The 9 top-level tool categories.
 * id must match the `category` field in tools-catalog.js.
 * iconName must match a key in lib/icons.js ICON_MAP.
 */
export const CATEGORIES = [
  {
    id: 'file-conversion',
    name: 'File Conversion',
    iconName: 'FileText',
    description: 'PDF, Word, Excel, PowerPoint — convert between any format in both directions.',
    count: 28,
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    iconName: 'Image',
    description: 'Compress, resize, crop, upscale, remove backgrounds, and convert image formats.',
    count: 22,
  },
  {
    id: 'media',
    name: 'Media & Downloaders',
    iconName: 'Film',
    description: 'YouTube, TikTok, Instagram, Twitter. MP3, MP4, GIF — any format, any platform.',
    count: 14,
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    iconName: 'Code2',
    description: 'JSON, YAML, XML, regex, UUID, hash generators, minifiers, and code formatters.',
    count: 30,
  },
  {
    id: 'text-tools',
    name: 'Text Tools',
    iconName: 'Type',
    description: 'Case converters, character counters, slug generators, text diffing, and cleaners.',
    count: 18,
  },
  {
    id: 'encoding',
    name: 'Encoding & Decoding',
    iconName: 'Lock',
    description: 'Base64, URL encode, JWT, QR codes, barcodes, binary, hex, Morse, and more.',
    count: 16,
  },
  {
    id: 'calculators',
    name: 'Calculators',
    iconName: 'Calculator',
    description: 'Unit conversions, currency, percentages, timestamps, BMI, mortgage, compound interest.',
    count: 20,
  },
  {
    id: 'security',
    name: 'Security & Network',
    iconName: 'ShieldCheck',
    description: 'Password generator, SSL checker, WHOIS, DNS lookup, IP geo, and HTTP headers.',
    count: 12,
  },
  {
    id: 'seo',
    name: 'SEO & Web',
    iconName: 'Search',
    description: 'Meta tags, Open Graph, robots.txt, sitemap generator, UTM builder, and keyword tools.',
    count: 10,
  },
];

export const getCategoryById = (id) => CATEGORIES.find((c) => c.id === id);
