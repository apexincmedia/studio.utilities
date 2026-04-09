'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  CalculatorEmptyState,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import {
  evaluateScientificExpression,
  formatScientificResult,
} from '@/lib/scientific-calculator-engine';

const BUTTON_ROWS = [
  [
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: 'pi', value: 'pi' },
    { label: 'e', value: 'e' },
    { label: 'DEL', action: 'delete' },
  ],
  [
    { label: 'sin', value: 'sin(' },
    { label: 'cos', value: 'cos(' },
    { label: 'tan', value: 'tan(' },
    { label: 'x^y', value: '^' },
    { label: '/', value: '/' },
  ],
  [
    { label: 'asin', value: 'asin(' },
    { label: 'acos', value: 'acos(' },
    { label: 'atan', value: 'atan(' },
    { label: 'sqrt', value: 'sqrt(' },
    { label: '*', value: '*' },
  ],
  [
    { label: 'log', value: 'log(' },
    { label: 'ln', value: 'ln(' },
    { label: 'abs', value: 'abs(' },
    { label: 'x!', value: '!' },
    { label: '-', value: '-' },
  ],
  [
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: 'x²', value: '^2' },
    { label: '+', value: '+' },
  ],
  [
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '.', value: '.' },
    { label: 'Ans', action: 'answer' },
  ],
  [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '0', value: '0' },
    { label: '=', action: 'evaluate' },
  ],
];

export default function ScientificCalculator() {
  const [expression, setExpression] = useState('');
  const [angleMode, setAngleMode] = useState('deg');
  const [memory, setMemory] = useState(0);
  const [lastValue, setLastValue] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const displayValue = lastValue !== null ? formatScientificResult(lastValue) : expression || '0';

  const runEvaluation = (nextExpression = expression) => {
    try {
      const result = evaluateScientificExpression(nextExpression, { angleMode });
      setLastValue(result);
      setExpression(String(result));
      setError('');
      setHistory((current) => [
        {
          expression: nextExpression,
          result: formatScientificResult(result),
          raw: String(result),
        },
        ...current.slice(0, 7),
      ]);
    } catch (evaluationError) {
      setError(evaluationError.message);
      setLastValue(null);
    }
  };

  const appendValue = (value) => {
    setError('');
    setLastValue(null);
    setExpression((current) => `${current}${value}`);
  };

  const handleButton = (button) => {
    if (button.action === 'delete') {
      setError('');
      setLastValue(null);
      setExpression((current) => current.slice(0, -1));
      return;
    }

    if (button.action === 'evaluate') {
      runEvaluation();
      return;
    }

    if (button.action === 'answer' && lastValue !== null) {
      appendValue(String(lastValue));
      return;
    }

    if (button.value) {
      appendValue(button.value);
    }
  };

  const copyValue = history.length ? `${history[0].expression} = ${history[0].result}` : displayValue;

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setExpression('');
        setLastValue(null);
        setError('');
        setHistory([]);
        setMemory(0);
        setAngleMode('deg');
      }}
      options={
        <>
          <div className="options-label">Angle Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`mode-btn${angleMode === 'deg' ? ' active' : ''}`}
              onClick={() => setAngleMode('deg')}
            >
              Degrees
            </button>
            <button
              type="button"
              className={`mode-btn${angleMode === 'rad' ? ' active' : ''}`}
              onClick={() => setAngleMode('rad')}
            >
              Radians
            </button>
          </div>

          <div className="options-label">Memory</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                if (lastValue !== null) {
                  setMemory((current) => current + lastValue);
                }
              }}
            >
              M+
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                if (lastValue !== null) {
                  setMemory((current) => current - lastValue);
                }
              }}
            >
              M-
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => appendValue(String(memory))}
            >
              MR
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setMemory(0)}
            >
              MC
            </button>
          </div>

          <div style={{ marginBottom: 20, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
            Memory value: {formatScientificResult(memory)}
          </div>

          <div className="panel-divider" />
          <CalculatorNotice message="Expressions are evaluated with a token parser, not `eval()`. Use explicit multiplication, for example `2*pi`." />
        </>
      }
    >
      <OutputPanel>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div className="panel-label" style={{ marginBottom: 10 }}>
            Expression
          </div>
          <input
            className="textarea"
            value={expression}
            onChange={(event) => {
              setExpression(event.target.value);
              setError('');
              setLastValue(null);
            }}
            placeholder="Type or tap an expression..."
            style={{ minHeight: 'auto', padding: '14px 16px', marginBottom: 14 }}
          />
          <CalculatorPrimaryResult
            label="Display"
            value={displayValue}
            detail={lastValue !== null ? 'Latest evaluated result' : 'Live expression preview'}
          />
        </div>

        {!expression && !history.length ? (
          <CalculatorEmptyState
            iconName="Calculator"
            title="Use a full scientific calculator with history and memory"
            message="Build expressions with trig, logs, powers, roots, factorials, constants, and memory functions without relying on unsafe evaluation."
          />
        ) : null}

        {error ? <CalculatorNotice tone="error" message={error} /> : null}

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', margin: '16px 0 20px' }}>
          {BUTTON_ROWS.flat().map((button, index) => (
            <button
              key={`${button.label}-${index}`}
              type="button"
              className={`mode-btn${button.action === 'evaluate' ? ' active' : ''}`}
              style={{ minHeight: 48 }}
              onClick={() => handleButton(button)}
            >
              {button.label}
            </button>
          ))}
        </div>

        {history.length ? (
          <>
            <CalculatorSectionDivider label="History" />
            <div style={{ display: 'grid', gap: 10 }}>
              {history.map((entry, index) => (
                <button
                  key={`${entry.expression}-${index}`}
                  type="button"
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    justifyContent: 'space-between',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                  }}
                  onClick={() => {
                    setExpression(entry.raw);
                    setLastValue(Number.parseFloat(entry.raw));
                    setError('');
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.expression}
                    </div>
                    <div style={{ fontSize: 15, color: 'var(--text)' }}>{entry.result}</div>
                  </div>
                  <Icon icon={ICON_MAP.ChevronRight} size={14} />
                </button>
              ))}
            </div>
          </>
        ) : null}

        {lastValue !== null ? (
          <>
            <CalculatorSectionDivider label="Quick Stats" />
            <CalculatorStatGrid
              items={[
                {
                  label: 'Angle Mode',
                  value: angleMode === 'deg' ? 'Degrees' : 'Radians',
                  detail: 'Used for trig functions',
                },
                {
                  label: 'Memory',
                  value: formatScientificResult(memory),
                  detail: 'Stored calculator memory',
                },
              ]}
            />
          </>
        ) : null}
      </OutputPanel>
    </CalculatorShell>
  );
}
