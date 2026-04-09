/**
 * icons.js — Central icon map for Apex Studio Utilities.
 *
 * All icons come from lucide-react. Import from this file, not directly
 * from lucide-react, so icon swaps are a single-file change.
 *
 * Usage:
 *   import { ICON_MAP } from '@/lib/icons';
 *   import Icon from '@/components/ui/Icon';
 *   <Icon icon={ICON_MAP['FileText']} size={20} />
 *
 * Or use the named exports directly:
 *   import { FileTextIcon, ImageIcon } from '@/lib/icons';
 */

export {
  // ── CATEGORY ICONS ──────────────────────────────────────────────
  FileText,          // File Conversion
  ImageIcon as Image, // Image Tools (aliased — 'Image' conflicts with HTML element)
  Film,              // Media & Downloaders
  Code2,             // Developer Tools
  Type,              // Text Tools
  Lock,              // Encoding & Decoding
  Calculator,        // Calculators
  ShieldCheck,       // Security & Network
  Search,            // SEO & Web

  // ── NAVIGATION / UI ─────────────────────────────────────────────
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Plus,
  Minus,
  Menu,              // Hamburger
  ExternalLink,

  // ── TOOL ACTIONS ────────────────────────────────────────────────
  Download,
  Upload,
  Copy,
  RefreshCw,         // Reset / Retry
  RotateCw,          // Retry / Redo
  RotateCcw,         // Undo / Rotate
  Trash2,            // Delete / Clear
  Wand2,             // AI / Magic
  Scissors,          // Trim / Crop
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Settings,
  Sliders,

  // ── STATUS / FEEDBACK ───────────────────────────────────────────
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,           // Spinner (animate-spin in CSS)
  Zap,               // Fast / Instant
  Star,

  // ── FILE TYPES ──────────────────────────────────────────────────
  FileImage,
  FileCode,
  FileAudio,
  FileVideo,
  FileMinus,
  FilePlus,
  FileJson,
  FileSpreadsheet,

  // ── DEVELOPER ───────────────────────────────────────────────────
  Hash,
  Key,
  QrCode,
  Link2,
  Globe,
  Server,
  Terminal,
  Database,
  Cpu,
  Braces,            // JSON
  Regex,             // Regex tester

  // ── MEDIA / AV ──────────────────────────────────────────────────
  Music,
  Video,
  Mic,
  Camera,
  Play,

  // ── CALCULATORS ─────────────────────────────────────────────────
  Percent,
  DollarSign,
  Thermometer,
  Ruler,
  Weight,
  Clock,
  Calendar,
  BarChart2,
  TrendingUp,

  // ── TRUST / PRIVACY ─────────────────────────────────────────────
  ShieldCheck as ShieldCheckIcon,
  Lock as LockIcon,
  UserX,             // No signup

  // ── LAYOUT / MISC ───────────────────────────────────────────────
  Layers,
  Package,
  Box,
  Archive,
  Bookmark,
  Mail,
  Tag as TagIcon,

} from 'lucide-react';

/**
 * ICON_MAP — lookup by string name (used in categories.js and tools-catalog.js
 * where icon names are stored as strings for static data compatibility).
 *
 * Keys are the iconName values used in the catalog.
 */
import {
  FileText, ImageIcon, Film, Code2, Type, Lock, Calculator, ShieldCheck, Search,
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  X, Check, Plus, Minus, Menu, ExternalLink,
  Download, Upload, Copy, RefreshCw, RotateCw, RotateCcw, Trash2, Wand2, Scissors,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Eye, EyeOff, Settings, Sliders,
  AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, Zap, Star,
  FileImage, FileCode, FileAudio, FileVideo, FileMinus, FilePlus, FileJson, FileSpreadsheet,
  Hash, Key, QrCode, Link2, Globe, Server, Terminal, Database, Cpu, Braces, Regex,
  Music, Video, Mic, Camera, Play,
  Percent, DollarSign, Thermometer, Ruler, Weight, Clock, Calendar, BarChart2, TrendingUp,
  UserX, Layers, Package, Box, Archive, Bookmark, Mail,
} from 'lucide-react';

export const ICON_MAP = {
  // Categories
  FileText,
  Image: ImageIcon,
  Film,
  Code2,
  Type,
  Lock,
  Calculator,
  ShieldCheck,
  Search,

  // Actions
  ArrowRight, ArrowLeft,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  X, Check, Plus, Minus, Menu, ExternalLink,
  Download, Upload, Copy, RefreshCw, RotateCw, RotateCcw, Trash2,
  Wand2, Scissors, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Eye, EyeOff, Settings, Sliders,

  // Status
  AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, Zap, Star,

  // Files
  FileImage, FileCode, FileAudio, FileVideo,
  FileMinus, FilePlus, FileJson, FileSpreadsheet,

  // Dev
  Hash, Key, QrCode, Link2, Globe, Server,
  Terminal, Database, Cpu, Braces, Regex,

  // Media
  Music, Video, Mic, Camera, Play,

  // Calculators
  Percent, DollarSign, Thermometer, Ruler, Weight,
  Clock, Calendar, BarChart2, TrendingUp,

  // Misc
  UserX, Layers, Package, Box, Archive, Bookmark, Mail,
};
