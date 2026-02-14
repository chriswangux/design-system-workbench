/**
 * SaaS Landing Page Demo
 * Exercises: color palettes, typography scale, spacing, shadows, border radius, motion
 * All visual properties use CSS custom properties from the token bridge.
 */
import { useState, useEffect, type CSSProperties } from 'react';
import { m, FadeIn, ScaleIn, Stagger, AnimatedNumber } from '../shared/motion';

/* ─── Shared style helpers ─── */

const t = {
  // Colors
  bg: 'var(--sem-background, #fafafa)',
  fg: 'var(--sem-foreground, #171717)',
  primary: 'var(--sem-primary, #3b82f6)',
  primaryFg: 'var(--sem-primary-foreground, #fafafa)',
  secondary: 'var(--sem-secondary, #73737320)',
  secondaryFg: 'var(--sem-secondary-foreground, #171717)',
  muted: 'var(--sem-muted, #737373)',
  mutedFg: 'var(--sem-muted-foreground, #17171780)',
  accent: 'var(--sem-accent, #3b82f6)',
  accentFg: 'var(--sem-accent-foreground, #fafafa)',
  border: 'var(--sem-border, #73737340)',
  // Typography
  fontHeading: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
  fontBody: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
  fontMono: 'var(--sem-font-mono, JetBrains Mono, monospace)',
  // Spacing
  sp1: 'var(--spacing-100, 0.25rem)',
  sp2: 'var(--spacing-200, 0.5rem)',
  sp3: 'var(--spacing-300, 0.75rem)',
  sp4: 'var(--spacing-400, 1rem)',
  sp6: 'var(--spacing-600, 1.5rem)',
  sp8: 'var(--spacing-800, 2rem)',
  sp10: 'var(--spacing-1000, 2.5rem)',
  sp12: 'var(--spacing-1200, 3rem)',
  sp16: 'var(--spacing-1600, 4rem)',
  // Shadows (names match shadow lab: sm, md, lg, xl, 2xl)
  shadow1: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
  shadow2: 'var(--shadow-md, 0 2px 4px rgba(0,0,0,0.06))',
  shadow3: 'var(--shadow-lg, 0 4px 6px rgba(0,0,0,0.07))',
  shadow4: 'var(--shadow-xl, 0 8px 16px rgba(0,0,0,0.08))',
  // Font sizes
  fsXs: 'var(--typography-fontSize-xs, 0.75rem)',
  fsSm: 'var(--typography-fontSize-sm, 0.875rem)',
  fsBase: 'var(--typography-fontSize-base, 1rem)',
  fsLg: 'var(--typography-fontSize-lg, 1.125rem)',
  fsXl: 'var(--typography-fontSize-xl, 1.25rem)',
  fs2xl: 'var(--typography-fontSize-2xl, 1.5rem)',
  fs3xl: 'var(--typography-fontSize-3xl, 1.875rem)',
  fs4xl: 'var(--typography-fontSize-4xl, 2.25rem)',
  fs5xl: 'var(--typography-fontSize-5xl, 3rem)',
  // Line height
  lhTight: 'var(--typography-lineHeight-tight, 1.15)',
  lhBase: 'var(--typography-lineHeight-base, 1.5)',
  // Motion
  easing: m.easingStandard,
  duration: m.durationFast,
  durationNormal: m.durationNormal,
  durationSlow: m.durationSlow,
  easingEntrance: m.easingEntrance,
  easingSpring: m.easingSpring,
};

/* ─── Responsive hook ─── */

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

/* ─── Reusable primitives ─── */

function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: t.sp6,
        paddingRight: t.sp6,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: t.sp2,
        padding: `${t.sp1} ${t.sp3}`,
        fontSize: t.fsSm,
        fontWeight: 500,
        color: t.primary,
        backgroundColor: t.secondary,
        borderRadius: '9999px',
        border: `1px solid ${t.border}`,
        fontFamily: t.fontBody,
      }}
    >
      {children}
    </span>
  );
}

function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const sizeStyles: Record<string, CSSProperties> = {
    sm: { padding: `${t.sp2} ${t.sp4}`, fontSize: t.fsSm },
    md: { padding: `${t.sp3} ${t.sp6}`, fontSize: t.fsBase },
    lg: { padding: `${t.sp4} ${t.sp8}`, fontSize: t.fsLg },
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      backgroundColor: t.primary,
      color: t.primaryFg,
      border: 'none',
      boxShadow: hovered ? t.shadow3 : t.shadow1,
    },
    secondary: {
      backgroundColor: hovered ? t.secondary : 'transparent',
      color: t.fg,
      border: `1px solid ${t.border}`,
    },
    ghost: {
      backgroundColor: hovered ? t.secondary : 'transparent',
      color: t.fg,
      border: 'none',
    },
  };

  const scale = pressed ? 'scale(0.96)' : '';
  const translate = hovered ? 'translateY(-1px)' : 'translateY(0)';

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.sp2,
        fontFamily: t.fontBody,
        fontWeight: 600,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: `all ${t.duration} ${t.easing}`,
        transform: `${translate} ${scale}`.trim(),
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        marginBottom: t.sp16,
        maxWidth: '680px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {badge && (
        <div style={{ marginBottom: t.sp4 }}>
          <Badge>{badge}</Badge>
        </div>
      )}
      <h2
        style={{
          fontFamily: t.fontHeading,
          fontSize: t.fs4xl,
          fontWeight: 700,
          lineHeight: t.lhTight,
          color: t.fg,
          margin: 0,
          letterSpacing: '-0.025em',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: t.fontBody,
          fontSize: t.fsLg,
          lineHeight: t.lhBase,
          color: t.mutedFg,
          marginTop: t.sp4,
          marginBottom: 0,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

/* ─── SVG Icons (inline to avoid deps) ─── */

function IconZap({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShield({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBarChart({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function IconLayers({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconCheck({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowRight({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconStar({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconMenu({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ─── Navbar ─── */

function Navbar() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = ['Product', 'Features', 'Pricing', 'Docs'];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: scrolled ? t.bg : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${t.border}` : '1px solid transparent',
        transition: `all ${t.duration} ${t.easing}`,
      }}
    >
      <Container>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: t.sp3,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.primaryFg,
              }}
            >
              <IconLayers size={18} />
            </div>
            <span
              style={{
                fontFamily: t.fontHeading,
                fontWeight: 700,
                fontSize: t.fsLg,
                color: t.fg,
                letterSpacing: '-0.02em',
              }}
            >
              Astra
            </span>
          </div>

          {/* Desktop nav */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: t.sp8,
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  style={{
                    fontFamily: t.fontBody,
                    fontSize: t.fsSm,
                    fontWeight: 500,
                    color: t.mutedFg,
                    textDecoration: 'none',
                    transition: `color ${t.duration} ${t.easing}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = t.fg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = t.mutedFg)
                  }
                >
                  {link}
                </a>
              ))}
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: t.sp3 }}>
            {!isMobile && (
              <>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button variant="primary" size="sm">
                  Get started
                  <IconArrowRight size={14} />
                </Button>
              </>
            )}
            {isMobile && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: t.fg,
                  cursor: 'pointer',
                  padding: t.sp2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {menuOpen ? <IconX size={24} /> : <IconMenu size={24} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobile && menuOpen && (
          <div
            style={{
              padding: `${t.sp4} 0 ${t.sp6}`,
              borderTop: `1px solid ${t.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: t.sp2,
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                style={{
                  fontFamily: t.fontBody,
                  fontSize: t.fsBase,
                  fontWeight: 500,
                  color: t.fg,
                  textDecoration: 'none',
                  padding: `${t.sp2} 0`,
                }}
              >
                {link}
              </a>
            ))}
            <div style={{ marginTop: t.sp3, display: 'flex', flexDirection: 'column', gap: t.sp2 }}>
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
              <Button variant="primary" size="sm">
                Get started
              </Button>
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}

/* ─── Hero ─── */

function Hero() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      style={{
        paddingTop: isMobile ? t.sp12 : '5rem',
        paddingBottom: isMobile ? t.sp12 : '5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: `radial-gradient(ellipse at center, ${t.primary}12 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Container style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            textAlign: 'center',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <FadeIn delay={0}>
            <div style={{ marginBottom: t.sp6 }}>
              <Badge>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                Now in public beta
              </Badge>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1
              style={{
                fontFamily: t.fontHeading,
                fontSize: isMobile ? t.fs3xl : 'clamp(2.5rem, 5vw, 3.75rem)',
                fontWeight: 800,
                lineHeight: t.lhTight,
                color: t.fg,
                margin: 0,
                letterSpacing: '-0.035em',
              }}
            >
              Ship faster with
              <br />
              <span style={{ color: t.primary }}>intelligent workflows</span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: isMobile ? t.fsBase : t.fsXl,
                lineHeight: t.lhBase,
                color: t.mutedFg,
                marginTop: t.sp6,
                marginBottom: 0,
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Astra unifies your team's projects, documents, and workflows in
              one seamless platform. Automate the repetitive. Focus on what
              matters.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: t.sp4,
                marginTop: t.sp10,
                flexWrap: 'wrap',
              }}
            >
              <Button variant="primary" size="lg">
                Start for free
                <IconArrowRight size={18} />
              </Button>
              <Button variant="secondary" size="lg">
                Book a demo
              </Button>
            </div>

            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fsSm,
                color: t.mutedFg,
                marginTop: t.sp4,
              }}
            >
              Free for up to 5 users. No credit card required.
            </p>
          </FadeIn>
        </div>

        {/* Hero visual - abstract app preview */}
        <ScaleIn delay={500} style={{ marginTop: isMobile ? t.sp10 : '4rem' }}>
        <div
          style={{
            borderRadius: '16px',
            border: `1px solid ${t.border}`,
            boxShadow: `${t.shadow4}, 0 0 0 1px ${t.border}`,
            overflow: 'hidden',
            background: t.bg,
            position: 'relative',
          }}
        >
          {/* Window chrome */}
          <div
            style={{
              padding: `${t.sp3} ${t.sp4}`,
              borderBottom: `1px solid ${t.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: t.sp2,
              background: t.secondary,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
            <div
              style={{
                marginLeft: t.sp4,
                flex: 1,
                height: '28px',
                borderRadius: '6px',
                backgroundColor: t.secondary,
                border: `1px solid ${t.border}`,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: t.sp3,
              }}
            >
              <span style={{ fontSize: t.fsXs, color: t.mutedFg, fontFamily: t.fontMono }}>
                app.astra.dev
              </span>
            </div>
          </div>

          {/* Mock dashboard */}
          <div style={{ padding: t.sp6, minHeight: isMobile ? '200px' : '360px' }}>
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: t.sp6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: t.sp3 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: t.primary,
                    opacity: 0.15,
                  }}
                />
                <div>
                  <div
                    style={{
                      width: '100px',
                      height: '10px',
                      borderRadius: '4px',
                      backgroundColor: t.fg,
                      opacity: 0.12,
                    }}
                  />
                  <div
                    style={{
                      width: '60px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: t.fg,
                      opacity: 0.06,
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: t.sp2 }}>
                {[80, 60, 100].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${w}px`,
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: i === 2 ? t.primary : t.secondary,
                      opacity: i === 2 ? 0.2 : 1,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Stat cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: t.sp4,
                marginBottom: t.sp6,
              }}
            >
              {[
                { label: 'Active users', value: '12,849', change: '+14%' },
                { label: 'Revenue', value: '$84.2k', change: '+23%' },
                { label: 'Conversion', value: '3.24%', change: '+8%' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    padding: t.sp4,
                    borderRadius: '10px',
                    border: `1px solid ${t.border}`,
                    background: t.bg,
                  }}
                >
                  <div
                    style={{
                      fontSize: t.fsXs,
                      fontFamily: t.fontBody,
                      color: t.mutedFg,
                      marginBottom: t.sp2,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: t.sp2,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: t.fontHeading,
                        fontSize: t.fs2xl,
                        fontWeight: 700,
                        color: t.fg,
                      }}
                    >
                      <AnimatedNumber value={stat.value} duration={1400} />
                    </span>
                    <span
                      style={{
                        fontSize: t.fsXs,
                        fontWeight: 600,
                        color: '#22c55e',
                      }}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart skeleton */}
            {!isMobile && (
              <div
                style={{
                  height: '120px',
                  borderRadius: '10px',
                  border: `1px solid ${t.border}`,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  padding: `${t.sp4} ${t.sp4} ${t.sp3}`,
                  gap: '6px',
                }}
              >
                {[35, 58, 42, 72, 55, 88, 65, 78, 92, 70, 85, 95, 80, 68, 90, 75, 82, 98, 72, 88].map(
                  (h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        borderRadius: '3px',
                        backgroundColor: t.primary,
                        opacity: 0.15 + (h / 100) * 0.5,
                        transition: `height ${t.duration} ${t.easing}`,
                      }}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
        </ScaleIn>

        {/* Social proof */}
        <FadeIn delay={600} style={{ textAlign: 'center', marginTop: isMobile ? t.sp10 : '4rem' }}>
          <p
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fsSm,
              color: t.mutedFg,
              marginBottom: t.sp6,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}
          >
            Trusted by teams at
          </p>
          <Stagger
            baseDelay={700}
            staggerDelay={80}
            distance={12}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? t.sp6 : t.sp12,
              flexWrap: 'wrap',
              opacity: 0.4,
            }}
          >
            {['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma'].map(
              (name) => (
                <span
                  key={name}
                  style={{
                    fontFamily: t.fontHeading,
                    fontSize: isMobile ? t.fsLg : t.fs2xl,
                    fontWeight: 700,
                    color: t.fg,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {name}
                </span>
              ),
            )}
          </Stagger>
        </FadeIn>
      </Container>
    </section>
  );
}

/* ─── Features ─── */

const FEATURES = [
  {
    icon: IconZap,
    title: 'Lightning fast',
    description:
      'Sub-50ms response times. Real-time collaboration that feels instant. Built on a global edge network for speed everywhere.',
  },
  {
    icon: IconShield,
    title: 'Enterprise secure',
    description:
      'SOC 2 Type II certified. End-to-end encryption, SSO with SAML, and fine-grained role-based access controls.',
  },
  {
    icon: IconBarChart,
    title: 'Deep analytics',
    description:
      'Understand your team\'s velocity with built-in analytics. Custom dashboards, automated reports, and trend detection.',
  },
  {
    icon: IconLayers,
    title: 'Powerful integrations',
    description:
      'Connect with 200+ tools your team already uses. GitHub, Slack, Jira, Figma, and more. Open API for custom workflows.',
  },
];

function Features() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      id="features"
      style={{
        paddingTop: isMobile ? t.sp12 : '6rem',
        paddingBottom: isMobile ? t.sp12 : '6rem',
      }}
    >
      <Container>
        <SectionHeading
          badge="Features"
          title="Everything you need to move fast"
          subtitle="A complete toolkit for modern teams. Every feature is designed to reduce friction and keep your team in flow."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: t.sp6,
          }}
        >
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={feature.title} delay={i * 100}>
                <FeatureCard>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: t.secondary,
                      border: `1px solid ${t.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: t.primary,
                      marginBottom: t.sp4,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3
                    style={{
                      fontFamily: t.fontHeading,
                      fontSize: t.fsXl,
                      fontWeight: 700,
                      color: t.fg,
                      margin: 0,
                      letterSpacing: '-0.01em',
                      marginBottom: t.sp2,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: t.fontBody,
                      fontSize: t.fsBase,
                      lineHeight: t.lhBase,
                      color: t.mutedFg,
                      margin: 0,
                    }}
                  >
                    {feature.description}
                  </p>
                </FeatureCard>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: t.sp8,
        borderRadius: '16px',
        border: `1px solid ${t.border}`,
        backgroundColor: hovered ? t.secondary : 'transparent',
        transition: `all ${t.duration} ${t.easing}`,
        boxShadow: hovered ? t.shadow2 : 'none',
      }}
    >
      {children}
    </div>
  );
}

/* ─── Pricing ─── */

const PLANS = [
  {
    name: 'Starter',
    description: 'For small teams getting started',
    price: '$0',
    period: '/month',
    cta: 'Start for free',
    ctaVariant: 'secondary' as const,
    features: [
      'Up to 5 team members',
      '10 projects',
      '5 GB storage',
      'Basic analytics',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    description: 'For growing teams that need more',
    price: '$29',
    period: '/user/month',
    cta: 'Start free trial',
    ctaVariant: 'primary' as const,
    popular: true,
    features: [
      'Unlimited team members',
      'Unlimited projects',
      '100 GB storage',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'SSO with SAML',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For organizations at scale',
    price: 'Custom',
    period: '',
    cta: 'Contact sales',
    ctaVariant: 'secondary' as const,
    features: [
      'Everything in Pro',
      'Unlimited storage',
      'Dedicated account manager',
      'Custom SLA',
      'On-premise deployment',
      'Advanced security',
      'Audit logs',
    ],
  },
];

function PricingToggle({ isAnnual, onToggle }: { isAnnual: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.sp4,
        marginBottom: t.sp10,
      }}
    >
      <span
        style={{
          fontFamily: t.fontBody,
          fontSize: t.fsSm,
          fontWeight: isAnnual ? 400 : 600,
          color: isAnnual ? t.mutedFg : t.fg,
          transition: `color ${t.durationNormal} ${t.easing}, font-weight ${t.durationNormal} ${t.easing}`,
        }}
      >
        Monthly
      </span>
      <button
        onClick={onToggle}
        style={{
          position: 'relative',
          width: '48px',
          height: '26px',
          borderRadius: '13px',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: isAnnual ? t.primary : t.border,
          transition: `background-color ${t.durationNormal} ${t.easing}`,
          padding: 0,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: isAnnual ? '25px' : '3px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: `left ${t.durationNormal} ${t.easing}`,
          }}
        />
      </button>
      <span
        style={{
          fontFamily: t.fontBody,
          fontSize: t.fsSm,
          fontWeight: isAnnual ? 600 : 400,
          color: isAnnual ? t.fg : t.mutedFg,
          transition: `color ${t.durationNormal} ${t.easing}, font-weight ${t.durationNormal} ${t.easing}`,
          display: 'flex',
          alignItems: 'center',
          gap: t.sp2,
        }}
      >
        Annual
        {isAnnual && (
          <span
            style={{
              fontSize: t.fsXs,
              fontWeight: 600,
              color: '#22c55e',
              backgroundColor: 'rgba(34,197,94,0.12)',
              padding: `1px ${t.sp2}`,
              borderRadius: '9999px',
            }}
          >
            Save 17%
          </span>
        )}
      </span>
    </div>
  );
}

function Pricing() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isAnnual, setIsAnnual] = useState(false);

  const annualPrices: Record<string, { price: string; period: string }> = {
    Starter: { price: '$0', period: '/month' },
    Pro: { price: '$24', period: '/user/month' },
    Enterprise: { price: 'Custom', period: '' },
  };

  return (
    <section
      id="pricing"
      style={{
        paddingTop: isMobile ? t.sp12 : '6rem',
        paddingBottom: isMobile ? t.sp12 : '6rem',
        backgroundColor: t.secondary,
      }}
    >
      <Container>
        <SectionHeading
          badge="Pricing"
          title="Simple, transparent pricing"
          subtitle="Start free and scale as you grow. No hidden fees, no surprises."
        />

        <PricingToggle isAnnual={isAnnual} onToggle={() => setIsAnnual((v) => !v)} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: t.sp6,
            alignItems: 'start',
          }}
        >
          {PLANS.map((plan, i) => {
            const displayPrice = isAnnual ? annualPrices[plan.name].price : plan.price;
            const displayPeriod = isAnnual ? annualPrices[plan.name].period : plan.period;
            return (
              <FadeIn key={plan.name} delay={i * 100 + (plan.popular ? 50 : 0)} spring={!!plan.popular}>
                <PricingCard plan={{ ...plan, price: displayPrice, period: displayPeriod }} />
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function PricingCard({
  plan,
}: {
  plan: (typeof PLANS)[number];
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: t.sp8,
        borderRadius: '16px',
        border: plan.popular
          ? `2px solid ${t.primary}`
          : `1px solid ${t.border}`,
        backgroundColor: t.bg,
        boxShadow: plan.popular
          ? `${t.shadow4}, 0 0 0 1px ${t.primary}20`
          : hovered
            ? t.shadow3
            : t.shadow1,
        transition: `all ${t.duration} ${t.easing}`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative' as const,
      }}
    >
      {plan.popular && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: `${t.sp1} ${t.sp4}`,
            backgroundColor: t.primary,
            color: t.primaryFg,
            fontSize: t.fsXs,
            fontWeight: 600,
            fontFamily: t.fontBody,
            borderRadius: '9999px',
            whiteSpace: 'nowrap',
          }}
        >
          Most popular
        </div>
      )}

      <h3
        style={{
          fontFamily: t.fontHeading,
          fontSize: t.fsXl,
          fontWeight: 700,
          color: t.fg,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {plan.name}
      </h3>
      <p
        style={{
          fontFamily: t.fontBody,
          fontSize: t.fsSm,
          color: t.mutedFg,
          marginTop: t.sp1,
          marginBottom: t.sp6,
        }}
      >
        {plan.description}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: t.sp1,
          marginBottom: t.sp6,
          position: 'relative',
          overflow: 'hidden',
          minHeight: '2.8em',
        }}
      >
        <span
          key={plan.price}
          style={{
            fontFamily: t.fontHeading,
            fontSize: t.fs4xl,
            fontWeight: 800,
            color: t.fg,
            letterSpacing: '-0.03em',
            animation: `priceSlideIn ${t.durationNormal} ${t.easing}`,
          }}
        >
          {plan.price}
        </span>
        {plan.period && (
          <span
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fsSm,
              color: t.mutedFg,
            }}
          >
            {plan.period}
          </span>
        )}
      </div>

      <Button
        variant={plan.ctaVariant}
        size="md"
        style={{ width: '100%', marginBottom: t.sp6 }}
      >
        {plan.cta}
      </Button>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: t.sp3,
        }}
      >
        {plan.features.map((feature) => (
          <li
            key={feature}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: t.sp3,
              fontFamily: t.fontBody,
              fontSize: t.fsSm,
              color: t.fg,
            }}
          >
            <span style={{ color: t.primary, flexShrink: 0 }}>
              <IconCheck size={16} />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Testimonials ─── */

const TESTIMONIALS = [
  {
    quote:
      'Astra transformed how our engineering team collaborates. We shipped our last release 40% faster than the one before.',
    name: 'Sarah Chen',
    title: 'VP of Engineering, Lumina',
    avatar: 'SC',
  },
  {
    quote:
      'The analytics alone are worth it. We finally have real visibility into where time goes and how to optimize our processes.',
    name: 'Marcus Rivera',
    title: 'CTO, Nexus Labs',
    avatar: 'MR',
  },
  {
    quote:
      'We evaluated every tool on the market. Astra was the only one that didn\'t require months of setup to start seeing value.',
    name: 'Ava Johansson',
    title: 'Head of Product, Kinetic',
    avatar: 'AJ',
  },
];

function Testimonials() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      style={{
        paddingTop: isMobile ? t.sp12 : '6rem',
        paddingBottom: isMobile ? t.sp12 : '6rem',
      }}
    >
      <Container>
        <SectionHeading
          badge="Testimonials"
          title="Loved by modern teams"
          subtitle="See what engineering leaders and product teams are saying about Astra."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: t.sp6,
          }}
        >
          {TESTIMONIALS.map((testimonial, i) => (
            <FadeIn key={testimonial.name} delay={i * 100}>
              <TestimonialCard
                testimonial={testimonial}
              />
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
}) {
  return (
    <div
      style={{
        padding: t.sp8,
        borderRadius: '16px',
        border: `1px solid ${t.border}`,
        backgroundColor: t.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Stars */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          color: '#facc15',
          marginBottom: t.sp4,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <IconStar key={i} size={16} />
        ))}
      </div>

      <blockquote
        style={{
          fontFamily: t.fontBody,
          fontSize: t.fsBase,
          lineHeight: t.lhBase,
          color: t.fg,
          margin: 0,
          flex: 1,
        }}
      >
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: t.sp3,
          marginTop: t.sp6,
          paddingTop: t.sp4,
          borderTop: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${t.primary}30, ${t.accent}20)`,
            border: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: t.fontHeading,
            fontSize: t.fsXs,
            fontWeight: 700,
            color: t.primary,
            flexShrink: 0,
          }}
        >
          {testimonial.avatar}
        </div>
        <div>
          <div
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fsSm,
              fontWeight: 600,
              color: t.fg,
            }}
          >
            {testimonial.name}
          </div>
          <div
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fsXs,
              color: t.mutedFg,
            }}
          >
            {testimonial.title}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CTA Section ─── */

function CTASection() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      style={{
        paddingTop: isMobile ? t.sp12 : '6rem',
        paddingBottom: isMobile ? t.sp12 : '6rem',
      }}
    >
      <Container>
        <ScaleIn>
        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? t.sp10 : '5rem',
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${t.primary}10, ${t.accent}08)`,
            border: `1px solid ${t.border}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative grid dots */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(${t.border} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                fontFamily: t.fontHeading,
                fontSize: isMobile ? t.fs2xl : t.fs4xl,
                fontWeight: 800,
                lineHeight: t.lhTight,
                color: t.fg,
                margin: 0,
                letterSpacing: '-0.03em',
              }}
            >
              Ready to transform your workflow?
            </h2>
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: isMobile ? t.fsBase : t.fsLg,
                lineHeight: t.lhBase,
                color: t.mutedFg,
                marginTop: t.sp4,
                marginBottom: 0,
                maxWidth: '500px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Join 10,000+ teams already using Astra to ship better products, faster.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: t.sp4,
                marginTop: t.sp8,
                flexWrap: 'wrap',
              }}
            >
              <Button variant="primary" size="lg">
                Get started for free
                <IconArrowRight size={18} />
              </Button>
              <Button variant="secondary" size="lg">
                Talk to sales
              </Button>
            </div>
          </div>
        </div>
        </ScaleIn>
      </Container>
    </section>
  );
}

/* ─── Footer ─── */

const FOOTER_LINKS = {
  Product: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Resources: ['Documentation', 'API Reference', 'Community', 'Status'],
  Legal: ['Privacy', 'Terms', 'Security'],
};

function Footer() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <footer
      style={{
        borderTop: `1px solid ${t.border}`,
        paddingTop: isMobile ? t.sp10 : '4rem',
        paddingBottom: t.sp8,
      }}
    >
      <Container>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr 1fr',
            gap: isMobile ? t.sp8 : t.sp10,
            marginBottom: isMobile ? t.sp10 : '4rem',
          }}
        >
          {/* Brand column */}
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: t.sp3,
                marginBottom: t.sp4,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.primaryFg,
                }}
              >
                <IconLayers size={18} />
              </div>
              <span
                style={{
                  fontFamily: t.fontHeading,
                  fontWeight: 700,
                  fontSize: t.fsLg,
                  color: t.fg,
                  letterSpacing: '-0.02em',
                }}
              >
                Astra
              </span>
            </div>
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: t.fsSm,
                lineHeight: t.lhBase,
                color: t.mutedFg,
                margin: 0,
                maxWidth: '280px',
              }}
            >
              The modern platform for teams who ship. Unify your workflows, automate the rest.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4
                style={{
                  fontFamily: t.fontBody,
                  fontSize: t.fsXs,
                  fontWeight: 600,
                  color: t.fg,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: 0,
                  marginBottom: t.sp4,
                }}
              >
                {category}
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: t.sp3,
                }}
              >
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase()}`}
                      style={{
                        fontFamily: t.fontBody,
                        fontSize: t.fsSm,
                        color: t.mutedFg,
                        textDecoration: 'none',
                        transition: `color ${t.duration} ${t.easing}`,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = t.fg)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = t.mutedFg)
                      }
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: t.sp6,
            borderTop: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: t.sp4,
          }}
        >
          <p
            style={{
              fontFamily: t.fontBody,
              fontSize: t.fsXs,
              color: t.mutedFg,
              margin: 0,
            }}
          >
            &copy; 2026 Astra, Inc. All rights reserved.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: t.sp4,
            }}
          >
            {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
              <a
                key={social}
                href={`#${social.toLowerCase()}`}
                style={{
                  fontFamily: t.fontBody,
                  fontSize: t.fsXs,
                  color: t.mutedFg,
                  textDecoration: 'none',
                  transition: `color ${t.duration} ${t.easing}`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = t.fg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = t.mutedFg)
                }
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

/* ─── Main Export ─── */

export default function SaaSLandingDemo() {
  return (
    <div
      style={{
        fontFamily: t.fontBody,
        color: t.fg,
        backgroundColor: t.bg,
        minHeight: '100vh',
        overflowX: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style>{`
        @keyframes priceSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
