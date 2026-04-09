'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';

const TOPICS = [
  'Bug report',
  'Missing tool / feature request',
  'Tool output is incorrect',
  'Performance issue',
  'General feedback',
  'Other',
];

export default function ContactPage() {
  const [topic,   setTopic]   = useState('');
  const [message, setMessage] = useState('');
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic || !message.trim()) {
      setError('Please select a topic and enter a message.');
      return;
    }
    // In production, POST to /api/contact. For now, open mailto fallback.
    const subject = encodeURIComponent(`[Apex Studio] ${topic}`);
    const body    = encodeURIComponent(
      `Topic: ${topic}\n\nMessage:\n${message.trim()}${email ? `\n\nFrom: ${email}` : ''}`
    );
    window.open(`mailto:hello@apexstudioutilities.com?subject=${subject}&body=${body}`);
    setSent(true);
    setError('');
  };

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px 96px' }}>

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100, fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 24 }}>
          <Icon icon={ICON_MAP.Mail} size={12} />
          CONTACT
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, marginBottom: 16 }}>
          Get in touch
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7 }}>
          Found a bug? Want a tool that doesn't exist yet? Have feedback on the UI? We read everything.
        </p>
      </div>

      {sent ? (
        /* Success state */
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon icon={ICON_MAP.CheckCircle2} size={28} style={{ color: 'var(--success)' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
            Message sent
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
            Your email client should have opened with the pre-filled message. We aim to respond within 2 business days.
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setTopic(''); setMessage(''); setEmail(''); }}
            style={{ marginTop: 24, padding: '10px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}
          >
            Send another message
          </button>
        </div>
      ) : (
        /* Contact form */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Topic */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Topic <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 100,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: topic === t ? 700 : 400,
                    background: topic === t ? 'var(--pill-bg)' : 'var(--surface)',
                    color:      topic === t ? 'var(--pill-text)' : 'var(--muted)',
                    border:     `1px solid ${topic === t ? 'var(--pill-bg)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Message <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or feature request in as much detail as you can..."
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14,
                lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4, textAlign: 'right' }}>
              {message.length} characters
            </div>
          </div>

          {/* Email (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Your email <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--faint)' }}>(optional — for replies)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', fontSize: 13, color: '#F87171' }}>
              <Icon icon={ICON_MAP.AlertCircle} size={14} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            style={{
              padding: '14px 24px', background: 'var(--pill-bg)', color: 'var(--pill-text)',
              border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Icon icon={ICON_MAP.Mail} size={16} />
            Send message
          </button>

          <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', lineHeight: 1.5 }}>
            Clicking send will open your email client with the message pre-filled. We never store form submissions.
          </p>

        </form>
      )}

    </main>
  );
}
