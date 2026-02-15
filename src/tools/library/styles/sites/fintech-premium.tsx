import { useState, type CSSProperties } from 'react';

// ============================================================================
// Fintech Premium — Reference Design
// A premium, editorial-quality fintech dashboard.
// All styles hardcoded to represent the Fintech Premium aesthetic.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens (literal values) ----

const c = {
  // Surfaces (dark mode, blue-tinted)
  bg: '#0b0c10',
  surface0: '#0e0f14',
  surface1: '#13141a',
  surface2: '#1a1b22',
  surface3: '#22232c',
  surfaceHover: '#1e1f28',

  // Borders
  border: 'rgba(255, 255, 255, 0.06)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderAccent: 'rgba(139, 138, 186, 0.25)',

  // Text
  text: '#eeeef2',
  textSecondary: '#8e8ea0',
  textTertiary: '#5a5a6e',
  textMuted: '#44445a',

  // Accent (muted blue-violet)
  accent: '#8b8aba',
  accentDim: 'rgba(139, 138, 186, 0.15)',
  accentGlow: 'rgba(139, 138, 186, 0.08)',

  // Semantic
  positive: '#3dd68c',
  positiveDim: 'rgba(61, 214, 140, 0.12)',
  negative: '#ef4444',
  negativeDim: 'rgba(239, 68, 68, 0.12)',
  warning: '#f59e0b',

  // Shadows
  shadowAmbient: 'rgba(0, 8, 32, 0.24)',
  shadowDirectional: 'rgba(0, 4, 20, 0.40)',
};

// ---- Typography ----

const font = {
  sans: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
};

// ---- Easing ----

const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ---- Noise Texture (inline SVG filter) ----

function NoiseOverlay() {
  return (
    <svg style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, opacity: 0.035 }}>
      <filter id="fintech-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#fintech-noise)" />
    </svg>
  );
}

// ---- Radial Glow ----

function RadialGlow() {
  return (
    <div
      style={{
        position: 'fixed',
        top: '-20%',
        left: '30%',
        width: '40%',
        height: '50%',
        background: 'radial-gradient(ellipse at center, rgba(139, 138, 186, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ---- Card Component ----

function Card({ children, style, hoverable = true }: { children: React.ReactNode; style?: CSSProperties; hoverable?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={hoverable ? () => setHovered(true) : undefined}
      onMouseLeave={hoverable ? () => setHovered(false) : undefined}
      style={{
        background: `linear-gradient(180deg, ${c.surface2} 0%, ${c.surface1} 100%)`,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 16px ${c.shadowAmbient}, 0 8px 32px ${c.shadowDirectional}`
          : `0 1px 0 0 rgba(255,255,255,0.04) inset, 0 2px 8px ${c.shadowAmbient}, 0 4px 16px ${c.shadowDirectional}`,
        transition: `transform 400ms ${ease}, box-shadow 400ms ${ease}`,
        ...style,
      }}
    >
      {/* Top shine edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)',
        }}
      />
      {children}
    </div>
  );
}

// ---- Stat Card ----

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

function StatCard({ label, value, change, positive: isPositive }: StatCardProps) {
  return (
    <Card>
      <div style={{ fontSize: 12, fontFamily: font.sans, color: c.textTertiary, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontFamily: font.mono, color: c.text, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          fontFamily: font.mono,
          color: isPositive ? c.positive : c.negative,
          background: isPositive ? c.positiveDim : c.negativeDim,
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 8px',
          borderRadius: 6,
          gap: 4,
        }}
      >
        {isPositive ? '\u2191' : '\u2193'} {change}
      </div>
    </Card>
  );
}

// ---- Mini Chart (SVG bar chart) ----

function MiniChart() {
  const data = [35, 52, 48, 65, 45, 72, 58, 80, 68, 90, 75, 85];
  const max = Math.max(...data);
  const barWidth = 24;
  const gap = 8;
  const chartHeight = 120;
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <Card style={{ padding: '24px 24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontFamily: font.sans, color: c.text, fontWeight: 500 }}>Revenue Overview</div>
          <div style={{ fontSize: 12, fontFamily: font.sans, color: c.textTertiary, marginTop: 4 }}>Last 12 months</div>
        </div>
        <div style={{ fontSize: 12, fontFamily: font.sans, color: c.textTertiary, display: 'flex', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c.accent, display: 'inline-block' }} />
            Revenue
          </span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${totalWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
        {data.map((d, i) => {
          const height = (d / max) * chartHeight;
          const x = i * (barWidth + gap);
          const y = chartHeight - height;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx={4}
              fill={i === data.length - 1 ? c.accent : c.surface3}
              style={{ transition: `height 500ms ${ease}, y 500ms ${ease}` }}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
          <div key={m} style={{ fontSize: 10, fontFamily: font.sans, color: c.textMuted, width: barWidth, textAlign: 'center' }}>{m}</div>
        ))}
      </div>
    </Card>
  );
}

// ---- Transaction Table ----

interface Transaction {
  date: string;
  description: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
}

const transactions: Transaction[] = [
  { date: '2025-02-14', description: 'Stripe Payment — Invoice #4182', amount: '+$12,840.00', status: 'completed' },
  { date: '2025-02-14', description: 'AWS Infrastructure', amount: '-$3,214.50', status: 'completed' },
  { date: '2025-02-13', description: 'Client Deposit — Acme Corp', amount: '+$45,000.00', status: 'pending' },
  { date: '2025-02-13', description: 'Payroll Processing', amount: '-$28,500.00', status: 'completed' },
  { date: '2025-02-12', description: 'SaaS Subscription Revenue', amount: '+$8,920.00', status: 'completed' },
  { date: '2025-02-12', description: 'Marketing — Google Ads', amount: '-$2,100.00', status: 'failed' },
  { date: '2025-02-11', description: 'Wire Transfer — Series B', amount: '+$250,000.00', status: 'completed' },
];

function statusColor(status: Transaction['status']): CSSProperties {
  switch (status) {
    case 'completed':
      return { color: c.positive, background: c.positiveDim };
    case 'pending':
      return { color: c.warning, background: 'rgba(245, 158, 11, 0.12)' };
    case 'failed':
      return { color: c.negative, background: c.negativeDim };
  }
}

function TransactionTable() {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }} hoverable={false}>
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontFamily: font.sans, color: c.text, fontWeight: 500 }}>Recent Transactions</div>
            <div style={{ fontSize: 12, fontFamily: font.sans, color: c.textTertiary, marginTop: 4 }}>Last 7 days</div>
          </div>
          <button
            style={{
              fontSize: 12,
              fontFamily: font.sans,
              color: c.accent,
              background: c.accentDim,
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            View all
          </button>
        </div>
      </div>
      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 140px 100px',
          padding: '10px 24px',
          borderBottom: `1px solid ${c.borderSubtle}`,
          background: c.surface0,
        }}
      >
        {['Date', 'Description', 'Amount', 'Status'].map((h) => (
          <div key={h} style={{ fontSize: 11, fontFamily: font.sans, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {h}
          </div>
        ))}
      </div>
      {/* Table rows */}
      {transactions.map((tx, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 140px 100px',
            padding: '12px 24px',
            borderBottom: i < transactions.length - 1 ? `1px solid ${c.borderSubtle}` : 'none',
            alignItems: 'center',
            transition: `background 200ms ${ease}`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = c.surfaceHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div style={{ fontSize: 13, fontFamily: font.mono, color: c.textTertiary }}>{tx.date.slice(5)}</div>
          <div style={{ fontSize: 13, fontFamily: font.sans, color: c.text }}>{tx.description}</div>
          <div
            style={{
              fontSize: 13,
              fontFamily: font.mono,
              color: tx.amount.startsWith('+') ? c.positive : c.text,
              fontWeight: 500,
            }}
          >
            {tx.amount}
          </div>
          <div>
            <span
              style={{
                fontSize: 11,
                fontFamily: font.sans,
                padding: '3px 8px',
                borderRadius: 6,
                textTransform: 'capitalize',
                ...statusColor(tx.status),
              }}
            >
              {tx.status}
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ---- Sidebar ----

const navItems = [
  { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
  { label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', active: false },
  { label: 'Transactions', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', active: false },
  { label: 'Cards', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', active: false },
  { label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', active: false },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}

function Sidebar() {
  return (
    <div
      style={{
        width: 220,
        minWidth: 220,
        height: '100%',
        background: c.surface0,
        borderRight: `1px solid ${c.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 32 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${c.accent}, ${c.surface3})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: c.text, fontFamily: font.sans }}>F</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: c.text, fontFamily: font.sans, letterSpacing: '-0.01em' }}>Fintech</span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: font.sans,
              fontWeight: item.active ? 500 : 400,
              color: item.active ? c.text : c.textSecondary,
              background: item.active ? c.accentDim : 'transparent',
              cursor: 'pointer',
              transition: `background 200ms ${ease}, color 200ms ${ease}`,
            }}
          >
            <NavIcon d={item.icon} />
            {item.label}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ marginTop: 'auto', padding: '16px 10px', borderTop: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${c.surface3}, ${c.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: c.text, fontFamily: font.sans }}>JD</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontFamily: font.sans, color: c.text, fontWeight: 500 }}>John Doe</div>
            <div style={{ fontSize: 11, fontFamily: font.sans, color: c.textTertiary }}>Premium</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Search Input ----

function SearchInput() {
  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c.textTertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Search transactions..."
        style={{
          width: 260,
          height: 36,
          background: c.surface1,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          padding: '0 12px 0 36px',
          fontSize: 13,
          fontFamily: font.sans,
          color: c.text,
          outline: 'none',
          boxShadow: `inset 0 1px 3px rgba(0, 0, 0, 0.2)`,
          transition: `border-color 200ms ${ease}, box-shadow 200ms ${ease}`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = c.accent;
          e.currentTarget.style.boxShadow = `inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 3px ${c.accentGlow}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = c.border;
          e.currentTarget.style.boxShadow = `inset 0 1px 3px rgba(0, 0, 0, 0.2)`;
        }}
      />
    </div>
  );
}

// ---- Main Layout ----

export default function FintechPremiumSite() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: c.bg,
        color: c.text,
        fontFamily: font.sans,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <NoiseOverlay />
      <RadialGlow />

      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 32px',
            borderBottom: `1px solid ${c.border}`,
            background: `${c.surface0}cc`,
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: c.text, letterSpacing: '-0.01em' }}>Dashboard</div>
            <div style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>Feb 14, 2025</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SearchInput />
            {/* Notification bell */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: c.surface1,
                border: `1px solid ${c.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: c.accent,
                }}
              />
            </div>
            {/* User avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${c.surface3}, ${c.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: `1px solid ${c.border}`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>JD</span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main style={{ flex: 1, padding: 32, maxWidth: 1440, width: '100%' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Balance" value="$284,520" change="12.5%" positive />
            <StatCard label="Revenue" value="$45,280" change="8.2%" positive />
            <StatCard label="Expenses" value="$18,640" change="3.1%" positive={false} />
            <StatCard label="Growth" value="+24.8%" change="2.4%" positive />
          </div>

          {/* Chart + Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <MiniChart />
            <TransactionTable />
          </div>
        </main>
      </div>
    </div>
  );
}
