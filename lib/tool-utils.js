/**
 * tool-utils.js — Shared utilities for all Apex Studio Utilities tool implementations.
 *
 * Import only what you need:
 *   import { formatBytes, downloadBlob, useDebounce } from '@/lib/tool-utils';
 *
 * Rules:
 *   - No side effects at module level
 *   - All functions are pure or documented as effectful
 *   - Hooks must only be used in 'use client' components
 */

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────────────────────────────

/**
 * Human-readable byte size string.
 * formatBytes(1536) → "1.5 KB"
 */
export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)       return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/**
 * Zero-pad a number to a given width.
 * zeroPad(7, 2) → "07"
 */
export function zeroPad(n, width = 2) {
  return String(n).padStart(width, '0');
}

/**
 * Truncate a string to maxLen characters, appending ellipsis if needed.
 */
export function truncate(str, maxLen = 40) {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…';
}

// ─────────────────────────────────────────────────────────────────────
// FILE DOWNLOADS
// ─────────────────────────────────────────────────────────────────────

/**
 * Trigger a browser download for a Blob.
 * Use for binary outputs (images, PDFs, ZIPs, etc.)
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
  // Revoke after a tick so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Trigger a browser download for a plain-text string.
 * Use for text outputs (JSON, CSV, code, etc.)
 *
 * downloadText(json, 'output.json', 'application/json')
 */
export function downloadText(text, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Copy text to clipboard. Returns true on success, false on failure.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// FILE READING
// ─────────────────────────────────────────────────────────────────────

/**
 * Read a File as a UTF-8 string.
 * readAsText(file).then(text => ...)
 */
export function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Read a File as a base64 data URL.
 * readAsDataURL(file).then(dataUrl => ...)
 */
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a File as an ArrayBuffer (for binary parsing).
 */
export function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ─────────────────────────────────────────────────────────────────────
// ENCODING / DECODING
// ─────────────────────────────────────────────────────────────────────

/**
 * UTF-8 safe base64 encode. Handles emoji, CJK, accents.
 */
export function encodeBase64(text) {
  const bytes  = new TextEncoder().encode(text);
  let   binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/**
 * UTF-8 safe base64 decode. Returns null on invalid input.
 */
export function decodeBase64(b64) {
  try {
    const binary = atob(b64.trim().replace(/-/g, '+').replace(/_/g, '/'));
    const bytes  = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Count the byte length of a UTF-8 string.
 */
export function byteLength(str) {
  return new TextEncoder().encode(str).length;
}

// ─────────────────────────────────────────────────────────────────────
// REACT HOOKS  (only use inside 'use client' components)
// ─────────────────────────────────────────────────────────────────────

/**
 * Debounce a value — useful for live-update inputs.
 *
 * const debouncedQuery = useDebounce(query, 150);
 * useEffect(() => { runSearch(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Debounce a callback — useful for debouncing event handlers directly.
 *
 * const handleInput = useDebouncedCallback((val) => process(val), 150);
 */
export function useDebouncedCallback(fn, delay = 200) {
  const timerRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

/**
 * Copy-to-clipboard with a timed "Copied!" state.
 * Returns [copied: bool, triggerCopy: fn].
 *
 * const [copied, copy] = useCopyState();
 * <button onClick={() => copy(text)}>{copied ? 'Copied!' : 'Copy'}</button>
 */
export function useCopyState(resetDelay = 1500) {
  const [copied, setCopied] = useState(false);
  const trigger = useCallback(async (text) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), resetDelay);
    }
  }, [resetDelay]);
  return [copied, trigger];
}

/**
 * Track whether a value has changed since last render.
 * Useful for resetting output when input changes.
 */
export function useHasChanged(value) {
  const prev = useRef(value);
  const changed = prev.current !== value;
  prev.current = value;
  return changed;
}
