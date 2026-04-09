'use client';

import { useEffect, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState, useDebounce } from '@/lib/tool-utils';
import { buildJwtClaimPayload, signJwtToken } from '@/lib/encoding-tool-utils';
import { EmptyState, ErrorCallout, MetricGrid, TextStatLine, ToolSectionDivider } from '@/tools/_shared/text-tool-kit';

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    sub: 'user-123',
    name: 'Apex Studio',
    role: 'admin',
  },
  null,
  2
);

export default function JwtGenerator() {
  const [algorithm, setAlgorithm] = useState('HS256');
  const [secret, setSecret] = useState('change-me');
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [token, setToken] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  const debouncedPayload = useDebounce(payloadText, 150);
  const debouncedSecret = useDebounce(secret, 150);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      if (!debouncedPayload.trim() || !debouncedSecret.trim()) {
        setToken('');
        setHeaderText('');
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await signJwtToken({
          payloadText: debouncedPayload,
          secret: debouncedSecret,
          algorithm,
        });

        if (cancelled) return;
        setToken(result.token);
        setHeaderText(JSON.stringify(result.header, null, 2));
      } catch (generationError) {
        if (cancelled) return;
        setToken('');
        setHeaderText('');
        setError(generationError.message || 'JWT generation failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generate();
    return () => {
      cancelled = true;
    };
  }, [algorithm, debouncedPayload, debouncedSecret]);

  const addClaim = (claim) => {
    try {
      setPayloadText((current) => buildJwtClaimPayload(current, claim));
      setError(null);
    } catch (claimError) {
      setError('Payload JSON must be valid before quick claims can be added.');
    }
  };

  const clearAll = () => {
    setAlgorithm('HS256');
    setSecret('change-me');
    setPayloadText(DEFAULT_PAYLOAD);
    setError(null);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Payload JSON</div>
        <textarea
          className="textarea"
          placeholder='{\n  "sub": "user-123"\n}'
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
          style={{ minHeight: 190, marginBottom: 8 }}
        />
        <TextStatLine
          items={[
            `${payloadText.length} characters`,
            secret ? 'Secret set' : 'Secret missing',
          ]}
        />

        <ToolSectionDivider label="Signed Token" />

        <ErrorCallout message={error} />

        {!payloadText.trim() || !secret.trim() ? (
          <EmptyState
            iconName="Key"
            title="Add a payload and secret"
            message="The tool signs tokens client-side with HMAC using your chosen algorithm."
          />
        ) : (
          <>
            <div className="panel-label">JWT Output</div>
            <textarea
              className="textarea"
              value={loading ? 'Generating token...' : token}
              readOnly
              style={{ minHeight: 150, marginBottom: 8 }}
            />
            {token ? (
              <TextStatLine
                items={[`${token.length} characters`, algorithm]}
              />
            ) : null}

            <div className="panel-label">Header Preview</div>
            <textarea
              className="textarea"
              value={headerText}
              readOnly
              style={{ minHeight: 110 }}
            />
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Algorithm</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {['HS256', 'HS384', 'HS512'].map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${algorithm === value ? ' active' : ''}`}
              onClick={() => setAlgorithm(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="options-label">Secret Key</div>
        <input
          type="text"
          className="textarea"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
        />

        <div className="options-label">Quick Claims</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {['iat', 'exp', 'nbf', 'sub', 'iss'].map((claim) => (
            <button
              key={claim}
              type="button"
              className="btn-ghost"
              style={{ justifyContent: 'center' }}
              onClick={() => addClaim(claim)}
            >
              Add {claim}
            </button>
          ))}
        </div>

        <div className="panel-divider" />

        <MetricGrid
          items={[
            {
              label: 'Status',
              value: loading ? 'Signing' : token ? 'Ready' : 'Waiting',
              iconName: loading ? 'Loader2' : 'CheckCircle2',
              tone: token ? 'success' : 'default',
            },
            {
              label: 'Parts',
              value: token ? token.split('.').length : 0,
              description: 'Header.Payload.Signature',
              iconName: 'Layers',
            },
          ]}
          columns="1fr"
          marginBottom={20}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(token)}
            disabled={!token}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={clearAll}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => downloadText(token, 'jwt.txt')}
          disabled={!token}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">
          HMAC signing runs fully in the browser. Your payload and secret stay on this device.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
