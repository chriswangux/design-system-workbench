import { useState, type CSSProperties } from 'react';

// ============================================================================
// Corporate — Reference Design
// A professional enterprise B2B product landing page for "Meridian".
// Navy blue on pure grays. System fonts. Structured, reliable, trustworthy.
// Think Salesforce, Workday, ServiceNow aesthetic.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Tokens ----

const c = {
  bg: '#ffffff',
  bgAlt: '#f7f7f7',
  surface: '#ffffff',
  navy: '#1a2456',
  navyMid: '#4a6aa8',
  navyLight: '#8ab0e0',
  navyBg: 'rgba(26, 36, 86, 0.04)',
  navyBorder: 'rgba(26, 36, 86, 0.12)',
  heading: '#1a1a1a',
  body: '#4a4a4a',
  muted: '#808080',
  onNavy: '#ffffff',
  border: '#d4d4d4',
  borderSubtle: '#e8e8e8',
  shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
};

const font = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const ease = 'cubic-bezier(0.2, 0, 0, 1)';
const easeSubtle = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

function cx(extra?: CSSProperties): CSSProperties {
  return { maxWidth: 1280, margin: '0 auto', padding: '0 48px', ...extra };
}

// ---- Button ----

function Button({
  children,
  variant = 'primary',
  style: s,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: CSSProperties;
}) {
  const [h, setH] = useState(false);

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    padding: '0 28px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: font.sans,
    cursor: 'pointer',
    border: 'none',
    letterSpacing: '0.01em',
    transition: `background 100ms ${ease}, box-shadow 100ms ${ease}, transform 100ms ${ease}`,
    transform: h ? 'translateY(-1px)' : 'translateY(0)',
  };

  const v: Record<string, CSSProperties> = {
    primary: {
      background: h ? '#0f1a3d' : c.navy,
      color: c.onNavy,
      boxShadow: h ? c.shadowMd : c.shadowSm,
    },
    secondary: {
      background: h ? '#f2f2f2' : c.surface,
      color: c.heading,
      border: `1px solid ${c.border}`,
      boxShadow: h ? c.shadowMd : c.shadowSm,
    },
    ghost: {
      background: 'transparent',
      color: h ? c.navy : c.body,
      padding: '0 16px',
    },
  };

  return (
    <button
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...base, ...v[variant], ...s }}
    >
      {children}
    </button>
  );
}

// ---- Navbar ----

function Navbar() {
  const [hl, setHl] = useState<string | null>(null);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${c.borderSubtle}`,
    }}>
      <div style={{ ...cx(), display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill={c.navy} />
            <path d="M7 14L11 8L15 14L19 8M9 20L14 12L19 20" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: c.heading, fontFamily: font.sans, letterSpacing: '-0.02em' }}>
            Meridian
          </span>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Platform', 'Solutions', 'Resources', 'Pricing'].map((l) => (
            <span
              key={l}
              onMouseEnter={() => setHl(l)}
              onMouseLeave={() => setHl(null)}
              style={{
                fontSize: 14, fontWeight: 500,
                color: hl === l ? c.navy : c.body,
                fontFamily: font.sans, cursor: 'pointer',
                transition: `color 100ms ${easeSubtle}`,
              }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="ghost" style={{ height: 38, fontSize: 14 }}>Sign in</Button>
          <Button style={{ height: 38, padding: '0 20px', fontSize: 13 }}>Request Demo</Button>
        </div>
      </div>
    </nav>
  );
}

// ---- Hero ----

function HeroSection() {
  return (
    <section style={{ padding: '80px 0 72px', background: c.bg }}>
      <div style={{ ...cx(), maxWidth: 960, textAlign: 'center' }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 4,
          background: c.navyBg, border: `1px solid ${c.navyBorder}`,
          marginBottom: 28,
        }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: c.navy, fontFamily: font.sans,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            New: Q4 Platform Update
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>

        <h1 style={{
          fontSize: 52, fontWeight: 700, color: c.heading, fontFamily: font.sans,
          lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 20px',
        }}>
          The enterprise resource platform<br />built for scale
        </h1>

        <p style={{
          fontSize: 18, color: c.body, fontFamily: font.sans,
          lineHeight: 1.65, margin: '0 auto 36px', maxWidth: 620,
        }}>
          Meridian unifies your operations, finance, and workforce management
          into a single platform. Trusted by Fortune 500 companies to run their
          most critical business processes.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Button>Schedule a Demo</Button>
          <Button variant="secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch Overview
          </Button>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 64,
          marginTop: 64, paddingTop: 40, borderTop: `1px solid ${c.borderSubtle}`,
        }}>
          {[
            { value: '4,200+', label: 'Enterprise customers' },
            { value: '99.99%', label: 'Uptime SLA' },
            { value: '$2.4T', label: 'Transactions processed' },
            { value: '142', label: 'Countries served' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.navy, fontFamily: font.sans, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: c.muted, fontFamily: font.sans, marginTop: 6 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Client Logos ----

function ClientLogos() {
  return (
    <section style={{ padding: '48px 0', background: c.bgAlt }}>
      <div style={cx()}>
        <p style={{
          fontSize: 12, fontWeight: 600, color: c.muted, fontFamily: font.sans,
          textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 32,
        }}>
          Trusted by industry leaders
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
          {['Northbridge', 'Axion Corp', 'TerraVault', 'SummitWorks', 'Polaris Group', 'Evercore'].map((name) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4 }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, background: c.border }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: c.heading, fontFamily: font.sans, letterSpacing: '-0.01em' }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Feature Cards ----

function FIcon({ paths }: { paths: string[] }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.navyMid}
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

function FeatureCard({ icon, title, desc }: {
  icon: React.ReactNode; title: string; desc: string;
}) {
  const [h, setH] = useState(false);

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: c.surface,
        border: `1px solid ${h ? c.navyBorder : c.borderSubtle}`,
        borderRadius: 8, padding: '32px 28px',
        transition: `border-color 100ms ${easeSubtle}, box-shadow 100ms ${easeSubtle}`,
        boxShadow: h ? c.shadowMd : c.shadowSm,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 8,
        background: c.navyBg, border: `1px solid ${c.navyBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: c.heading, fontFamily: font.sans, marginBottom: 8, letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: c.body, fontFamily: font.sans, lineHeight: 1.6, margin: 0 }}>
        {desc}
      </p>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    { icon: <FIcon paths={['M3 3h18v18H3z', 'M3 9h18', 'M9 21V9']} />,
      title: 'Unified Operations',
      desc: 'Consolidate procurement, supply chain, and resource planning into one integrated dashboard with real-time visibility across all departments.' },
    { icon: <FIcon paths={['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']} />,
      title: 'Enterprise Security',
      desc: 'SOC 2 Type II certified with end-to-end encryption, SAML SSO, and granular role-based access controls. Your data stays your data.' },
    { icon: <FIcon paths={['M18 20V10', 'M12 20V4', 'M6 20v-6']} />,
      title: 'Advanced Analytics',
      desc: 'Purpose-built BI tools with predictive modeling, custom report builders, and automated insights delivered to stakeholders on schedule.' },
    { icon: <FIcon paths={['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75']} />,
      title: 'Workforce Management',
      desc: 'Streamline HR operations with automated onboarding, performance tracking, compensation planning, and compliance management.' },
    { icon: <FIcon paths={['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6']} />,
      title: 'Seamless Integrations',
      desc: 'Connect with 200+ enterprise applications out of the box. Pre-built connectors for SAP, Oracle, Salesforce, and major ERP systems.' },
    { icon: <FIcon paths={['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5']} />,
      title: 'Scalable Infrastructure',
      desc: 'Multi-tenant architecture with dedicated compute options. Handles millions of transactions daily with consistent sub-second response times.' },
  ];

  return (
    <section style={{ padding: '88px 0', background: c.bg }}>
      <div style={cx()}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, color: c.navyMid, fontFamily: font.sans,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
          }}>
            Platform Capabilities
          </p>
          <h2 style={{
            fontSize: 36, fontWeight: 700, color: c.heading, fontFamily: font.sans,
            letterSpacing: '-0.025em', lineHeight: 1.2, margin: '0 auto 16px', maxWidth: 520,
          }}>
            Everything your enterprise needs
          </h2>
          <p style={{
            fontSize: 16, color: c.body, fontFamily: font.sans,
            lineHeight: 1.6, margin: '0 auto', maxWidth: 540,
          }}>
            A comprehensive suite of tools designed for complex organizations.
            Built to handle the demands of global enterprise operations.
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Testimonial ----

function TestimonialSection() {
  return (
    <section style={{ padding: '80px 0', background: c.bgAlt }}>
      <div style={{ ...cx(), maxWidth: 880, textAlign: 'center' }}>
        {/* Opening quote */}
        <div style={{
          fontSize: 56, color: c.navyBorder,
          fontFamily: 'Georgia, "Times New Roman", serif',
          lineHeight: 1, marginBottom: 4, userSelect: 'none',
        }}>
          &ldquo;
        </div>

        <blockquote style={{
          fontSize: 22, color: c.heading, fontFamily: font.sans,
          lineHeight: 1.6, fontWeight: 400, margin: '0 auto 36px',
          maxWidth: 720, letterSpacing: '-0.01em',
        }}>
          Meridian replaced four separate systems we were running across finance,
          HR, and operations. The implementation was remarkably smooth, and we
          saw measurable ROI within the first quarter. It&apos;s become the
          backbone of how we run the company.
        </blockquote>

        {/* Attribution */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: c.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: c.onNavy, fontFamily: font.sans }}>JH</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: c.heading, fontFamily: font.sans }}>
              James Hartwell
            </div>
            <div style={{ fontSize: 13, color: c.muted, fontFamily: font.sans }}>
              Chief Operating Officer, Northbridge Industries
            </div>
          </div>
        </div>

        {/* Analyst badges */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32,
          marginTop: 48, paddingTop: 40, borderTop: `1px solid ${c.borderSubtle}`,
        }}>
          {[
            { label: 'G2', rating: '4.8/5' },
            { label: 'Gartner', rating: 'Leader 2025' },
            { label: 'Forrester', rating: 'Strong Performer' },
          ].map((b) => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 6,
              background: c.surface, border: `1px solid ${c.borderSubtle}`,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                background: c.navyBg, border: `1px solid ${c.navyBorder}`,
              }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: c.muted, fontFamily: font.sans,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {b.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.heading, fontFamily: font.sans }}>
                  {b.rating}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- CTA Banner ----

function CTASection() {
  return (
    <section style={{ padding: '80px 0', background: c.bg }}>
      <div style={{
        ...cx(), maxWidth: 960, background: c.navy, borderRadius: 12,
        padding: '64px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />

        <h2 style={{
          fontSize: 32, fontWeight: 700, color: c.onNavy, fontFamily: font.sans,
          letterSpacing: '-0.025em', marginBottom: 12, position: 'relative',
        }}>
          Ready to transform your operations?
        </h2>
        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.65)', fontFamily: font.sans,
          lineHeight: 1.6, position: 'relative', maxWidth: 480, margin: '0 auto 36px',
        }}>
          Join 4,200+ enterprises that run on Meridian. Get a personalized demo
          from our solutions team.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, position: 'relative' }}>
          <Button style={{ background: c.onNavy, color: c.navy, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Request a Demo
          </Button>
          <Button variant="secondary" style={{ background: 'transparent', color: c.onNavy, border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'none' }}>
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---- Footer ----

function Footer() {
  const lk: CSSProperties = { fontSize: 13, color: c.body, fontFamily: font.sans, cursor: 'pointer', lineHeight: 2.1 };
  const hd: CSSProperties = { fontSize: 12, fontWeight: 600, color: c.heading, fontFamily: font.sans, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' };

  const cols = [
    { heading: 'Platform', links: ['Operations', 'Finance', 'HR & People', 'Analytics', 'Integrations'] },
    { heading: 'Solutions', links: ['Enterprise', 'Mid-Market', 'By Industry', 'Partners'] },
    { heading: 'Resources', links: ['Documentation', 'API Reference', 'Case Studies', 'Webinars', 'Blog'] },
    { heading: 'Company', links: ['About', 'Careers', 'Press', 'Trust Center', 'Contact'] },
  ];

  return (
    <footer style={{ padding: '56px 0 40px', background: c.bgAlt, borderTop: `1px solid ${c.borderSubtle}` }}>
      <div style={cx()}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(4, 1fr)', gap: 48, marginBottom: 48 }}>
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill={c.navy} />
                <path d="M7 14L11 8L15 14L19 8M9 20L14 12L19 20" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 700, color: c.heading, fontFamily: font.sans }}>Meridian</span>
            </div>
            <p style={{ fontSize: 13, color: c.body, fontFamily: font.sans, lineHeight: 1.6, maxWidth: 260, marginBottom: 20 }}>
              Enterprise resource platform for organizations that demand reliability, security, and scale.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['SOC 2', 'ISO 27001', 'GDPR'].map((b) => (
                <span key={b} style={{
                  fontSize: 10, fontWeight: 600, fontFamily: font.mono, color: c.muted,
                  padding: '3px 8px', borderRadius: 4, border: `1px solid ${c.borderSubtle}`,
                  background: c.surface, letterSpacing: '0.02em',
                }}>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <div style={hd}>{col.heading}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {col.links.map((l) => <span key={l} style={lk}>{l}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: `1px solid ${c.borderSubtle}` }}>
          <span style={{ fontSize: 12, color: c.muted, fontFamily: font.sans }}>
            &copy; 2025 Meridian, Inc. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map((l) => (
              <span key={l} style={{ fontSize: 12, color: c.muted, fontFamily: font.sans, cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---- Main Layout ----

export default function CorporateSite() {
  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: c.bg, color: c.body,
      fontFamily: font.sans, fontSize: 16, lineHeight: 1.5,
      WebkitFontSmoothing: 'antialiased', overflowX: 'hidden',
    }}>
      <Navbar />
      <HeroSection />
      <ClientLogos />
      <FeaturesSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </div>
  );
}
