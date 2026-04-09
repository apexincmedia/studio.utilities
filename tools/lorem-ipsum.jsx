'use client';

import { useEffect, useState } from 'react';
import {
  EmptyState,
  TextGeneratorTool,
  TextStatLine,
} from '@/tools/_shared/text-tool-kit';
import { getWords, shuffleArray } from '@/lib/text-tool-utils';

const CLASSIC_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
  'Praesent commodo cursus magna, vel scelerisque nisl consectetur et.',
  'Curabitur blandit tempus porttitor.',
  'Aenean lacinia bibendum nulla sed consectetur.',
  'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.',
  'Donec ullamcorper nulla non metus auctor fringilla.',
  'Morbi leo risus, porta ac consectetur ac, vestibulum at eros.',
];

const HIPSTER_SENTENCES = [
  'Artisan adaptogen subway tile, hoodie messenger bag sustainable forage cloud bread.',
  'Vinyl disrupt whatever pug, prism heirloom put a bird on it umami migas.',
  'Copper mug cred pok pok, skateboard fam kale chips humblebrag tousled meh.',
  'Selfies brunch tofu taxidermy, occupy everyday carry activated charcoal plaid.',
  'Kombucha succulents chartreuse, cray glossier skateboard fingerstache leggings.',
  'Pabst chillwave hashtag, snackwave pour-over hella marfa ramps.',
  'Banh mi locavore hexagon, asymmetrical cardigan mlkshk sriracha vaporware.',
  'Polaroid kinfolk yes plz, farm-to-table chambray neutra blog fit.',
  'Slow-carb quinoa lyft, palo santo forage vape air plant meditation.',
  'Letterpress fashion axe iPhone, blog health goth literally pug.',
];

function clampAmount(value, fallback = 3) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(50, Math.max(1, parsed));
}

function getSentencePool(type) {
  if (type === 'hipster') return HIPSTER_SENTENCES;
  return CLASSIC_SENTENCES;
}

function buildLorem({ amount, unit, type, includeLead }) {
  const count = clampAmount(amount);
  const pool = getSentencePool(type);

  if (unit === 'words') {
    const words = pool.join(' ').replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
    const sourceWords = type === 'random' ? shuffleArray(words) : words;
    let generated = Array.from({ length: count }, (_, index) => sourceWords[index % sourceWords.length]).join(' ');
    if (includeLead && type !== 'hipster') {
      generated = `Lorem ipsum ${generated}`.trim();
    }
    return generated.replace(/\s+/g, ' ').trim();
  }

  if (unit === 'sentences') {
    const source = type === 'random' ? shuffleArray(pool) : pool;
    const sentences = Array.from({ length: count }, (_, index) => source[index % source.length]);
    if (includeLead && type !== 'hipster') {
      sentences[0] = CLASSIC_SENTENCES[0];
    }
    return sentences.join(' ');
  }

  const paragraphs = Array.from({ length: count }, (_, paragraphIndex) => {
    const paragraphSentences = Array.from({ length: 4 }, (_, sentenceIndex) => {
      const source = type === 'random' ? shuffleArray(pool) : pool;
      return source[(paragraphIndex * 4 + sentenceIndex) % source.length];
    });

    if (includeLead && paragraphIndex === 0 && type !== 'hipster') {
      paragraphSentences[0] = CLASSIC_SENTENCES[0];
    }

    return paragraphSentences.join(' ');
  });

  return paragraphs.join('\n\n');
}

export default function LoremIpsum() {
  const [amount, setAmount] = useState('3');
  const [unit, setUnit] = useState('paragraphs');
  const [type, setType] = useState('classic');
  const [includeLead, setIncludeLead] = useState(true);
  const [output, setOutput] = useState('');

  const generate = () => {
    setOutput(buildLorem({ amount, unit, type, includeLead }));
  };

  useEffect(() => {
    generate();
  }, [amount, unit, type, includeLead]);

  return (
    <TextGeneratorTool
      output={output}
      outputLabel="Generated Copy"
      outputStats={
        output ? (
          <TextStatLine
            items={[`${getWords(output).length} words`, `${output.length} characters`]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!output}
      emptyState={
        <EmptyState
          iconName="Type"
          title="Generate placeholder text"
          message="Pick how much copy you need, then generate classic lorem, random lorem, or hipster-style filler text."
        />
      }
      options={
        <>
          <div className="options-label">Amount</div>
          <input
            type="number"
            className="textarea"
            value={amount}
            min="1"
            max="50"
            onChange={(event) => setAmount(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />

          <div className="options-label">Unit</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {['paragraphs', 'sentences', 'words'].map((item) => (
              <button
                key={item}
                type="button"
                className={`mode-btn${unit === item ? ' active' : ''}`}
                onClick={() => setUnit(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="options-label">Style</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['classic', 'Classic'],
              ['random', 'Random'],
              ['hipster', 'Hipster'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${type === value ? ' active' : ''}`}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={includeLead}
              onChange={(event) => setIncludeLead(event.target.checked)}
            />
            <span className="checkbox-label">Start with &quot;Lorem ipsum…&quot;</span>
          </label>

          <div className="panel-divider" />
        </>
      }
      primaryAction={{ label: 'Regenerate', iconName: 'RotateCw', onClick: generate }}
      onClear={() => setOutput('')}
      downloadConfig={{
        filename: 'lorem-ipsum.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
