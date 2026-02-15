import { useState } from 'react';

// ============================================================================
// Editorial — Reference Design
// A premium literary/culture digital magazine. Typography-first.
// High contrast black & white. Serif throughout. Burnt orange accent (sparse).
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens ----

const c = {
  // Surfaces
  bg: '#ffffff',
  surface: '#fafafa',
  surfaceDark: '#0a0a0a',

  // Text
  heading: '#0a0a0a',
  body: '#404040',
  muted: '#737373',
  caption: '#a3a3a3',
  rule: '#d4d4d4',
  ruleLight: '#e5e5e5',

  // Accent — used very sparingly
  accent: '#c87040',
  accentHover: '#b5613a',

  // Shadows — very subtle
  shadow1: 'rgba(0, 0, 0, 0.03)',
  shadow2: 'rgba(0, 0, 0, 0.06)',
  shadow3: 'rgba(0, 0, 0, 0.08)',
};

// ---- Typography ----

const font = {
  heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
  body: "'Source Serif Pro', Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

// ---- Easing ----

const ease = 'cubic-bezier(0.3, 0, 0.15, 1)';
const dur = '360ms'; // slow, deliberate

// ---- Masthead / Navigation ----

function Masthead() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = ['Essays', 'Fiction', 'Interviews', 'Archive'];

  return (
    <header
      style={{
        borderBottom: `1px solid ${c.ruleLight}`,
      }}
    >
      {/* Top utility bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 64px',
          borderBottom: `1px solid ${c.ruleLight}`,
        }}
      >
        <div
          style={{
            fontFamily: font.sans,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: c.muted,
          }}
        >
          Issue No. 47 &mdash; February 2026
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span
            style={{
              fontFamily: font.sans,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: c.accent,
              cursor: 'pointer',
            }}
          >
            Subscribe
          </span>
          <span
            style={{
              fontFamily: font.sans,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: c.muted,
              cursor: 'pointer',
            }}
          >
            Sign In
          </span>
        </div>
      </div>

      {/* Masthead title */}
      <div
        style={{
          textAlign: 'center' as const,
          padding: '36px 64px 28px',
        }}
      >
        <h1
          style={{
            fontFamily: font.heading,
            fontSize: 52,
            fontWeight: 700,
            color: c.heading,
            margin: 0,
            letterSpacing: '0.04em',
            lineHeight: 1,
            textTransform: 'uppercase' as const,
          }}
        >
          Verso
        </h1>
        <div
          style={{
            fontFamily: font.body,
            fontSize: 14,
            fontStyle: 'italic' as const,
            color: c.muted,
            marginTop: 8,
            letterSpacing: '0.02em',
          }}
        >
          Literature &middot; Culture &middot; Ideas
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          padding: '0 64px 18px',
        }}
      >
        {navItems.map((item) => (
          <a
            key={item}
            href="#"
            onClick={(e) => e.preventDefault()}
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              fontFamily: font.sans,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: hoveredItem === item ? c.heading : c.muted,
              textDecoration: 'none',
              transition: `color ${dur} ${ease}`,
              cursor: 'pointer',
              position: 'relative' as const,
            }}
          >
            {item}
          </a>
        ))}
      </nav>
    </header>
  );
}

// ---- Hero Section ----

function Hero() {
  const [hovered, setHovered] = useState(false);

  return (
    <section
      style={{
        padding: '80px 64px 72px',
        maxWidth: 1120,
        margin: '0 auto',
      }}
    >
      {/* Feature label */}
      <div
        style={{
          fontFamily: font.sans,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: c.accent,
          marginBottom: 20,
        }}
      >
        Featured Essay
      </div>

      {/* Hero image placeholder — editorial photography feel */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          aspectRatio: '16 / 7',
          background: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 30%, #404040 60%, #1a1a1a 100%)`,
          marginBottom: 48,
          position: 'relative' as const,
          overflow: 'hidden' as const,
          cursor: 'pointer',
        }}
      >
        {/* Film grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)`,
            opacity: hovered ? 0.8 : 1,
            transition: `opacity ${dur} ${ease}`,
          }}
        />
        {/* Caption overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '48px 40px 24px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }}
        >
          <div
            style={{
              fontFamily: font.sans,
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.04em',
            }}
          >
            Photograph by Elena Morozova
          </div>
        </div>
      </div>

      {/* Headline + excerpt */}
      <div
        style={{
          maxWidth: 820,
        }}
      >
        <h2
          style={{
            fontFamily: font.heading,
            fontSize: 48,
            fontWeight: 700,
            color: c.heading,
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}
        >
          The Weight of Unwritten Letters
        </h2>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 20,
            color: c.body,
            lineHeight: 1.7,
            margin: '24px 0 0',
            maxWidth: 680,
          }}
        >
          In an age of instant communication, the art of correspondence has not
          vanished &mdash; it has gone underground. A meditation on what we lose
          when every thought demands immediate transmission.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 24,
          }}
        >
          <span
            style={{
              fontFamily: font.body,
              fontSize: 15,
              fontStyle: 'italic' as const,
              color: c.accent,
            }}
          >
            by Marguerite Duras
          </span>
          <span style={{ color: c.rule }}>&middot;</span>
          <span
            style={{
              fontFamily: font.sans,
              fontSize: 12,
              color: c.caption,
              letterSpacing: '0.02em',
            }}
          >
            12 min read
          </span>
        </div>
      </div>
    </section>
  );
}

// ---- Pull Quote ----

function PullQuote() {
  return (
    <section
      style={{
        padding: '64px 64px',
        maxWidth: 1120,
        margin: '0 auto',
        borderTop: `1px solid ${c.ruleLight}`,
        borderBottom: `1px solid ${c.ruleLight}`,
      }}
    >
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          textAlign: 'center' as const,
        }}
      >
        <div
          style={{
            fontFamily: font.heading,
            fontSize: 64,
            color: c.rule,
            lineHeight: 0.5,
            marginBottom: 20,
          }}
        >
          &ldquo;
        </div>
        <blockquote
          style={{
            fontFamily: font.heading,
            fontSize: 32,
            fontWeight: 400,
            fontStyle: 'italic' as const,
            color: c.heading,
            lineHeight: 1.45,
            margin: 0,
            padding: 0,
          }}
        >
          We have traded the slow luxury of choosing words for the frantic comfort
          of sending them. The unsent letter is the last private space.
        </blockquote>
        <div
          style={{
            marginTop: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 1,
              background: c.rule,
            }}
          />
          <span
            style={{
              fontFamily: font.sans,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: c.muted,
            }}
          >
            From the essay
          </span>
          <div
            style={{
              width: 32,
              height: 1,
              background: c.rule,
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ---- Article Card ----

interface Article {
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
}

function ArticleCard({ article }: { article: Article }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        paddingBottom: 32,
        borderBottom: `1px solid ${c.ruleLight}`,
      }}
    >
      {/* Placeholder image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '3 / 2',
          background: hovered
            ? `linear-gradient(145deg, #2a2a2a 0%, #3d3d3d 50%, #2a2a2a 100%)`
            : `linear-gradient(145deg, #1a1a1a 0%, #333333 50%, #1a1a1a 100%)`,
          marginBottom: 24,
          transition: `background ${dur} ${ease}`,
          position: 'relative' as const,
          overflow: 'hidden' as const,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 60% 40%, rgba(255,255,255,0.03) 0%, transparent 60%)`,
          }}
        />
      </div>

      <div
        style={{
          fontFamily: font.sans,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: c.muted,
          marginBottom: 12,
        }}
      >
        {article.category}
      </div>

      <h3
        style={{
          fontFamily: font.heading,
          fontSize: 24,
          fontWeight: 700,
          color: c.heading,
          margin: 0,
          lineHeight: 1.25,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            backgroundImage: `linear-gradient(${c.heading}, ${c.heading})`,
            backgroundPosition: '0 100%',
            backgroundSize: hovered ? '100% 1px' : '0% 1px',
            backgroundRepeat: 'no-repeat',
            transition: `background-size ${dur} ${ease}`,
            paddingBottom: 2,
          }}
        >
          {article.title}
        </span>
      </h3>

      <p
        style={{
          fontFamily: font.body,
          fontSize: 16,
          color: c.body,
          lineHeight: 1.65,
          margin: '0 0 16px',
        }}
      >
        {article.excerpt}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: font.body,
            fontSize: 14,
            fontStyle: 'italic' as const,
            color: c.accent,
          }}
        >
          {article.author}
        </span>
        <span
          style={{
            fontFamily: font.sans,
            fontSize: 12,
            color: c.caption,
          }}
        >
          {article.date}
        </span>
        <span style={{ color: c.rule }}>&middot;</span>
        <span
          style={{
            fontFamily: font.sans,
            fontSize: 12,
            color: c.caption,
          }}
        >
          {article.readTime}
        </span>
      </div>
    </article>
  );
}

// ---- Articles Grid ----

const articles: Article[] = [
  {
    category: 'Fiction',
    title: 'All the Light That Remains',
    excerpt:
      'A woman returns to the coastal town of her childhood to find that memory and landscape have become indistinguishable. A story of grief, geography, and the spaces between what was and what is.',
    author: 'Yoko Ogawa',
    date: 'Feb 8, 2026',
    readTime: '18 min',
  },
  {
    category: 'Culture',
    title: 'The Architecture of Silence',
    excerpt:
      'Inside the new wave of libraries, concert halls, and sacred spaces designed not to impress, but to quiet. Why architects are rediscovering the radical power of absence.',
    author: 'Peter Zumthor',
    date: 'Feb 3, 2026',
    readTime: '14 min',
  },
  {
    category: 'Interview',
    title: 'A Conversation with Hilary Mantel',
    excerpt:
      'On writing history from the inside out, the moral weight of fiction, and why the past is never a foreign country &mdash; it is the room we are standing in.',
    author: 'Verso Editors',
    date: 'Jan 27, 2026',
    readTime: '22 min',
  },
];

function ArticlesGrid() {
  return (
    <section
      style={{
        padding: '72px 64px',
        maxWidth: 1120,
        margin: '0 auto',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 48,
          borderBottom: `2px solid ${c.heading}`,
          paddingBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: font.heading,
            fontSize: 28,
            fontWeight: 700,
            color: c.heading,
            margin: 0,
          }}
        >
          Latest
        </h2>
        <span
          style={{
            fontFamily: font.sans,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: c.muted,
            cursor: 'pointer',
          }}
        >
          View All &rarr;
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 40,
        }}
      >
        {articles.map((article) => (
          <ArticleCard key={article.title} article={article} />
        ))}
      </div>
    </section>
  );
}

// ---- Featured Excerpt Section ----

function FeaturedExcerpt() {
  return (
    <section
      style={{
        padding: '80px 64px',
        background: c.surfaceDark,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            fontFamily: font.sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: c.accent,
            marginBottom: 24,
          }}
        >
          From the Archive
        </div>

        <h3
          style={{
            fontFamily: font.heading,
            fontSize: 36,
            fontWeight: 700,
            fontStyle: 'italic' as const,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.3,
            marginBottom: 32,
          }}
        >
          On the Duty of Civil Disobedience
        </h3>

        <p
          style={{
            fontFamily: font.body,
            fontSize: 18,
            color: '#a3a3a3',
            lineHeight: 1.8,
            margin: '0 0 24px',
          }}
        >
          That government is best which governs not at all; and when men are
          prepared for it, that will be the kind of government which they will
          have. Government is at best but an expedient; but most governments are
          usually, and all governments are sometimes, inexpedient.
        </p>

        <p
          style={{
            fontFamily: font.body,
            fontSize: 18,
            color: '#a3a3a3',
            lineHeight: 1.8,
            margin: '0 0 36px',
          }}
        >
          The objections which have been brought against a standing army, and
          they are many and weighty, and deserve to prevail, may also at last be
          brought against a standing government. The standing army is only an
          arm of the standing government.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span
            style={{
              fontFamily: font.body,
              fontSize: 15,
              fontStyle: 'italic' as const,
              color: '#d4d4d4',
            }}
          >
            Henry David Thoreau
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>&middot;</span>
          <span
            style={{
              fontFamily: font.sans,
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.02em',
            }}
          >
            Originally published 1849
          </span>
        </div>
      </div>
    </section>
  );
}

// ---- Newsletter Section ----

function Newsletter() {
  const [focused, setFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <section
      style={{
        padding: '72px 64px',
        maxWidth: 1120,
        margin: '0 auto',
        borderBottom: `1px solid ${c.ruleLight}`,
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          textAlign: 'center' as const,
        }}
      >
        <h3
          style={{
            fontFamily: font.heading,
            fontSize: 28,
            fontWeight: 700,
            color: c.heading,
            margin: 0,
            marginBottom: 12,
          }}
        >
          The Weekly Letter
        </h3>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 16,
            color: c.body,
            lineHeight: 1.7,
            margin: '0 0 32px',
          }}
        >
          One essay, one poem, one idea &mdash; delivered every Sunday morning.
          No algorithms, no feeds. Just considered words.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1,
              height: 48,
              padding: '0 20px',
              fontFamily: font.body,
              fontSize: 15,
              color: c.heading,
              background: '#ffffff',
              border: `1px solid ${focused ? c.heading : c.rule}`,
              outline: 'none',
              transition: `border-color ${dur} ${ease}`,
              boxSizing: 'border-box' as const,
            }}
          />
          <button
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              height: 48,
              padding: '0 28px',
              fontFamily: font.sans,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#ffffff',
              background: btnHovered ? '#1a1a1a' : c.heading,
              border: 'none',
              cursor: 'pointer',
              transition: `background ${dur} ${ease}`,
            }}
          >
            Subscribe
          </button>
        </div>
        <p
          style={{
            fontFamily: font.sans,
            fontSize: 12,
            color: c.caption,
            marginTop: 16,
          }}
        >
          Join 24,000 readers. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

// ---- Footer ----

function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const sections = [
    { label: 'Sections', items: ['Essays', 'Fiction', 'Poetry', 'Interviews', 'Reviews'] },
    { label: 'About', items: ['Masthead', 'Contributors', 'Ethics', 'Contact'] },
  ];

  return (
    <footer
      style={{
        padding: '56px 64px 40px',
        maxWidth: 1120,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 48,
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: font.heading,
              fontSize: 28,
              fontWeight: 700,
              color: c.heading,
              letterSpacing: '0.03em',
              textTransform: 'uppercase' as const,
            }}
          >
            Verso
          </div>
          <div
            style={{
              fontFamily: font.body,
              fontSize: 14,
              fontStyle: 'italic' as const,
              color: c.muted,
              marginTop: 6,
            }}
          >
            Literature &middot; Culture &middot; Ideas
          </div>
        </div>

        {/* Link columns */}
        <div style={{ display: 'flex', gap: 80 }}>
          {sections.map((section) => (
            <div key={section.label}>
              <div
                style={{
                  fontFamily: font.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: c.muted,
                  marginBottom: 16,
                }}
              >
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {section.items.map((item) => (
                  <a
                    key={item}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    onMouseEnter={() => setHoveredLink(item)}
                    onMouseLeave={() => setHoveredLink(null)}
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      color: hoveredLink === item ? c.heading : c.body,
                      textDecoration: 'none',
                      transition: `color ${dur} ${ease}`,
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom rule */}
      <div
        style={{
          borderTop: `1px solid ${c.ruleLight}`,
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: font.sans,
            fontSize: 12,
            color: c.caption,
          }}
        >
          &copy; 2026 Verso Magazine. All rights reserved.
        </span>
        <span
          style={{
            fontFamily: font.sans,
            fontSize: 12,
            color: c.caption,
            fontStyle: 'italic' as const,
          }}
        >
          &ldquo;Read slowly. Think long.&rdquo;
        </span>
      </div>
    </footer>
  );
}

// ---- Main Layout ----

export default function EditorialSite() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: c.bg,
        color: c.body,
        fontFamily: font.body,
        fontSize: 18,
        lineHeight: 1.7,
        position: 'relative' as const,
      }}
    >
      <Masthead />
      <Hero />
      <PullQuote />
      <ArticlesGrid />
      <FeaturedExcerpt />
      <Newsletter />
      <Footer />
    </div>
  );
}
