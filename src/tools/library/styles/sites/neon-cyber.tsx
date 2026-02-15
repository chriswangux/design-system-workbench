import { useState, useEffect } from 'react';

// ============================================================================
// Neon Cyber — Reference Design
// A cyberpunk security operations center called "Nexus".
// Cyan + magenta neon on pure black void. Monospace-first. Sharp edges.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens ----

const c = {
  // Surfaces
  void: '#0a0a0f',
  surface0: '#0d0d14',
  surface1: '#121220',
  surface2: '#1a1a2a',
  surface3: '#3a3a48',

  // Accents
  cyan: '#00d4e8',
  cyanBright: '#00e8ff',
  cyanDim: 'rgba(0, 212, 232, 0.10)',
  cyanGlow: 'rgba(0, 212, 232, 0.30)',
  cyanGlowStrong: 'rgba(0, 212, 232, 0.55)',
  magenta: '#e84090',
  magentaBright: '#ff50a8',
  magentaDim: 'rgba(232, 64, 144, 0.10)',
  magentaGlow: 'rgba(232, 64, 144, 0.30)',
  magentaGlowStrong: 'rgba(232, 64, 144, 0.55)',

  // Text
  textPrimary: '#f0f0f5',
  textSecondary: '#8888a0',
  textTertiary: '#55556a',
  textMuted: '#3a3a52',

  // Borders
  borderDefault: 'rgba(255, 255, 255, 0.06)',
  borderCyan: 'rgba(0, 212, 232, 0.18)',
  borderCyanHover: 'rgba(0, 212, 232, 0.50)',
  borderMagenta: 'rgba(232, 64, 144, 0.18)',

  // Semantic
  green: '#00e87a',
  greenDim: 'rgba(0, 232, 122, 0.12)',
  red: '#ff3355',
  redDim: 'rgba(255, 51, 85, 0.12)',
  amber: '#ffaa00',
  amberDim: 'rgba(255, 170, 0, 0.12)',

  // Shadows
  shadowDeep: 'rgba(0, 0, 0, 0.65)',
  shadowCyan: 'rgba(0, 212, 232, 0.12)',
  shadowMagenta: 'rgba(232, 64, 144, 0.12)',
};

// ---- Typography ----

const font = {
  mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

// ---- Easing & Timing ----

const ease = 'cubic-bezier(0.12, 0, 0, 1)';
const snap = 'cubic-bezier(0.05, 0, 0, 1)';
const baseDuration = 60;

// ---- SVG Grid Background ----

function CyberGrid() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Base void fill */}
      <div style={{ position: 'absolute', inset: 0, background: c.void }} />

      {/* SVG repeating grid pattern */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.035,
        }}
      >
        <defs>
          <pattern
            id="neon-grid"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 56 0 L 0 0 0 56"
              fill="none"
              stroke={c.cyan}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#neon-grid)" />
      </svg>

      {/* Horizontal scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 212, 232, 0.012) 2px,
            rgba(0, 212, 232, 0.012) 4px
          )`,
        }}
      />

      {/* Top-center cyan radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-25%',
          left: '15%',
          width: '70%',
          height: '55%',
          background:
            'radial-gradient(ellipse at center, rgba(0, 212, 232, 0.055) 0%, transparent 70%)',
        }}
      />

      {/* Bottom-right magenta radial glow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-5%',
          width: '45%',
          height: '45%',
          background:
            'radial-gradient(ellipse at center, rgba(232, 64, 144, 0.035) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

// ---- Top Navigation ----

function TopNav() {
  const [activeNav, setActiveNav] = useState<string | null>(null);

  const links = ['Operations', 'Threats', 'Network', 'Intel', 'Reports'];

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 40px',
        borderBottom: `1px solid ${c.borderDefault}`,
        background: `${c.surface0}dd`,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Left: Logo + Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Hexagonal logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path
              d="M13 1.5L24 7.75V18.25L13 24.5L2 18.25V7.75L13 1.5Z"
              stroke={c.cyan}
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M13 7L18 10V16L13 19L8 16V10L13 7Z"
              fill={c.cyan}
              opacity="0.25"
            />
            <circle cx="13" cy="13" r="2" fill={c.cyan} />
          </svg>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: c.cyan,
              fontFamily: font.mono,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textShadow: `0 0 18px ${c.cyanGlow}`,
            }}
          >
            Nexus
          </span>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', gap: 2 }}>
          {links.map((link) => (
            <span
              key={link}
              onMouseEnter={() => setActiveNav(link)}
              onMouseLeave={() => setActiveNav(null)}
              style={{
                fontSize: 11,
                fontWeight: 500,
                fontFamily: font.mono,
                color: activeNav === link ? c.cyan : c.textSecondary,
                cursor: 'pointer',
                padding: '5px 12px',
                borderRadius: 3,
                background:
                  activeNav === link ? c.cyanDim : 'transparent',
                transition: `color ${baseDuration}ms ${snap}, background ${baseDuration}ms ${snap}`,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {link}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Status + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Live status beacon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: c.green,
              boxShadow: `0 0 8px ${c.green}`,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: font.mono,
              color: c.green,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Systems Nominal
          </span>
        </div>

        <div
          style={{ width: 1, height: 18, background: c.borderDefault }}
        />

        {/* Operator badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '3px 10px 3px 3px',
            borderRadius: 5,
            border: `1px solid ${c.borderDefault}`,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${c.surface2}, ${c.cyan}50)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: c.textPrimary,
                fontFamily: font.mono,
              }}
            >
              OX
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontFamily: font.mono,
              color: c.textSecondary,
            }}
          >
            operator_x
          </span>
        </div>
      </div>
    </header>
  );
}

// ---- Hero Section ----

function HeroSection() {
  const [primaryHover, setPrimaryHover] = useState(false);
  const [ghostHover, setGhostHover] = useState(false);

  return (
    <section
      style={{
        position: 'relative',
        padding: '72px 40px 56px',
        maxWidth: 1600,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      {/* Decorative divider */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 40,
          right: 40,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${c.borderCyan} 25%, ${c.borderCyan} 75%, transparent)`,
        }}
      />

      {/* Eyebrow tag */}
      <div
        style={{
          fontSize: 10,
          fontFamily: font.mono,
          color: c.cyan,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 28,
            height: 1,
            background: c.cyan,
          }}
        />
        Security Operations Center
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: 54,
          fontWeight: 700,
          fontFamily: font.mono,
          color: c.textPrimary,
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          margin: '0 0 18px',
          maxWidth: 780,
        }}
      >
        <span>Defend your </span>
        <span
          style={{
            color: c.cyan,
            textShadow: `0 0 28px ${c.cyanGlow}, 0 0 56px rgba(0, 212, 232, 0.12)`,
          }}
        >
          perimeter
        </span>
        <span>.</span>
        <br />
        <span
          style={{
            color: c.textSecondary,
            fontSize: 46,
            fontWeight: 400,
          }}
        >
          Own the{' '}
        </span>
        <span
          style={{
            color: c.magenta,
            fontSize: 46,
            fontWeight: 400,
            textShadow: `0 0 28px ${c.magentaGlow}`,
          }}
        >
          breach
        </span>
        <span
          style={{
            color: c.textSecondary,
            fontSize: 46,
            fontWeight: 400,
          }}
        >
          .
        </span>
      </h1>

      {/* Body copy */}
      <p
        style={{
          fontSize: 14,
          fontFamily: font.sans,
          color: c.textSecondary,
          lineHeight: 1.65,
          margin: '0 0 32px',
          maxWidth: 500,
        }}
      >
        Real-time threat detection, automated response, and full-spectrum
        visibility across your entire attack surface. Zero trust. Zero
        compromise.
      </p>

      {/* CTA group */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onMouseEnter={() => setPrimaryHover(true)}
          onMouseLeave={() => setPrimaryHover(false)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: font.mono,
            color: c.void,
            background: primaryHover ? c.cyanBright : c.cyan,
            border: 'none',
            borderRadius: 4,
            padding: '11px 26px',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: primaryHover
              ? `0 0 20px ${c.cyanGlowStrong}, 0 0 44px ${c.cyanGlow}`
              : `0 0 14px ${c.cyanGlow}`,
            transform: primaryHover
              ? 'translateY(-1px)'
              : 'translateY(0)',
            transition: `all ${baseDuration}ms ${snap}`,
          }}
        >
          Deploy Nexus
        </button>

        <button
          onMouseEnter={() => setGhostHover(true)}
          onMouseLeave={() => setGhostHover(false)}
          style={{
            fontSize: 12,
            fontWeight: 500,
            fontFamily: font.mono,
            color: ghostHover ? c.cyan : c.textSecondary,
            background: 'transparent',
            border: `1px solid ${ghostHover ? c.borderCyanHover : c.borderDefault}`,
            borderRadius: 4,
            padding: '10px 26px',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: ghostHover
              ? `0 0 14px rgba(0, 212, 232, 0.08), inset 0 0 14px rgba(0, 212, 232, 0.04)`
              : 'none',
            transition: `all ${baseDuration}ms ${snap}`,
          }}
        >
          View Demo
        </button>
      </div>
    </section>
  );
}

// ---- Stats Bar ----

function StatsBar() {
  const stats = [
    { label: 'Threats Blocked', value: '2.4M', note: 'Last 24h' },
    { label: 'Avg Response', value: '38ms', note: 'p99 latency' },
    { label: 'Nodes Protected', value: '12,847', note: 'Active now' },
    { label: 'Uptime', value: '99.997%', note: 'Last 365d' },
  ];

  return (
    <section
      style={{
        padding: '0 40px 56px',
        maxWidth: 1600,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: c.surface1,
              border: `1px solid ${c.borderDefault}`,
              borderRadius: 5,
              padding: '18px 20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top neon accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, ${c.cyan}35, transparent)`,
              }}
            />
            <div
              style={{
                fontSize: 10,
                fontFamily: font.mono,
                color: c.textTertiary,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 7,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                fontFamily: font.mono,
                color: c.textPrimary,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: 5,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: font.mono,
                color: c.textMuted,
              }}
            >
              {stat.note}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Feature Card ----

interface FeatureCardData {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: string;
  glow?: string;
}

function FeatureCard({
  icon,
  title,
  description,
  accent = c.cyan,
  glow = c.cyanGlow,
}: FeatureCardData) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(180deg, ${c.surface2} 0%, ${c.surface1} 100%)`
          : `linear-gradient(180deg, ${c.surface1} 0%, ${c.surface0} 100%)`,
        border: `1px solid ${hovered ? accent + '40' : c.borderDefault}`,
        borderRadius: 5,
        padding: '26px 22px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered
          ? `0 0 22px ${glow}, 0 4px 18px ${c.shadowDeep}, inset 0 1px 0 rgba(255,255,255,0.03)`
          : `0 2px 6px ${c.shadowDeep}, inset 0 1px 0 rgba(255,255,255,0.02)`,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: `all 120ms ${ease}`,
      }}
    >
      {/* Top edge neon glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: hovered
            ? `linear-gradient(90deg, transparent, ${accent}70 50%, transparent)`
            : 'transparent',
          transition: `background 120ms ${ease}`,
        }}
      />

      {/* Corner glow patch */}
      <div
        style={{
          position: 'absolute',
          top: -1,
          right: -1,
          width: 36,
          height: 36,
          background: `linear-gradient(225deg, ${accent}10 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0,
          transition: `opacity 120ms ${ease}`,
        }}
      />

      {/* Icon container */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 5,
          background: hovered ? accent + '15' : c.surface2,
          border: `1px solid ${hovered ? accent + '28' : c.borderDefault}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          transition: `all 120ms ${ease}`,
          color: accent,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: font.mono,
          color: hovered ? accent : c.textPrimary,
          letterSpacing: '0.02em',
          margin: '0 0 7px',
          transition: `color 120ms ${ease}`,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 12.5,
          fontFamily: font.sans,
          color: c.textSecondary,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

// ---- Features Grid ----

function FeaturesGrid() {
  const features: FeatureCardData[] = [
    {
      icon: (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: 'Perimeter Shield',
      description:
        'AI-driven firewall that adapts in real-time to emerging attack vectors and zero-day exploits.',
    },
    {
      icon: (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: 'Realtime Response',
      description:
        'Automated incident response under 50ms. Threat isolation, evidence capture, and instant rollback.',
    },
    {
      icon: (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'Network Pulse',
      description:
        'Full packet inspection across every node. Behavioral anomaly detection at wire speed.',
      accent: c.magenta,
      glow: c.magentaGlow,
    },
    {
      icon: (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ),
      title: 'Zero Trust Engine',
      description:
        'Continuous authentication at every layer. No implicit trust, ever. Identity-first architecture.',
    },
    {
      icon: (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      ),
      title: 'Threat Intel Feed',
      description:
        'Global intelligence from 200+ sources. Predictive analysis of emerging threat campaigns.',
      accent: c.magenta,
      glow: c.magentaGlow,
    },
    {
      icon: (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      title: 'Compliance Engine',
      description:
        'SOC 2, ISO 27001, GDPR compliance mapped automatically with continuous audit trails.',
    },
  ];

  return (
    <section
      style={{
        padding: '0 40px 60px',
        maxWidth: 1600,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 10,
          fontFamily: font.mono,
          color: c.textTertiary,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            border: `1px solid ${c.textTertiary}`,
            borderRadius: 2,
          }}
        />
        Capabilities
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

// ---- Threat Monitor (Terminal) ----

interface ThreatEntry {
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  event: string;
  status: 'blocked' | 'investigating' | 'resolved';
}

const threatData: ThreatEntry[] = [
  {
    time: '00:14:32',
    severity: 'critical',
    source: '45.33.32.156',
    event: 'RCE attempt \u2014 Log4Shell variant (CVE-2021-44228)',
    status: 'blocked',
  },
  {
    time: '00:13:58',
    severity: 'high',
    source: '198.51.100.23',
    event: 'Brute-force SSH \u2014 4,200 attempts in 60s',
    status: 'blocked',
  },
  {
    time: '00:13:41',
    severity: 'medium',
    source: '203.0.113.42',
    event: 'SQL injection probe \u2014 UNION-based detection',
    status: 'blocked',
  },
  {
    time: '00:12:55',
    severity: 'high',
    source: '10.0.44.201',
    event: 'Lateral movement \u2014 anomalous SMB traffic (internal)',
    status: 'investigating',
  },
  {
    time: '00:12:18',
    severity: 'low',
    source: '172.16.0.15',
    event: 'TLS cert expiring \u2014 api.nexus.internal (3d)',
    status: 'resolved',
  },
  {
    time: '00:11:47',
    severity: 'critical',
    source: '91.134.12.89',
    event: 'C2 beacon detected \u2014 Cobalt Strike profile match',
    status: 'blocked',
  },
  {
    time: '00:11:02',
    severity: 'medium',
    source: '10.0.88.33',
    event: 'Privilege escalation \u2014 unusual sudoers modification',
    status: 'investigating',
  },
];

function getSeverityStyle(severity: ThreatEntry['severity']): {
  color: string;
  bg: string;
} {
  switch (severity) {
    case 'critical':
      return { color: c.red, bg: c.redDim };
    case 'high':
      return { color: c.magenta, bg: c.magentaDim };
    case 'medium':
      return { color: c.amber, bg: c.amberDim };
    case 'low':
      return { color: c.textTertiary, bg: 'rgba(85, 85, 106, 0.10)' };
  }
}

function getStatusStyle(status: ThreatEntry['status']): {
  color: string;
  bg: string;
} {
  switch (status) {
    case 'blocked':
      return { color: c.green, bg: c.greenDim };
    case 'investigating':
      return { color: c.amber, bg: c.amberDim };
    case 'resolved':
      return { color: c.textTertiary, bg: 'rgba(85, 85, 106, 0.10)' };
  }
}

function ThreatMonitor() {
  const [cursorTick, setCursorTick] = useState(0);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorTick((prev) => prev + 1);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const cursorOn = cursorTick % 2 === 0;

  const columns = '78px 70px 126px 1fr 98px';
  const headerLabels = ['TIME', 'LEVEL', 'SOURCE', 'EVENT', 'STATUS'];

  return (
    <section
      style={{
        padding: '0 40px 72px',
        maxWidth: 1600,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 10,
          fontFamily: font.mono,
          color: c.textTertiary,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: c.red,
            boxShadow: `0 0 6px ${c.red}`,
          }}
        />
        Live Threat Monitor
      </div>

      {/* Terminal frame */}
      <div
        style={{
          background: c.surface0,
          border: `1px solid ${c.borderDefault}`,
          borderRadius: 5,
          overflow: 'hidden',
          boxShadow: `0 4px 20px ${c.shadowDeep}, 0 0 1px ${c.shadowCyan}`,
        }}
      >
        {/* Terminal title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 16px',
            background: c.surface1,
            borderBottom: `1px solid ${c.borderDefault}`,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {/* Traffic lights */}
            <div style={{ display: 'flex', gap: 5 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: c.red,
                  opacity: 0.75,
                }}
              />
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: c.amber,
                  opacity: 0.75,
                }}
              />
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: c.green,
                  opacity: 0.75,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                fontFamily: font.mono,
                color: c.textTertiary,
                marginLeft: 6,
              }}
            >
              nexus://threat-feed &mdash; live
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: font.mono,
                color: c.textMuted,
              }}
            >
              {threatData.length} events
            </span>
            <span
              style={{
                fontSize: 9,
                fontFamily: font.mono,
                color: c.cyan,
                padding: '2px 7px',
                borderRadius: 3,
                background: c.cyanDim,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Streaming
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: columns,
            padding: '7px 16px',
            borderBottom: `1px solid ${c.borderDefault}`,
            background: c.surface0,
          }}
        >
          {headerLabels.map((h) => (
            <div
              key={h}
              style={{
                fontSize: 9,
                fontFamily: font.mono,
                color: c.textMuted,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Threat rows */}
        {threatData.map((entry, idx) => {
          const sev = getSeverityStyle(entry.severity);
          const stat = getStatusStyle(entry.status);
          const isHovered = hoveredRow === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredRow(idx)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: columns,
                padding: '8px 16px',
                borderBottom:
                  idx < threatData.length - 1
                    ? '1px solid rgba(255, 255, 255, 0.025)'
                    : 'none',
                alignItems: 'center',
                background: isHovered ? c.surface1 : 'transparent',
                transition: `background ${baseDuration}ms ${snap}`,
              }}
            >
              {/* Timestamp */}
              <span
                style={{
                  fontSize: 11,
                  fontFamily: font.mono,
                  color: c.textTertiary,
                }}
              >
                {entry.time}
              </span>

              {/* Severity badge */}
              <span
                style={{
                  fontSize: 9,
                  fontFamily: font.mono,
                  fontWeight: 600,
                  color: sev.color,
                  background: sev.bg,
                  padding: '2px 6px',
                  borderRadius: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {entry.severity}
              </span>

              {/* Source IP */}
              <span
                style={{
                  fontSize: 11,
                  fontFamily: font.mono,
                  color: c.textSecondary,
                }}
              >
                {entry.source}
              </span>

              {/* Event description */}
              <span
                style={{
                  fontSize: 11,
                  fontFamily: font.mono,
                  color: c.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingRight: 14,
                }}
              >
                {entry.event}
              </span>

              {/* Status badge */}
              <span
                style={{
                  fontSize: 9,
                  fontFamily: font.mono,
                  fontWeight: 500,
                  color: stat.color,
                  background: stat.bg,
                  padding: '2px 6px',
                  borderRadius: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {entry.status}
              </span>
            </div>
          );
        })}

        {/* Terminal prompt with blinking cursor */}
        <div
          style={{
            padding: '9px 16px',
            borderTop: `1px solid ${c.borderDefault}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: c.surface0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: font.mono,
              color: c.cyan,
            }}
          >
            nexus $
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: font.mono,
              color: c.textSecondary,
            }}
          >
            monitor --live --filter severity:high
          </span>
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 14,
              background: cursorOn ? c.cyan : 'transparent',
              marginLeft: 1,
              transition: 'background 80ms',
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ---- CTA Banner ----

function CTABanner() {
  const [ctaHover, setCtaHover] = useState(false);

  return (
    <section
      style={{
        padding: '0 40px 72px',
        maxWidth: 1600,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      <div
        style={{
          background: `linear-gradient(180deg, ${c.surface1} 0%, ${c.surface0} 100%)`,
          border: `1px solid ${c.borderCyan}`,
          borderRadius: 5,
          padding: '44px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top glow line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40%',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${c.cyan}50, transparent)`,
          }}
        />

        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '80%',
            background:
              'radial-gradient(ellipse at center, rgba(0, 212, 232, 0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            fontFamily: font.mono,
            color: c.textPrimary,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
            position: 'relative',
          }}
        >
          Ready to secure your perimeter?
        </h2>
        <p
          style={{
            fontSize: 13,
            fontFamily: font.sans,
            color: c.textTertiary,
            margin: '0 0 28px',
            lineHeight: 1.5,
            position: 'relative',
          }}
        >
          Deploy Nexus in under 5 minutes. No configuration needed.
        </p>
        <button
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: font.mono,
            color: c.void,
            background: ctaHover ? c.cyanBright : c.cyan,
            border: 'none',
            borderRadius: 4,
            padding: '11px 32px',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            position: 'relative',
            boxShadow: ctaHover
              ? `0 0 24px ${c.cyanGlowStrong}, 0 0 48px ${c.cyanGlow}`
              : `0 0 16px ${c.cyanGlow}`,
            transform: ctaHover
              ? 'translateY(-1px)'
              : 'translateY(0)',
            transition: `all ${baseDuration}ms ${snap}`,
          }}
        >
          Start Free Trial
        </button>
      </div>
    </section>
  );
}

// ---- Footer ----

function SiteFooter() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const footerLinks = ['Docs', 'API', 'Status', 'Security'];

  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '28px 40px',
        borderTop: `1px solid ${c.borderDefault}`,
        maxWidth: 1600,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Left: Logo + Links */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 24 }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: font.mono,
              color: c.cyan,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textShadow: `0 0 10px ${c.cyanGlow}`,
            }}
          >
            Nexus
          </span>
          {footerLinks.map((link) => (
            <span
              key={link}
              onMouseEnter={() => setHoveredLink(link)}
              onMouseLeave={() => setHoveredLink(null)}
              style={{
                fontSize: 11,
                fontFamily: font.mono,
                color:
                  hoveredLink === link ? c.cyan : c.textTertiary,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: `color ${baseDuration}ms ${snap}`,
              }}
            >
              {link}
            </span>
          ))}
        </div>

        {/* Right: Version + Copyright */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: font.mono,
              color: c.textMuted,
            }}
          >
            v4.2.0-rc.1
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: font.mono,
              color: c.textMuted,
            }}
          >
            {'\u00A9'} 2026 Nexus Security
          </span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function NeonCyberSite() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        fontFamily: font.sans,
        color: c.textPrimary,
        fontSize: 14,
        position: 'relative',
        overflow: 'hidden',
        background: c.void,
      }}
    >
      <CyberGrid />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <TopNav />
        <HeroSection />
        <StatsBar />
        <FeaturesGrid />
        <ThreatMonitor />
        <CTABanner />
        <SiteFooter />
      </div>
    </div>
  );
}
