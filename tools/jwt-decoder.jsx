'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  MetricGrid,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function decodeBase64Url(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(buffer) {
  const binary = Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function formatTimestamp(value) {
  if (typeof value !== 'number') return 'Not present';
  return new Date(value * 1000).toLocaleString();
}

async function verifyJwtSignature({ signingInput, secret, algorithm, signature }) {
  const algorithmMap = {
    HS256: 'SHA-256',
    HS384: 'SHA-384',
    HS512: 'SHA-512',
  };

  const digest = algorithmMap[algorithm];
  if (!digest) {
    return {
      status: 'unsupported',
      message: `Signature verification is only supported for HMAC tokens (HS256 / HS384 / HS512).`,
    };
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: digest },
    false,
    ['sign']
  );

  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return {
    status: encodeBase64Url(signed) === signature ? 'valid' : 'invalid',
    message: encodeBase64Url(signed) === signature
      ? 'The signature matches the supplied secret.'
      : 'The signature does not match the supplied secret.',
  };
}

function SectionCard({ title, value }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        {title}
      </div>
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 12,
          lineHeight: 1.7,
          color: 'var(--text)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
      >
        {value}
      </pre>
    </div>
  );
}

export default function JwtDecoder() {
  const [input, setInput] = useState('');
  const [secret, setSecret] = useState('');
  const [verification, setVerification] = useState({ status: 'idle', message: '' });
  const debouncedInput = useDebounce(input, 150);
  const debouncedSecret = useDebounce(secret, 150);

  const decoded = useMemo(() => {
    if (!debouncedInput.trim()) {
      return { header: null, payload: null, signature: '', error: null, signingInput: '' };
    }

    try {
      const parts = debouncedInput.trim().split('.');
      if (parts.length < 2) {
        throw new Error('JWTs need at least a header and a payload segment.');
      }

      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));

      return {
        header,
        payload,
        signature: parts[2] || '',
        signingInput: `${parts[0]}.${parts[1]}`,
        error: null,
      };
    } catch (error) {
      return {
        header: null,
        payload: null,
        signature: '',
        signingInput: '',
        error: error.message || 'Could not decode JWT.',
      };
    }
  }, [debouncedInput]);

  useEffect(() => {
    let cancelled = false;

    async function runVerification() {
      if (!debouncedSecret.trim() || decoded.error || !decoded.header) {
        setVerification({ status: 'idle', message: '' });
        return;
      }

      setVerification({ status: 'checking', message: 'Verifying signature…' });
      try {
        const result = await verifyJwtSignature({
          signingInput: decoded.signingInput,
          secret: debouncedSecret,
          algorithm: decoded.header.alg,
          signature: decoded.signature,
        });
        if (!cancelled) {
          setVerification(result);
        }
      } catch (error) {
        if (!cancelled) {
          setVerification({ status: 'invalid', message: error.message || 'Verification failed.' });
        }
      }
    }

    runVerification();
    return () => {
      cancelled = true;
    };
  }, [debouncedSecret, decoded]);

  const report = decoded.header
    ? [
        'Header',
        JSON.stringify(decoded.header, null, 2),
        '',
        'Payload',
        JSON.stringify(decoded.payload, null, 2),
        '',
        `Signature: ${decoded.signature || '(none)'}`,
        verification.message ? `Verification: ${verification.message}` : '',
      ].join('\n')
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="JWT"
      inputPlaceholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      dividerLabel="Decoded Token"
      error={decoded.error}
      output={report}
      outputRenderer={
        !input.trim() ? (
          <EmptyState
            iconName="Key"
            title="Decode JWT headers, payloads, and signatures"
            message="Paste a token to inspect claims, read expiration dates, and optionally verify HMAC signatures with a shared secret."
          />
        ) : decoded.header ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Algorithm',
                  value: decoded.header.alg || 'Unknown',
                  description: 'Signing algorithm declared in the header',
                  iconName: 'Key',
                },
                {
                  label: 'Expires',
                  value: formatTimestamp(decoded.payload.exp),
                  description: 'Human-readable expiration timestamp',
                  iconName: 'Clock',
                },
                {
                  label: 'Issued At',
                  value: formatTimestamp(decoded.payload.iat),
                  description: 'Human-readable issued-at timestamp',
                  iconName: 'Calendar',
                },
                {
                  label: 'Verification',
                  value:
                    verification.status === 'checking'
                      ? 'Checking'
                      : verification.status === 'valid'
                        ? 'Valid'
                        : verification.status === 'invalid'
                          ? 'Invalid'
                          : verification.status === 'unsupported'
                            ? 'Unsupported'
                            : 'Idle',
                  description: verification.message || 'Add a secret to verify the signature',
                  tone:
                    verification.status === 'valid'
                      ? 'success'
                      : verification.status === 'invalid'
                        ? 'error'
                        : verification.status === 'unsupported'
                          ? 'warning'
                          : 'default',
                  iconName: 'CheckCircle2',
                },
              ]}
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 12 }}>
              <SectionCard title="Header" value={JSON.stringify(decoded.header, null, 2)} />
              <SectionCard title="Payload" value={JSON.stringify(decoded.payload, null, 2)} />
              <SectionCard title="Signature" value={decoded.signature || '(none)'} />
            </div>
          </>
        ) : undefined
      }
      showEmptyState={false}
      options={
        <>
          <div className="options-label">Secret For Verification</div>
          <input
            type="text"
            className="textarea"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Only needed for HS256 / HS384 / HS512"
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setSecret('');
        setVerification({ status: 'idle', message: '' });
      }}
      downloadConfig={{
        filename: 'jwt-report.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: report,
        enabled: Boolean(report),
      }}
    />
  );
}
