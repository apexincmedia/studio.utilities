import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { getFeaturedTools, TOOLS } from '@/lib/tools-catalog';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';
import SectionLabel from '@/components/ui/SectionLabel';
import StatBlock, { StatRow } from '@/components/ui/StatBlock';
import HeroSearchClient from '@/components/ui/HeroSearchClient';

const QUICK_ACCESS_SLUGS = [
  'pdf-to-word',
  'image-compressor',
  'png-to-base64',
  'url-encoder',
  'qr-code-generator',
  'hash-generator',
  'timestamp-converter',
  'word-counter',
  'image-color-picker',
  'yaml-to-json',
  'svg-to-png',
  'regex-tester',
  'jwt-decoder',
  'heic-to-jpg',
  'ip-lookup',
  'cron-builder',
  'uuid-generator',
  'ocr-tool',
  'mp4-to-gif',
  'password-generator',
];

const HOW_IT_WORKS = [
  {
    iconName: 'Upload',
    title: 'Upload or Paste',
    desc: 'Drag & drop a file, paste text, or enter a URL.',
  },
  {
    iconName: 'Zap',
    title: 'We Process It',
    desc: 'Runs entirely in your browser. Nothing leaves your device.',
  },
  {
    iconName: 'Download',
    title: 'Download Instantly',
    desc: 'Get your converted or transformed file in seconds.',
  },
];

const TRUSTED_BY = ['Developers', 'Designers', 'Teams', 'Students', 'Creators'];

export default function HomePage() {
  const featured = getFeaturedTools().slice(0, 4);

  return (
    <>
      {/* HERO */}
      <div className="hero hero-animate">
        <div className="hero-tag">Every tool. One place.</div>

        <h1>
          The Premier Utility<br />Suite for Everything.
        </h1>

        <p>
          Convert, compress, encode, decode, transform, and generate —
          no account required. Files never leave your device.
        </p>

        <HeroSearchClient />

        <StatRow>
          <StatBlock value={`${TOOLS.length}+`} label="Tools" />
          <StatBlock value="100%" label="Free" />
          <StatBlock value="Client-Side" label="Privacy First" />
          <StatBlock value="No Signup" label="Ever" />
        </StatRow>

        {/* Trusted-by strip */}
        <div className="trusted-strip">
          <span className="trusted-label">Used by</span>
          {TRUSTED_BY.map((item, i) => (
            <span key={item} style={{ display: 'contents' }}>
              {i > 0 && <span className="trusted-sep" />}
              <span className="trusted-item">{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1200, margin: '0 auto' }}>

        {/* HOW IT WORKS */}
        <SectionLabel>How It Works</SectionLabel>
        <div className="how-it-works" style={{ marginBottom: 56 }}>
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
          <div className="featured-row" style={{ marginBottom: 40 }}>
            <FeaturedCard tool={featured[2]} />
            <FeaturedCard tool={featured[3]} />
          </div>
        )}

        {/* ALL CATEGORIES */}
        <SectionLabel>All Categories</SectionLabel>
        <div className="cat-grid" style={{ marginBottom: 40 }}>
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
