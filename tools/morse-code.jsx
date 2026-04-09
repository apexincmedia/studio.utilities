'use client';

import { useRef, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { morseToText, splitMorseTokens, textToMorse } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function translateMorse(input, mode) {
  if (!input.trim()) return { output: '', error: null };
  try {
    return {
      output: mode === 'text-to-morse' ? textToMorse(input) : morseToText(input),
      error: null,
    };
  } catch (error) {
    return { output: '', error: error.message };
  }
}

async function playMorsePattern(morse, wpm, frequency, audioRef) {
  const AudioContextRef = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextRef) {
    throw new Error('Audio playback is not supported in this browser.');
  }

  const context = audioRef.current || new AudioContextRef();
  audioRef.current = context;
  if (context.state === 'suspended') {
    await context.resume();
  }

  const unit = 1200 / wpm;
  let cursor = context.currentTime + 0.05;

  const scheduleTone = (duration) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.14;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(cursor);
    oscillator.stop(cursor + duration / 1000);
    cursor += duration / 1000;
  };

  splitMorseTokens(morse).forEach((token) => {
    if (token === '/') {
      cursor += (unit * 7) / 1000;
      return;
    }

    token.split('').forEach((symbol, index) => {
      if (symbol === '.') scheduleTone(unit);
      if (symbol === '-') scheduleTone(unit * 3);
      if (index < token.length - 1) {
        cursor += unit / 1000;
      }
    });

    cursor += (unit * 3) / 1000;
  });
}

export default function MorseCode() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('text-to-morse');
  const [wpm, setWpm] = useState(18);
  const [frequency, setFrequency] = useState(650);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  const debouncedInput = useDebounce(input, 150);
  const result = translateMorse(debouncedInput, mode);
  const tokens = mode === 'text-to-morse' ? splitMorseTokens(result.output) : [];

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel={mode === 'text-to-morse' ? 'Plain Text' : 'Morse Code'}
      inputPlaceholder={
        mode === 'text-to-morse'
          ? 'Paste text to translate into dots and dashes...'
          : 'Paste Morse code using spaces and / between words...'
      }
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel={mode === 'text-to-morse' ? 'Morse Output' : 'Decoded Text'}
      error={audioError || result.error}
      output={result.output}
      outputLabel={mode === 'text-to-morse' ? 'Dots and Dashes' : 'Decoded Text'}
      outputPlaceholder="Translation will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine
            items={[mode === 'text-to-morse' ? `${tokens.length} tokens` : 'Decoded text']}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Play"
          title="Translate Morse code in either direction"
          message="Convert readable text to dots and dashes, decode Morse back to text, and optionally play the Morse pattern as audio."
        />
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['text-to-morse', 'Text -> Morse'],
              ['morse-to-text', 'Morse -> Text'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${mode === value ? ' active' : ''}`}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Speed (WPM)</div>
          <div className="range-wrap" style={{ marginBottom: 16 }}>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={wpm}
              onChange={(event) => setWpm(Number(event.target.value))}
            />
            <span className="range-value">{wpm}</span>
          </div>

          <div className="options-label">Tone Frequency</div>
          <div className="range-wrap" style={{ marginBottom: 20 }}>
            <input
              type="range"
              min="300"
              max="1200"
              step="10"
              value={frequency}
              onChange={(event) => setFrequency(Number(event.target.value))}
            />
            <span className="range-value">{frequency}</span>
          </div>
          <div className="panel-divider" />
        </>
      }
      primaryAction={{
        label: 'Play Morse',
        iconName: 'Play',
        onClick: async () => {
          setAudioError(null);
          try {
            const pattern = mode === 'text-to-morse' ? result.output : textToMorse(result.output);
            await playMorsePattern(pattern, wpm, frequency, audioRef);
          } catch (error) {
            setAudioError(error.message || 'Audio playback failed.');
          }
        },
        disabled: !result.output,
      }}
      extraActions={
        tokens.length ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 8,
            }}
          >
            {tokens.slice(0, 18).map((token, index) => (
              <span
                key={`${token}-${index}`}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: 11,
                  color: 'var(--muted)',
                }}
              >
                {token}
              </span>
            ))}
          </div>
        ) : null
      }
      onClear={() => {
        setInput('');
        setAudioError(null);
      }}
      downloadConfig={{
        filename: 'morse-output.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
