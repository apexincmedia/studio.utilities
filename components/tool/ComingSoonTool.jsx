'use client';

import { useState } from 'react';

/**
 * ComingSoonTool — placeholder rendered for any tool with status: 'coming-soon'.
 *
 * Props:
 *   name: string  tool name, e.g. 'PDF to Word'
 */
export default function ComingSoonTool({ name }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    // No backend yet — purely visual confirmation
    setSubmitted(true);
  };

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="coming-soon-card">
        <div className="coming-soon-icon">🚧</div>
        <h2 className="coming-soon-title">{name} is coming soon</h2>
        <p className="coming-soon-desc">
          We&apos;re building this tool right now. Enter your email and we&apos;ll
          notify you the moment it launches.
        </p>

        {submitted ? (
          <p style={{ fontSize: 13, color: '#4ADE80' }}>
            You&apos;re on the list. We&apos;ll reach out soon.
          </p>
        ) : (
          <form className="coming-soon-form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderRadius: 'var(--radius-pill)', flex: 1 }}
            />
            <button type="submit" className="btn-primary">
              Notify me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
