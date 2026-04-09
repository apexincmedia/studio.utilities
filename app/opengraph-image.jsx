import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Apex Studio Utilities — 170+ Free Web Tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080D',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid dot background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Diamond logo */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 32 32"
          style={{ marginBottom: 28 }}
        >
          <polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="16,8 24,16 16,24 8,16" fill="white" />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-1px',
            marginBottom: 20,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          Apex Studio Utilities
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: '#BBBBD0',
            marginBottom: 40,
            textAlign: 'center',
          }}
        >
          170+ free tools. Convert, compress, encode, transform.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['No signup', 'Client-side', 'Instant', 'Free forever'].map((label) => (
            <div
              key={label}
              style={{
                padding: '8px 20px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 100,
                fontSize: 18,
                color: '#BBBBD0',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 18,
            color: '#3A3A4A',
          }}
        >
          apexstudioutilities.com
        </div>
      </div>
    ),
    { ...size }
  );
}
