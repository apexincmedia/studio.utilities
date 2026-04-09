/**
 * tools-registry.js — Maps tool slugs to their React component implementations.
 *
 * HOW TO ADD A NEW TOOL (Codex instructions):
 * 1. Import the component at the top of this file
 * 2. Add the slug → component entry to REGISTRY
 * 3. Flip status to 'live' in lib/tools-catalog.js
 *
 * Only import tools with status: 'live' in tools-catalog.js.
 * Coming-soon tools are handled automatically by /tools/[slug]/page.jsx.
 */

import AgeCalculator from '@/tools/age-calculator';
import ApiResponseFormatter from '@/tools/api-response-formatter';
import AudioConverter from '@/tools/audio-converter';
import AudioTrimmer from '@/tools/audio-trimmer';
import AspectRatioCalculator from '@/tools/aspect-ratio-calculator';
import AvifConverter from '@/tools/avif-converter';
import BackgroundRemover from '@/tools/background-remover';
import Base64Encoder from '@/tools/base64-encoder';
import Base64ToImage from '@/tools/base64-to-image';
import BarcodeGenerator from '@/tools/barcode-generator';
import AsciiTable from '@/tools/ascii-table';
import BinaryConverter from '@/tools/binary-converter';
import BmiCalculator from '@/tools/bmi-calculator';
import CaesarCipher from '@/tools/caesar-cipher';
import CanonicalChecker from '@/tools/canonical-checker';
import CaseConverter from '@/tools/case-converter';
import ColorConverter from '@/tools/color-converter';
import ColorContrastChecker from '@/tools/color-contrast-checker';
import CompoundInterest from '@/tools/compound-interest';
import CronBuilder from '@/tools/cron-builder';
import CsvToJson from '@/tools/csv-to-json';
import CurlToCode from '@/tools/curl-to-code';
import CurrencyConverter from '@/tools/currency-converter';
import CssBoxShadowGenerator from '@/tools/css-box-shadow-generator';
import CssFlexboxGenerator from '@/tools/css-flexbox-generator';
import CssGradientGenerator from '@/tools/css-gradient-generator';
import CssMinifier from '@/tools/css-minifier';
import DuplicateLineRemover from '@/tools/duplicate-line-remover';
import DataStorageConverter from '@/tools/data-storage-converter';
import DateCalculator from '@/tools/date-calculator';
import DnsLookup from '@/tools/dns-lookup';
import DummyDataGenerator from '@/tools/dummy-data-generator';
import ElectricityCostCalculator from '@/tools/electricity-cost-calculator';
import EmailExtractor from '@/tools/email-extractor';
import EpubToPdf from '@/tools/epub-to-pdf';
import FaviconGenerator from '@/tools/favicon-generator';
import FileHashChecker from '@/tools/file-hash-checker';
import FindAndReplace from '@/tools/find-and-replace';
import GifMaker from '@/tools/gif-maker';
import GifToMp4 from '@/tools/gif-to-mp4';
import GraphqlFormatter from '@/tools/graphql-formatter';
import GpaCalculator from '@/tools/gpa-calculator';
import HashGenerator from '@/tools/hash-generator';
import HeicToJpg from '@/tools/heic-to-jpg';
import HexEncoder from '@/tools/hex-encoder';
import HtmlFormatter from '@/tools/html-formatter';
import HtmlToPdf from '@/tools/html-to-pdf';
import HtmlToMarkdown from '@/tools/html-to-markdown';
import HtmlEntities from '@/tools/html-entities';
import HtaccessGenerator from '@/tools/htaccess-generator';
import HttpHeaders from '@/tools/http-headers';
import HttpStatusCodes from '@/tools/http-status-codes';
import ImageCompressor from '@/tools/image-compressor';
import ImageColorPicker from '@/tools/image-color-picker';
import ImageCropper from '@/tools/image-cropper';
import ImageFlipRotate from '@/tools/image-flip-rotate';
import ImageMetadata from '@/tools/image-metadata';
import ImageToPdf from '@/tools/image-to-pdf';
import ImageResizer from '@/tools/image-resizer';
import ImageToBase64 from '@/tools/image-to-base64';
import ImageUpscaler from '@/tools/image-upscaler';
import ImageWatermark from '@/tools/image-watermark';
import InstagramDownloader from '@/tools/instagram-downloader';
import JpgToPng from '@/tools/jpg-to-png';
import JsonFormatter from '@/tools/json-formatter';
import JsonToCsv from '@/tools/json-to-csv';
import JsonToXml from '@/tools/json-to-xml';
import JsonToYaml from '@/tools/json-to-yaml';
import JsonToTypeScript from '@/tools/json-to-typescript';
import JwtDecoder from '@/tools/jwt-decoder';
import JwtGenerator from '@/tools/jwt-generator';
import JsMinifier from '@/tools/js-minifier';
import KeywordDensity from '@/tools/keyword-density';
import LinkExtractor from '@/tools/link-extractor';
import LoremIpsum from '@/tools/lorem-ipsum';
import MarkdownToPdf from '@/tools/markdown-to-pdf';
import MarkdownToHtml from '@/tools/markdown-to-html';
import MetaTagGenerator from '@/tools/meta-tag-generator';
import MultiLanguageMinifier from '@/tools/minifier-html-css-js';
import MortgageCalculator from '@/tools/mortgage-calculator';
import MorseCode from '@/tools/morse-code';
import Mp4ToGif from '@/tools/mp4-to-gif';
import MyIp from '@/tools/my-ip';
import OgTagGenerator from '@/tools/og-tag-generator';
import NumberExtractor from '@/tools/number-extractor';
import OcrTool from '@/tools/ocr-tool';
import NumberBaseConverter from '@/tools/number-base-converter';
import OdtToPdf from '@/tools/odt-to-pdf';
import NumbersToExcel from '@/tools/numbers-to-excel';
import PagesToPdf from '@/tools/pages-to-pdf';
import PageSpeedInsights from '@/tools/page-speed-insights';
import PasswordGenerator from '@/tools/password-generator';
import PasswordStrengthChecker from '@/tools/password-strength-checker';
import PercentageCalculator from '@/tools/percentage-calculator';
import PdfCompress from '@/tools/pdf-compress';
import PdfMerge from '@/tools/pdf-merge';
import PdfProtect from '@/tools/pdf-protect';
import PdfRotate from '@/tools/pdf-rotate';
import PdfSplit from '@/tools/pdf-split';
import PdfToExcel from '@/tools/pdf-to-excel';
import PdfToJpg from '@/tools/pdf-to-jpg';
import PdfToPowerPoint from '@/tools/pdf-to-powerpoint';
import PdfToPng from '@/tools/pdf-to-png';
import PdfToWord from '@/tools/pdf-to-word';
import PdfUnlock from '@/tools/pdf-unlock';
import PdfWatermark from '@/tools/pdf-watermark';
import PngToBase64 from '@/tools/png-to-base64';
import PngToJpg from '@/tools/png-to-jpg';
import PngToSvg from '@/tools/png-to-svg';
import IpLookup from '@/tools/ip-lookup';
import OpenPortChecker from '@/tools/open-port-checker';
import QrCodeGenerator from '@/tools/qr-code-generator';
import QrCodeReader from '@/tools/qr-code-reader';
import ReadabilityScore from '@/tools/readability-score';
import PowerPointToPdf from '@/tools/powerpoint-to-pdf';
import RegexTester from '@/tools/regex-tester';
import RedirectChecker from '@/tools/redirect-checker';
import RandomTokenGenerator from '@/tools/random-token-generator';
import RomanNumerals from '@/tools/roman-numerals';
import RobotsTxtGenerator from '@/tools/robots-txt-generator';
import RtfToPdf from '@/tools/rtf-to-pdf';
import ScreenRecorder from '@/tools/screen-recorder';
import ScientificCalculator from '@/tools/scientific-calculator';
import SitemapGenerator from '@/tools/sitemap-generator';
import SlugGenerator from '@/tools/slug-generator';
import SqlFormatter from '@/tools/sql-formatter';
import SslChecker from '@/tools/ssl-checker';
import SoundRecorder from '@/tools/sound-recorder';
import SpeechToText from '@/tools/speech-to-text';
import SpriteSheetGenerator from '@/tools/sprite-sheet-generator';
import SvgToPng from '@/tools/svg-to-png';
import TdeeCalculator from '@/tools/tdee-calculator';
import TiktokDownloader from '@/tools/tiktok-downloader';
import TextToSpeech from '@/tools/text-to-speech';
import TextDiff from '@/tools/text-diff';
import TextReverser from '@/tools/text-reverser';
import TextSorter from '@/tools/text-sorter';
import TextToBinary from '@/tools/text-to-binary';
import TextTruncator from '@/tools/text-truncator';
import TimestampConverter from '@/tools/timestamp-converter';
import TipCalculator from '@/tools/tip-calculator';
import TomlToJson from '@/tools/toml-to-json';
import TimezoneConverter from '@/tools/timezone-converter';
import TxtToPdf from '@/tools/txt-to-pdf';
import Rot13 from '@/tools/rot13';
import UnicodeLookup from '@/tools/unicode-lookup';
import UnitConverter from '@/tools/unit-converter';
import UserAgentParser from '@/tools/user-agent-parser';
import UtmBuilder from '@/tools/utm-builder';
import UrlEncoder from '@/tools/url-encoder';
import UuidGenerator from '@/tools/uuid-generator';
import VatCalculator from '@/tools/vat-calculator';
import VideoConverter from '@/tools/video-converter';
import VideoToAudio from '@/tools/video-to-audio';
import VideoTrimmer from '@/tools/video-trimmer';
import WebpConverter from '@/tools/webp-converter';
import WhitespaceCleaner from '@/tools/whitespace-cleaner';
import WhoisLookup from '@/tools/whois-lookup';
import WordCounter from '@/tools/word-counter';
import WordToPdf from '@/tools/word-to-pdf';
import TwitterVideoDownloader from '@/tools/twitter-video-downloader';
import XmlToJson from '@/tools/xml-to-json';
import XmlFormatter from '@/tools/xml-formatter';
import YamlToJson from '@/tools/yaml-to-json';
import YoutubeToMp3 from '@/tools/youtube-to-mp3';
import YoutubeToMp4 from '@/tools/youtube-to-mp4';
import DiffChecker from '@/tools/diff-checker';
import CharacterLimitChecker from '@/tools/character-limit-checker';
import ListRandomizer from '@/tools/list-randomizer';

const REGISTRY = {
  'age-calculator': AgeCalculator,
  'api-response-formatter': ApiResponseFormatter,
  'audio-converter': AudioConverter,
  'audio-trimmer': AudioTrimmer,
  'aspect-ratio-calculator': AspectRatioCalculator,
  'avif-converter': AvifConverter,
  'background-remover': BackgroundRemover,
  'base64-encoder':  Base64Encoder,
  'base64-to-image': Base64ToImage,
  'barcode-generator': BarcodeGenerator,
  'ascii-table': AsciiTable,
  'binary-converter': BinaryConverter,
  'bmi-calculator': BmiCalculator,
  'caesar-cipher': CaesarCipher,
  'canonical-checker': CanonicalChecker,
  'case-converter': CaseConverter,
  'character-limit-checker': CharacterLimitChecker,
  'color-converter': ColorConverter,
  'color-contrast-checker': ColorContrastChecker,
  'compound-interest': CompoundInterest,
  'cron-builder': CronBuilder,
  'csv-to-json': CsvToJson,
  'curl-to-code': CurlToCode,
  'currency-converter': CurrencyConverter,
  'css-box-shadow-generator': CssBoxShadowGenerator,
  'css-flexbox-generator': CssFlexboxGenerator,
  'css-gradient-generator': CssGradientGenerator,
  'css-minifier': CssMinifier,
  'data-storage-converter': DataStorageConverter,
  'date-calculator': DateCalculator,
  'dns-lookup': DnsLookup,
  'diff-checker': DiffChecker,
  'duplicate-line-remover': DuplicateLineRemover,
  'dummy-data-generator': DummyDataGenerator,
  'electricity-cost-calculator': ElectricityCostCalculator,
  'email-extractor': EmailExtractor,
  'epub-to-pdf': EpubToPdf,
  'favicon-generator': FaviconGenerator,
  'file-hash-checker': FileHashChecker,
  'find-and-replace': FindAndReplace,
  'gif-maker': GifMaker,
  'gif-to-mp4': GifToMp4,
  'graphql-formatter': GraphqlFormatter,
  'gpa-calculator': GpaCalculator,
  'hash-generator': HashGenerator,
  'heic-to-jpg': HeicToJpg,
  'hex-encoder': HexEncoder,
  'html-formatter': HtmlFormatter,
  'html-to-pdf': HtmlToPdf,
  'html-to-markdown': HtmlToMarkdown,
  'html-entities': HtmlEntities,
  'htaccess-generator': HtaccessGenerator,
  'http-headers': HttpHeaders,
  'http-status-codes': HttpStatusCodes,
  'image-compressor': ImageCompressor,
  'image-color-picker': ImageColorPicker,
  'image-cropper': ImageCropper,
  'image-flip-rotate': ImageFlipRotate,
  'image-metadata': ImageMetadata,
  'image-resizer': ImageResizer,
  'image-to-pdf': ImageToPdf,
  'image-to-base64': ImageToBase64,
  'image-upscaler': ImageUpscaler,
  'image-watermark': ImageWatermark,
  'instagram-downloader': InstagramDownloader,
  'jpg-to-png': JpgToPng,
  'json-formatter': JsonFormatter,
  'json-to-csv': JsonToCsv,
  'json-to-xml': JsonToXml,
  'json-to-typescript': JsonToTypeScript,
  'json-to-yaml': JsonToYaml,
  'jwt-decoder': JwtDecoder,
  'jwt-generator': JwtGenerator,
  'js-minifier': JsMinifier,
  'keyword-density': KeywordDensity,
  'link-extractor': LinkExtractor,
  'list-randomizer': ListRandomizer,
  'lorem-ipsum': LoremIpsum,
  'markdown-to-pdf': MarkdownToPdf,
  'markdown-to-html': MarkdownToHtml,
  'meta-tag-generator': MetaTagGenerator,
  'minifier-html-css-js': MultiLanguageMinifier,
  'mp4-to-gif': Mp4ToGif,
  'mortgage-calculator': MortgageCalculator,
  'morse-code': MorseCode,
  'my-ip': MyIp,
  'number-base-converter': NumberBaseConverter,
  'number-extractor': NumberExtractor,
  'ocr-tool': OcrTool,
  'odt-to-pdf': OdtToPdf,
  'og-tag-generator': OgTagGenerator,
  'numbers-to-excel': NumbersToExcel,
  'pages-to-pdf': PagesToPdf,
  'page-speed-insights': PageSpeedInsights,
  'password-generator': PasswordGenerator,
  'password-strength-checker': PasswordStrengthChecker,
  'percentage-calculator': PercentageCalculator,
  'pdf-compress': PdfCompress,
  'pdf-merge': PdfMerge,
  'pdf-protect': PdfProtect,
  'pdf-rotate': PdfRotate,
  'pdf-split': PdfSplit,
  'pdf-to-excel': PdfToExcel,
  'pdf-to-jpg': PdfToJpg,
  'pdf-to-powerpoint': PdfToPowerPoint,
  'pdf-to-png': PdfToPng,
  'pdf-to-word': PdfToWord,
  'pdf-unlock': PdfUnlock,
  'pdf-watermark': PdfWatermark,
  'ip-lookup': IpLookup,
  'open-port-checker': OpenPortChecker,
  'powerpoint-to-pdf': PowerPointToPdf,
  'png-to-base64': PngToBase64,
  'png-to-jpg': PngToJpg,
  'png-to-svg': PngToSvg,
  'qr-code-generator': QrCodeGenerator,
  'qr-code-reader': QrCodeReader,
  'readability-score': ReadabilityScore,
  'regex-tester': RegexTester,
  'redirect-checker': RedirectChecker,
  'random-token-generator': RandomTokenGenerator,
  'rot13': Rot13,
  'roman-numerals': RomanNumerals,
  'robots-txt-generator': RobotsTxtGenerator,
  'rtf-to-pdf': RtfToPdf,
  'screen-recorder': ScreenRecorder,
  'scientific-calculator': ScientificCalculator,
  'sitemap-generator': SitemapGenerator,
  'slug-generator': SlugGenerator,
  'sql-formatter': SqlFormatter,
  'ssl-checker': SslChecker,
  'sound-recorder': SoundRecorder,
  'speech-to-text': SpeechToText,
  'sprite-sheet-generator': SpriteSheetGenerator,
  'svg-to-png': SvgToPng,
  'tdee-calculator': TdeeCalculator,
  'tiktok-downloader': TiktokDownloader,
  'text-to-speech': TextToSpeech,
  'text-diff': TextDiff,
  'text-to-binary': TextToBinary,
  'text-reverser': TextReverser,
  'text-sorter': TextSorter,
  'text-truncator': TextTruncator,
  'timestamp-converter': TimestampConverter,
  'tip-calculator': TipCalculator,
  'toml-to-json': TomlToJson,
  'timezone-converter': TimezoneConverter,
  'txt-to-pdf': TxtToPdf,
  'unicode-lookup': UnicodeLookup,
  'unit-converter': UnitConverter,
  'user-agent-parser': UserAgentParser,
  'utm-builder': UtmBuilder,
  'url-encoder': UrlEncoder,
  'uuid-generator': UuidGenerator,
  'vat-calculator': VatCalculator,
  'video-converter': VideoConverter,
  'video-to-audio': VideoToAudio,
  'video-trimmer': VideoTrimmer,
  'webp-converter': WebpConverter,
  'whitespace-cleaner': WhitespaceCleaner,
  'whois-lookup': WhoisLookup,
  'word-counter': WordCounter,
  'word-to-pdf': WordToPdf,
  'twitter-video-downloader': TwitterVideoDownloader,
  'xml-to-json': XmlToJson,
  'xml-formatter': XmlFormatter,
  'yaml-to-json': YamlToJson,
  'youtube-to-mp3': YoutubeToMp3,
  'youtube-to-mp4': YoutubeToMp4,
};

/**
 * getToolComponent(slug) — returns the React component for a live tool,
 * or null if the tool is coming-soon or doesn't exist.
 */
export const getToolComponent = (slug) => REGISTRY[slug] ?? null;
