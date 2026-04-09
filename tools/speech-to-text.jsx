'use client';

import { useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, TextStatLine } from '@/tools/_shared/text-tool-kit';
import { getWords } from '@/lib/text-tool-utils';

const LANGUAGE_OPTIONS = [
  ['en-US', 'English (US)'],
  ['en-GB', 'English (UK)'],
  ['es-ES', 'Spanish'],
  ['fr-FR', 'French'],
  ['de-DE', 'German'],
];

export default function SpeechToText() {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [continuous, setContinuous] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const userAgent = window.navigator.userAgent;
    const browserWarning = /(Chrome|Edg)\//.test(userAgent)
      ? ''
      : 'Speech recognition works best in Chrome or Edge. Firefox and Safari do not reliably support this API.';

    setWarning(browserWarning);

    if (!Recognition) {
      setSupported(false);
      return undefined;
    }

    const recognition = new Recognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const value = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalChunk += `${value} `;
        } else {
          interimChunk += value;
        }
      }

      if (finalChunk) {
        setTranscript((current) => `${current}${finalChunk}`.trimStart());
      }

      setInterim(interimChunk);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setInterim('');
      if (event.error === 'not-allowed') {
        setError('Microphone access was blocked. Allow microphone access and try again.');
        return;
      }

      setError(`Speech recognition failed: ${event.error}`);
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // ignore cleanup stop errors
      }
    };
  }, [language, continuous]);

  const fullTranscript = `${transcript}${interim}`.trim();

  const startListening = () => {
    if (!recognitionRef.current || !supported) return;
    setError(null);
    setInterim('');

    try {
      recognitionRef.current.lang = language;
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (startError) {
      setError('Speech recognition could not start. If it is already running, stop it and try again.');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const clearAll = () => {
    stopListening();
    setTranscript('');
    setInterim('');
    setError(null);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Transcript</div>

        {warning ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: 16,
            }}
          >
            <Icon
              icon={ICON_MAP.AlertTriangle}
              size={15}
              color="var(--warning)"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
              {warning}
            </span>
          </div>
        ) : null}

        <ErrorCallout message={error || (!supported ? 'Speech recognition is not supported in this browser.' : null)} />

        {!fullTranscript && !isListening ? (
          <EmptyState
            iconName="Mic"
            title="Start listening to transcribe"
            message="Click Start Listening to turn microphone input into text in real time."
          />
        ) : (
          <>
            <textarea
              className="textarea"
              value={fullTranscript}
              readOnly
              placeholder="Transcript will appear here…"
              style={{ minHeight: 260, marginBottom: 8 }}
            />
            {fullTranscript ? (
              <TextStatLine
                items={[`${fullTranscript.length} characters`, `${getWords(fullTranscript).length} words`]}
              />
            ) : null}
          </>
        )}

        {isListening ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <Icon icon={ICON_MAP.Loader2} size={14} className="spin" />
            Listening…
          </div>
        ) : null}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Language</div>
        <select
          className="textarea"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
        >
          {LANGUAGE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="options-row">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={continuous}
              onChange={(event) => setContinuous(event.target.checked)}
            />
            <span className="checkbox-label">Continuous transcription mode</span>
          </label>
        </div>

        <div className="panel-divider" />

        <button
          type="button"
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={isListening ? stopListening : startListening}
          disabled={!supported}
        >
          <Icon icon={isListening ? ICON_MAP.Mic : ICON_MAP.Play} size={14} />
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
            onClick={() => copy(fullTranscript)}
            disabled={!fullTranscript}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
            onClick={clearAll}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => downloadText(fullTranscript, 'speech-transcript.txt')}
          disabled={!fullTranscript}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">
          Chrome / Edge only for reliable support · microphone audio stays on this device
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
