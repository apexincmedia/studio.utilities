'use client';

import { useEffect, useRef, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { getWords } from '@/lib/text-tool-utils';

const STATUS_LABELS = {
  idle: 'Ready',
  speaking: 'Speaking',
  paused: 'Paused',
};

export default function TextToSpeech() {
  const [input, setInput] = useState('');
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [status, setStatus] = useState('idle');
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      setError('Speech synthesis is not supported in this browser.');
      return undefined;
    }

    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      setVoiceURI((current) => current || availableVoices[0]?.voiceURI || '');
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.cancel();
      synth.onvoiceschanged = null;
    };
  }, []);

  const selectedVoice = voices.find((voice) => voice.voiceURI === voiceURI) ?? voices[0] ?? null;

  const speak = () => {
    if (!supported || !input.trim()) return;

    try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(input);
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice?.lang || 'en-US';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onstart = () => {
        setStatus('speaking');
        setError(null);
      };
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => {
        setStatus('idle');
        setError('Playback failed in this browser.');
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    } catch (playbackError) {
      setStatus('idle');
      setError(playbackError.message || 'Playback failed.');
    }
  };

  const togglePause = () => {
    if (!supported) return;
    if (status === 'speaking') {
      window.speechSynthesis.pause();
      setStatus('paused');
      return;
    }

    if (status === 'paused') {
      window.speechSynthesis.resume();
      setStatus('speaking');
    }
  };

  const stopPlayback = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus('idle');
  };

  const clearAll = () => {
    stopPlayback();
    setInput('');
    setError(null);
  };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Text to Speak"
      inputPlaceholder="Paste text and listen with your browser's built-in voices…"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getWords(input).length} words`]} />
        ) : null
      }
      dividerLabel="Playback Status"
      error={error}
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Music"
          title="Turn text into spoken audio"
          message="Choose a browser voice, tune the speed and pitch, then play the text directly in your browser."
        />
      }
      outputRenderer={
        input ? (
          <>
            <div className="panel-label">Playback Status</div>
            <MetricGrid
              items={[
                {
                  label: 'Status',
                  value: STATUS_LABELS[status],
                  iconName: 'Music',
                  tone: status === 'paused' ? 'warning' : status === 'speaking' ? 'success' : 'default',
                },
                {
                  label: 'Voice',
                  value: selectedVoice?.name || 'System default',
                  description: selectedVoice?.lang || 'Default browser language',
                  iconName: 'Mic',
                },
                {
                  label: 'Rate / Pitch',
                  value: `${rate.toFixed(1)} / ${pitch.toFixed(1)}`,
                  description: 'Playback tuning',
                  iconName: 'Sliders',
                },
              ]}
              columns="1fr"
              marginBottom={14}
            />

            <div
              style={{
                background: 'var(--warning-bg)',
                border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                fontSize: 12,
                color: 'var(--text)',
                lineHeight: 1.7,
              }}
            >
              Browser voices play locally, but native MP3 download is not available from the Web Speech API.
            </div>
          </>
        ) : null
      }
      options={
        <>
          <div className="options-label">Voice</div>
          <select
            className="textarea"
            value={voiceURI}
            onChange={(event) => setVoiceURI(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
            disabled={!voices.length}
          >
            {voices.length ? (
              voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            ) : (
              <option value="">Loading voices…</option>
            )}
          </select>

          <div className="options-label">Rate</div>
          <div className="range-wrap" style={{ marginBottom: 16 }}>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
            <span className="range-value">{rate.toFixed(1)}</span>
          </div>

          <div className="options-label">Pitch</div>
          <div className="range-wrap" style={{ marginBottom: 20 }}>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(event) => setPitch(Number(event.target.value))}
            />
            <span className="range-value">{pitch.toFixed(1)}</span>
          </div>
          <div className="panel-divider" />
        </>
      }
      primaryAction={{
        label: status === 'speaking' ? 'Replay Voice' : 'Play Voice',
        iconName: 'Play',
        onClick: speak,
        disabled: !input.trim() || !supported,
      }}
      extraActions={
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={togglePause}
            disabled={!supported || status === 'idle'}
          >
            {status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={stopPlayback}
            disabled={!supported || status === 'idle'}
          >
            Stop
          </button>
        </div>
      }
      onClear={clearAll}
      copyValue={input}
      copyLabel="Copy Text"
      privacyNote="Browser voices only · playback stays on this device · MP3 download is not supported natively"
    />
  );
}
