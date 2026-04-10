import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { getFeaturedTools, TOOLS } from '@/lib/tools-catalog';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';
import SectionLabel from '@/components/ui/SectionLabel';
import HeroSearchClient from '@/components/ui/HeroSearchClient';

const QUICK_ACCESS_SLUGS = [
  'pdf-to-word', 'image-compressor', 'png-to-base64', 'url-encoder',
  'qr-code-generator', 'hash-generator', 'timestamp-converter', 'word-counter',
  'image-color-picker', 'yaml-to-json', 'svg-to-png', 'regex-tester',
  'jwt-decoder', 'heic-to-jpg', 'ip-lookup', 'cron-builder',
  'uuid-generator', 'ocr-tool', 'mp4-to-gif', 'password-generator',
];

const HOW_IT_WORKS = [
  { iconName: 'Upload',   title: 'Upload or Paste', desc: 'Drag & drop, paste text, or enter a URL.' },
  { iconName: 'Cpu',      title: 'Processed Locally', desc: 'Runs in your browser — nothing leaves your device.' },
  { iconName: 'Download', title: 'Download Instantly', desc: 'Your file in seconds. No waiting, no queues.' },
];

const DIFFERENTIATORS = [
  { label: 'No upload limits',  icon: 'Maximize2' },
  { label: 'No watermarks',     icon: 'Eye' },
  { label: 'No rate limits',    icon: 'Zap' },
  { label: 'No account needed', icon: 'Lock' },
  { label: 'No server uploads', icon: 'ShieldCheck' },
  { label: 'No ads',            icon: 'Check' },
];

export default function HomePage() {
  const featured  = getFeaturedTools().slice(0, 4);
  const liveCount = TOOLS.filter((t) => t.status === 'live').length;

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="hero hero-animate">

        <div className="hero-tag">Every tool. One place.</div>

        <h1 style={{ letterSpacing: '-0.03em' }}>
          The Premier Utility<br />Suite for Everything.
        </h1>

        <p>
          Convert, compress, encode, decode, transform, and generate —
          no account required. Files never leave your device.
        </p>

        <HeroSearchClient />

        {/* Stats — large dramatic numbers */}
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-num">{liveCount}+</span>
            <span className="hero-stat-label">Free tools</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">100%</span>
            <span className="hero-stat-label">Client-side</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">0</span>
            <span className="hero-stat-label">Accounts needed</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">∞</span>
            <span className="hero-stat-label">No limits</span>
          </div>
        </div>
      </div>

      {/* ── "BUILT DIFFERENT" DIFFERENTIATOR STRIP ───────────────── */}
      <div className="diff-strip">
        <div className="diff-strip-inner">
          {DIFFERENTIATORS.map(({ label, icon }) => (
            <div key={label} className="diff-item">
              <Icon icon={ICON_MAP[icon]} size={13} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <section className="landing-section" style={{ padding: '0 40px 80px', maxWidth: 1200, margin: '0 auto' }}>

        {/* HOW IT WORKS */}
        <SectionLabel>How It Works</SectionLabel>
        <div className="how-it-works" style={{ marginBottom: 64 }}>
          {HOW_IT_WORKS.map((step, i) => (
            <>
              <div key={step.title} className="how-step">
                <div className="how-step-icon">
                  <Icon icon={ICON_MAP[step.iconName]} size={22} />
                </div>
                <div className="how-step-title">{step.title}</div>
                <div className="how-step-desc">{step.desc}</div>
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <div key={`arrow-${i}`} className="how-arrow">
                  <Icon icon={ICON_MAP.ChevronRight} size={20} />
                </div>
              )}
            </>
          ))}
        </div>

        {/* FEATURED */}
        <SectionLabel>Most Used</SectionLabel>

        {featured.length >= 2 && (
          <div className="featured-row" style={{ marginBottom: 12 }}>
            <FeaturedCard tool={featured[0]} accent />
            <FeaturedCard tool={featured[1]} />
          </div>
        )}
        {featured.length >= 4 && (
          <div className="featured-row" style={{ marginBottom: 48 }}>
            <FeaturedCard tool={featured[2]} />
            <FeaturedCard tool={featured[3]} />
          </div>
        )}

        {/* ALL CATEGORIES */}
        <SectionLabel>All Categories</SectionLabel>
        <div className="cat-grid" style={{ marginBottom: 48 }}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/tools?cat=${cat.id}`} className="cat-card">
              <div className="cat-card-icon">
                <Icon icon={ICON_MAP[cat.iconName]} size={28} />
              </div>
              <div className="cat-name">{cat.name}</div>
              <div className="cat-desc">{cat.description}</div>
              <div className="cat-count">{cat.count} tools</div>
            </Link>
          ))}
        </div>

        {/* QUICK ACCESS STRIP */}
        <div className="tools-strip">
          <div className="strip-label">Quick Access</div>
          <div className="tools-list">
            {QUICK_ACCESS_SLUGS.map((slug) => {
              const tool = TOOLS.find((t) => t.slug === slug);
              if (!tool) return null;
              return (
                <Link key={slug} href={`/tools/${slug}`} className="tool-pill">
                  {tool.name}
                </Link>
              );
            })}
          </div>
        </div>

      </section>
    </>
  );
}

function FeaturedCard({ tool, accent = false }) {
  const icon = ICON_MAP[tool.iconName];
  return (
    <Link href={`/tools/${tool.slug}`} className={`feat-card${accent ? ' accent' : ''}`}>
      <div className="feat-card-icon">
        <Icon icon={icon} size={28} />
      </div>
      <span className="tag">{tool.tag}</span>
      <div className="feat-name" style={{ marginTop: 12 }}>{tool.name}</div>
      <div className="feat-sub">{tool.description}</div>
      <div className="feat-cta">
        Try it free
        <Icon icon={ICON_MAP.ArrowRight} size={14} />
      </div>
    </Link>
  );
}
