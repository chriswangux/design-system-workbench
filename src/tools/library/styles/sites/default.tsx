import { useState, type CSSProperties } from 'react';

// ============================================================================
// Default — Reference Design
// A clean SaaS product landing page. Blue accent on neutral grays.
// The standard, reliable starting point.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens (literal values) ----

const c = {
  // Surfaces
  bg: '#f5f5f7',
  white: '#ffffff',
  surface1: '#eeeef1',
  surface2: '#e4e4e8',

  // Text
  text: '#1a1a2e',
  textSecondary: '#6b6b80',
  textTertiary: '#9898ab',
  textOnAccent: '#ffffff',

  // Accent (blue)
  accent: '#4a7fd4',
  accentDark: '#1a3f7a',
  accentLight: '#6a9de8',
  accentBg: 'rgba(74, 127, 212, 0.08)',
  accentBorder: 'rgba(74, 127, 212, 0.20)',

  // Borders
  border: 'rgba(26, 26, 46, 0.10)',
  borderSubtle: 'rgba(26, 26, 46, 0.06)',

  // Shadows
  shadowSm: '0 1px 3px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04)',
  shadowMd: '0 4px 12px rgba(26, 26, 46, 0.08), 0 2px 4px rgba(26, 26, 46, 0.04)',
  shadowLg: '0 8px 24px rgba(26, 26, 46, 0.10), 0 4px 8px rgba(26, 26, 46, 0.04)',

  // Semantic
  success: '#2a9d5c',
  successBg: 'rgba(42, 157, 92, 0.08)',
};

// ---- Typography ----

const font = {
  sans: "'Inter', -apple-system, system-ui, sans-serif",
};

// ---- Shared Styles ----

const ease = 'cubic-bezier(0.2, 0, 0, 1)';
const maxWidth = 1120;
const sectionPadding = '80px 0';

function container(extra?: CSSProperties): CSSProperties {
  return {
    maxWidth,
    margin: '0 auto',
    padding: '0 32px',
    ...extra,
  };
}

// ---- Button ----

function Button({
  children,
  variant = 'primary',
  style,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  style?: CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    padding: '0 24px',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: font.sans,
    cursor: 'pointer',
    border: 'none',
    transition: `background 200ms ${ease}, transform 200ms ${ease}, box-shadow 200ms ${ease}`,
    transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
  };

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: hovered ? c.accentDark : c.accent,
      color: c.textOnAccent,
      boxShadow: hovered ? c.shadowMd : c.shadowSm,
    },
    secondary: {
      background: hovered ? c.surface1 : c.white,
      color: c.text,
      border: `1px solid ${c.border}`,
      boxShadow: hovered ? c.shadowMd : c.shadowSm,
    },
  };

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ---- Navbar ----

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      const el = document.getElementById('default-site-root');
      if (el) {
        setScrolled(el.scrollTop > 10);
      }
    }, { passive: true });
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(245, 245, 247, 0.85)' : c.bg,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${scrolled ? c.border : 'transparent'}`,
        transition: `background 300ms ${ease}, border-color 300ms ${ease}`,
      }}
    >
      <div
        style={{
          ...container(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: c.textOnAccent, fontFamily: font.sans }}>F</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: c.text, fontFamily: font.sans, letterSpacing: '-0.02em' }}>Flux</span>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Features', 'Pricing', 'Docs', 'Blog'].map((link) => (
            <NavLink key={link} label={link} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: c.textSecondary,
              fontFamily: font.sans,
              cursor: 'pointer',
            }}
          >
            Sign in
          </span>
          <Button style={{ height: 38, padding: '0 18px', fontSize: 14 }}>Get Started</Button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: hovered ? c.text : c.textSecondary,
        fontFamily: font.sans,
        cursor: 'pointer',
        transition: `color 200ms ${ease}`,
      }}
    >
      {label}
    </span>
  );
}

// ---- Hero Section ----

function HeroSection() {
  return (
    <section style={{ padding: '80px 0 96px' }}>
      <div style={{ ...container(), textAlign: 'center' }}>
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 999,
            background: c.accentBg,
            border: `1px solid ${c.accentBorder}`,
            marginBottom: 24,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.success }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: c.accent, fontFamily: font.sans }}>
            Now in public beta
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: c.text,
            fontFamily: font.sans,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            margin: '0 auto 20px',
            maxWidth: 720,
          }}
        >
          Build products{' '}
          <span style={{ color: c.accent }}>faster</span>
          {' '}with less friction
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontSize: 18,
            color: c.textSecondary,
            fontFamily: font.sans,
            lineHeight: 1.6,
            margin: '0 auto 40px',
            maxWidth: 560,
          }}
        >
          Flux is the developer platform that simplifies workflows, automates the tedious parts, and lets your team ship what matters.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Button>Start for free</Button>
          <Button variant="secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch demo
          </Button>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {/* Avatar stack */}
          <div style={{ display: 'flex' }}>
            {['#4a7fd4', '#2a9d5c', '#e8a849', '#d45a6a', '#7c5abf'].map((bg, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: bg,
                  border: `2px solid ${c.bg}`,
                  marginLeft: i > 0 ? -8 : 0,
                  position: 'relative',
                  zIndex: 5 - i,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 13, color: c.textSecondary, fontFamily: font.sans, marginLeft: 4 }}>
            Trusted by 2,400+ teams
          </span>
        </div>
      </div>
    </section>
  );
}

// ---- Feature Cards ----

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.white,
        border: `1px solid ${hovered ? c.accentBorder : c.border}`,
        borderRadius: 12,
        padding: '32px 28px',
        transition: `border-color 300ms ${ease}, box-shadow 300ms ${ease}, transform 300ms ${ease}`,
        boxShadow: hovered ? c.shadowMd : c.shadowSm,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: c.accentBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          transition: `background 300ms ${ease}`,
          ...(hovered ? { background: `rgba(74, 127, 212, 0.14)` } : {}),
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: c.text,
          fontFamily: font.sans,
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: c.textSecondary,
          fontFamily: font.sans,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function FeatureIcon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <FeatureIcon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
      title: 'Lightning Fast Deploys',
      description: 'Push to production in seconds with zero-downtime deployments. Preview branches automatically and roll back instantly.',
    },
    {
      icon: <FeatureIcon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
      title: 'Enterprise Security',
      description: 'SOC 2 Type II compliant with end-to-end encryption, SSO integration, and granular role-based access controls.',
    },
    {
      icon: <FeatureIcon d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" />,
      title: 'Modular Architecture',
      description: 'Compose your stack from pre-built modules. Swap, extend, or replace any layer without touching the rest of your system.',
    },
  ];

  return (
    <section style={{ padding: sectionPadding, background: c.white }}>
      <div style={container()}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: c.accent,
              fontFamily: font.sans,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            Features
          </p>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: c.text,
              fontFamily: font.sans,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              margin: '0 auto 16px',
              maxWidth: 480,
            }}
          >
            Everything you need to ship
          </h2>
          <p
            style={{
              fontSize: 16,
              color: c.textSecondary,
              fontFamily: font.sans,
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 520,
            }}
          >
            From development to production, Flux gives your team the tools to move fast without breaking things.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Testimonial Section ----

function TestimonialSection() {
  return (
    <section style={{ padding: sectionPadding, background: c.bg }}>
      <div style={{ ...container(), maxWidth: 800, textAlign: 'center' }}>
        {/* Quote mark */}
        <div
          style={{
            fontSize: 64,
            color: c.accentBorder,
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
            marginBottom: 8,
            userSelect: 'none',
          }}
        >
          &ldquo;
        </div>

        {/* Quote text */}
        <blockquote
          style={{
            fontSize: 22,
            color: c.text,
            fontFamily: font.sans,
            lineHeight: 1.6,
            fontWeight: 400,
            margin: '0 0 32px',
            letterSpacing: '-0.01em',
          }}
        >
          Flux cut our deployment pipeline from 45 minutes to under 3. Our team ships twice as many features now, and the developer experience is night and day compared to what we had before.
        </blockquote>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, color: c.textOnAccent, fontFamily: font.sans }}>SR</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: c.text, fontFamily: font.sans }}>Sarah Richardson</div>
            <div style={{ fontSize: 13, color: c.textSecondary, fontFamily: font.sans }}>VP of Engineering, Meridian</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- CTA Banner ----

function CTABanner() {
  return (
    <section style={{ padding: '64px 0', background: c.white }}>
      <div
        style={{
          ...container(),
          maxWidth: 960,
          background: `linear-gradient(135deg, ${c.accentDark}, ${c.accent})`,
          borderRadius: 16,
          padding: '56px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 40%)',
            pointerEvents: 'none',
          }}
        />

        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: c.textOnAccent,
            fontFamily: font.sans,
            letterSpacing: '-0.025em',
            marginBottom: 12,
            position: 'relative',
          }}
        >
          Ready to simplify your workflow?
        </h2>
        <p
          style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.75)',
            fontFamily: font.sans,
            lineHeight: 1.6,
            marginBottom: 32,
            position: 'relative',
          }}
        >
          Start building for free. No credit card required.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, position: 'relative' }}>
          <Button
            style={{
              background: c.textOnAccent,
              color: c.accentDark,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            Get started free
          </Button>
          <Button
            variant="secondary"
            style={{
              background: 'transparent',
              color: c.textOnAccent,
              border: '1px solid rgba(255, 255, 255, 0.30)',
              boxShadow: 'none',
            }}
          >
            Talk to sales
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---- Footer ----

function Footer() {
  const linkStyle: CSSProperties = {
    fontSize: 13,
    color: c.textSecondary,
    fontFamily: font.sans,
    textDecoration: 'none',
    cursor: 'pointer',
    lineHeight: 2,
  };

  const headingStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: c.text,
    fontFamily: font.sans,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const columns = [
    { heading: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Integrations'] },
    { heading: 'Resources', links: ['Documentation', 'API Reference', 'Guides', 'Examples', 'Status'] },
    { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
    { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR'] },
  ];

  return (
    <footer style={{ padding: '56px 0 40px', background: c.bg, borderTop: `1px solid ${c.border}` }}>
      <div style={container()}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)', gap: 48, marginBottom: 48 }}>
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: c.textOnAccent, fontFamily: font.sans }}>F</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: c.text, fontFamily: font.sans }}>Flux</span>
            </div>
            <p style={{ fontSize: 13, color: c.textSecondary, fontFamily: font.sans, lineHeight: 1.6, maxWidth: 240 }}>
              The developer platform for teams that ship fast.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <div style={headingStyle}>{col.heading}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {col.links.map((link) => (
                  <span key={link} style={linkStyle}>{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <span style={{ fontSize: 12, color: c.textTertiary, fontFamily: font.sans }}>
            &copy; 2025 Flux, Inc. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Social icons */}
            {[
              'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
              'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z M2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z',
              'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
            ].map((d, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
                {d.split(' M').map((seg, j) => (
                  <path key={j} d={j === 0 ? seg : `M${seg}`} />
                ))}
              </svg>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---- Main Layout ----

export default function DefaultSite() {
  return (
    <div
      id="default-site-root"
      style={{
        width: '100%',
        minHeight: '100vh',
        background: c.bg,
        color: c.text,
        fontFamily: font.sans,
        fontSize: 16,
        lineHeight: 1.5,
        WebkitFontSmoothing: 'antialiased',
        overflowX: 'hidden',
      }}
    >
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TestimonialSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
