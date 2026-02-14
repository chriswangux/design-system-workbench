/**
 * Dashboard Demo
 * Exercises: semantic colors, dense typography, compact spacing, data viz, tables
 * All visual properties use CSS custom properties from the token bridge.
 */
import { useState } from 'react';
import { m, FadeIn, SlideIn, AnimatedNumber, useInView } from '../shared/motion';

// ---- Data ----

const navItems = [
  { label: 'Dashboard', icon: 'grid', active: true },
  { label: 'Analytics', icon: 'chart', active: false },
  { label: 'Users', icon: 'users', active: false },
  { label: 'Products', icon: 'box', active: false },
  { label: 'Orders', icon: 'receipt', active: false },
  { label: 'Settings', icon: 'gear', active: false },
];

const stats = [
  { label: 'Total Users', value: '24,521', change: '+12.5%', up: true },
  { label: 'Revenue', value: '$84,254', change: '+8.2%', up: true },
  { label: 'Growth', value: '18.4%', change: '-2.1%', up: false },
  { label: 'Active Sessions', value: '1,429', change: '+24.8%', up: true },
];

const orders = [
  { id: 'ORD-7291', customer: 'Alice Chen', email: 'alice@example.com', amount: '$1,240.00', status: 'Completed', date: 'Feb 14, 2026' },
  { id: 'ORD-7290', customer: 'Bob Martinez', email: 'bob@example.com', amount: '$890.00', status: 'Processing', date: 'Feb 14, 2026' },
  { id: 'ORD-7289', customer: 'Carol Nguyen', email: 'carol@example.com', amount: '$2,150.00', status: 'Completed', date: 'Feb 13, 2026' },
  { id: 'ORD-7288', customer: 'David Kim', email: 'david@example.com', amount: '$430.00', status: 'Shipped', date: 'Feb 13, 2026' },
  { id: 'ORD-7287', customer: 'Eva Johansson', email: 'eva@example.com', amount: '$1,890.00', status: 'Completed', date: 'Feb 12, 2026' },
  { id: 'ORD-7286', customer: 'Frank Osei', email: 'frank@example.com', amount: '$670.00', status: 'Processing', date: 'Feb 12, 2026' },
  { id: 'ORD-7285', customer: 'Grace Li', email: 'grace@example.com', amount: '$3,210.00', status: 'Completed', date: 'Feb 11, 2026' },
  { id: 'ORD-7284', customer: 'Hiro Tanaka', email: 'hiro@example.com', amount: '$540.00', status: 'Refunded', date: 'Feb 11, 2026' },
];

const chartData = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 68 },
  { label: 'Wed', value: 55 },
  { label: 'Thu', value: 80 },
  { label: 'Fri', value: 73 },
  { label: 'Sat', value: 90 },
  { label: 'Sun', value: 62 },
];

const activities = [
  { user: 'Alice Chen', action: 'placed order', detail: 'ORD-7291 for $1,240.00', time: '2 min ago' },
  { user: 'Bob Martinez', action: 'updated profile', detail: 'Changed billing address', time: '15 min ago' },
  { user: 'Carol Nguyen', action: 'completed payment', detail: '$2,150.00 via Stripe', time: '1 hr ago' },
  { user: 'David Kim', action: 'submitted review', detail: '5 stars on Widget Pro', time: '3 hr ago' },
  { user: 'Eva Johansson', action: 'signed up', detail: 'Enterprise plan trial', time: '5 hr ago' },
];

// ---- Icon Components (inline SVG) ----

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" />
      <line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconTrendUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconTrendDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function IconCircle({ letter }: { letter: string }) {
  return (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      backgroundColor: 'var(--sem-primary, #3b82f6)',
      color: 'var(--sem-primary-foreground, #fafafa)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
      fontWeight: 600,
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

const iconMap: Record<string, () => React.JSX.Element> = {
  grid: IconGrid,
  chart: IconChart,
  users: IconUsers,
  box: IconBox,
  receipt: IconReceipt,
  gear: IconGear,
};

// ---- Sub-Components ----

function Sidebar({ activeNav, onNavClick }: { activeNav: string; onNavClick: (label: string) => void }) {
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      backgroundColor: 'var(--color-neutral-900, #171717)',
      color: 'var(--color-neutral-50, #fafafa)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
    }}>
      {/* Logo */}
      <div style={{
        padding: 'var(--spacing-600, 1.5rem) var(--spacing-600, 1.5rem)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-300, 0.75rem)',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'var(--sem-primary, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sem-primary-foreground, #fff)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
              fontWeight: 700,
              fontSize: 'var(--typography-fontSize-base, 1rem)',
              lineHeight: 1.2,
            }}>
              Acme Inc
            </div>
            <div style={{
              fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
              opacity: 0.5,
              lineHeight: 1.3,
            }}>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{
        padding: 'var(--spacing-400, 1rem) var(--spacing-300, 0.75rem)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-100, 0.25rem)',
      }}>
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onNavClick(item.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-300, 0.75rem)',
                padding: 'var(--spacing-200, 0.5rem) var(--spacing-300, 0.75rem)',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--sem-primary-foreground, #fff)' : 'rgba(255,255,255,0.6)',
                backgroundColor: isActive ? 'var(--sem-primary, #3b82f6)' : 'transparent',
                transition: `all ${m.durationFast} ${m.easingStandard}`,
                textAlign: 'left',
              }}
            >
              {Icon && <Icon />}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{
        padding: 'var(--spacing-400, 1rem) var(--spacing-600, 1.5rem)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-300, 0.75rem)',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--sem-primary, #3b82f6), var(--sem-accent, #3b82f6))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
          fontWeight: 700,
          color: 'var(--sem-primary-foreground, #fff)',
          flexShrink: 0,
        }}>
          JD
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
            fontWeight: 600,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}>
            Jane Doe
          </div>
          <div style={{
            fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
            opacity: 0.5,
            lineHeight: 1.3,
          }}>
            jane@acme.com
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--spacing-600, 1.5rem)',
      backgroundColor: 'var(--sem-background, #fafafa)',
      flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-200, 0.5rem)',
        backgroundColor: 'var(--sem-secondary, rgba(115,115,115,0.12))',
        borderRadius: 8,
        padding: 'var(--spacing-200, 0.5rem) var(--spacing-400, 1rem)',
        width: 320,
        color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
      }}>
        <IconSearch />
        <input
          type="text"
          placeholder="Search orders, users, products..."
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
            fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
            color: 'var(--sem-foreground, #171717)',
            width: '100%',
          }}
        />
        <kbd style={{
          fontSize: '0.65rem',
          padding: '2px 6px',
          borderRadius: 4,
          border: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
          color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
          fontFamily: 'var(--sem-font-mono, monospace)',
          whiteSpace: 'nowrap',
        }}>
          /
        </kbd>
      </div>

      {/* Right side */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-400, 1rem)',
      }}>
        {/* Notification bell */}
        <button style={{
          position: 'relative',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 'var(--spacing-200, 0.5rem)',
          borderRadius: 8,
          color: 'var(--sem-foreground, #171717)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <IconBell />
          <span style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: '2px solid var(--sem-background, #fafafa)',
          }} />
        </button>

        {/* Divider */}
        <div style={{
          width: 1,
          height: 24,
          backgroundColor: 'var(--sem-border, rgba(115,115,115,0.25))',
        }} />

        {/* User avatar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-300, 0.75rem)',
          cursor: 'pointer',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--sem-primary, #3b82f6), var(--sem-accent, #3b82f6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
            fontWeight: 700,
            color: 'var(--sem-primary-foreground, #fff)',
          }}>
            JD
          </div>
          <div>
            <div style={{
              fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
              fontWeight: 600,
              color: 'var(--sem-foreground, #171717)',
              lineHeight: 1.2,
            }}>
              Jane Doe
            </div>
            <div style={{
              fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
              color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
              lineHeight: 1.2,
            }}>
              Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: 'var(--sem-background, #fafafa)',
        border: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
        borderRadius: 10,
        padding: 'var(--spacing-600, 1.5rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-200, 0.5rem)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.10)' : 'none',
        transition: `transform ${m.durationFast} ${m.easingStandard}, box-shadow ${m.durationFast} ${m.easingStandard}`,
        cursor: 'default',
      }}
    >
      <div style={{
        fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
        fontWeight: 500,
        color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--typography-fontSize-lg, 1.25rem)',
        fontWeight: 700,
        fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
        color: 'var(--sem-foreground, #171717)',
        lineHeight: 1.2,
      }}>
        <AnimatedNumber value={value} duration={1400} />
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-100, 0.25rem)',
        fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
        fontWeight: 600,
        color: up ? '#22c55e' : '#ef4444',
      }}>
        {up ? <IconTrendUp /> : <IconTrendDown />}
        <span>{change}</span>
        <span style={{
          color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
          fontWeight: 400,
          marginLeft: 'var(--spacing-100, 0.25rem)',
        }}>
          vs last month
        </span>
      </div>
    </div>
  );
}

function StatsRow() {
  return (
    <div style={{
      display: 'flex',
      gap: 'var(--spacing-400, 1rem)',
    }}>
      {stats.map((s, i) => (
        <FadeIn key={s.label} delay={i * 80} distance={12} style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <StatCard {...s} />
        </FadeIn>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Completed: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
    Processing: { bg: 'rgba(59,130,246,0.12)', text: 'var(--sem-primary, #3b82f6)' },
    Shipped: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7' },
    Refunded: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
  };
  const c = colors[status] || { bg: 'var(--sem-secondary, rgba(115,115,115,0.12))', text: 'var(--sem-foreground, #171717)' };

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text,
      lineHeight: 1.6,
    }}>
      {status}
    </span>
  );
}

function DataTable() {
  const [tableRef, tableInView] = useInView({ threshold: 0.1 });

  return (
    <div ref={tableRef} style={{
      backgroundColor: 'var(--sem-background, #fafafa)',
      border: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Table header bar */}
      <div style={{
        padding: 'var(--spacing-400, 1rem) var(--spacing-600, 1.5rem)',
        borderBottom: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
            color: 'var(--sem-foreground, #171717)',
          }}>
            Recent Orders
          </div>
          <div style={{
            fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
            color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
            marginTop: 2,
          }}>
            Overview of your latest transactions
          </div>
        </div>
        <button style={{
          border: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
          backgroundColor: 'transparent',
          borderRadius: 6,
          padding: 'var(--spacing-200, 0.5rem) var(--spacing-400, 1rem)',
          fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
          fontWeight: 600,
          fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
          color: 'var(--sem-foreground, #171717)',
          cursor: 'pointer',
        }}>
          View All
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
          fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
            }}>
              {['Order', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                <th key={h} style={{
                  textAlign: 'left',
                  padding: 'var(--spacing-300, 0.75rem) var(--spacing-600, 1.5rem)',
                  fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
                  fontWeight: 600,
                  color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr
                key={order.id}
                style={{
                  borderBottom: i < orders.length - 1 ? '1px solid var(--sem-border, rgba(115,115,115,0.25))' : 'none',
                  opacity: tableInView ? 1 : 0,
                  transform: tableInView ? 'translateY(0)' : 'translateY(8px)',
                  transition: `opacity ${m.durationNormal} ${m.easingStandard} ${i * 50}ms, transform ${m.durationNormal} ${m.easingStandard} ${i * 50}ms, background-color ${m.durationFast} ${m.easingStandard}, border-left ${m.durationFast} ${m.easingStandard}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sem-secondary, rgba(115,115,115,0.06))';
                  e.currentTarget.style.borderLeft = '4px solid var(--sem-primary, #3b82f6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderLeft = '4px solid transparent';
                }}
              >
                <td style={{
                  padding: 'var(--spacing-300, 0.75rem) var(--spacing-600, 1.5rem)',
                  fontFamily: 'var(--sem-font-mono, JetBrains Mono, monospace)',
                  fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
                  fontWeight: 500,
                  color: 'var(--sem-foreground, #171717)',
                }}>
                  {order.id}
                </td>
                <td style={{ padding: 'var(--spacing-300, 0.75rem) var(--spacing-600, 1.5rem)' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-300, 0.75rem)',
                  }}>
                    <IconCircle letter={order.customer[0]} />
                    <div>
                      <div style={{
                        fontWeight: 600,
                        color: 'var(--sem-foreground, #171717)',
                        fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                        lineHeight: 1.3,
                      }}>
                        {order.customer}
                      </div>
                      <div style={{
                        fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
                        color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
                        lineHeight: 1.3,
                      }}>
                        {order.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{
                  padding: 'var(--spacing-300, 0.75rem) var(--spacing-600, 1.5rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--sem-font-mono, JetBrains Mono, monospace)',
                  fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                  color: 'var(--sem-foreground, #171717)',
                }}>
                  {order.amount}
                </td>
                <td style={{ padding: 'var(--spacing-300, 0.75rem) var(--spacing-600, 1.5rem)' }}>
                  <StatusBadge status={order.status} />
                </td>
                <td style={{
                  padding: 'var(--spacing-300, 0.75rem) var(--spacing-600, 1.5rem)',
                  color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
                  whiteSpace: 'nowrap',
                  fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                }}>
                  {order.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BarChart() {
  const maxVal = Math.max(...chartData.map((d) => d.value));
  const chartHeight = 180;
  const barWidth = 36;
  const gap = 16;
  const [chartRef, chartInView] = useInView({ threshold: 0.2 });

  return (
    <div ref={chartRef} style={{
      backgroundColor: 'var(--sem-background, #fafafa)',
      border: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
      borderRadius: 10,
      padding: 'var(--spacing-600, 1.5rem)',
      flex: 1.5,
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-600, 1.5rem)',
      }}>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
            color: 'var(--sem-foreground, #171717)',
          }}>
            Weekly Revenue
          </div>
          <div style={{
            fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
            color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
            marginTop: 2,
          }}>
            Revenue by day of the week
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
          fontWeight: 700,
          fontSize: 'var(--typography-fontSize-lg, 1.25rem)',
          color: 'var(--sem-foreground, #171717)',
        }}>
          $12,482
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${chartData.length * (barWidth + gap) + gap} ${chartHeight + 30}`}
        style={{ display: 'block' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={chartHeight * (1 - pct)}
            x2={chartData.length * (barWidth + gap) + gap}
            y2={chartHeight * (1 - pct)}
            stroke="var(--sem-border, rgba(115,115,115,0.25))"
            strokeWidth={1}
            strokeDasharray={pct === 0 ? 'none' : '4,4'}
          />
        ))}

        {/* Bars */}
        {chartData.map((d, i) => {
          const barH = (d.value / maxVal) * (chartHeight - 10);
          const animatedH = chartInView ? barH : 0;
          const x = gap + i * (barWidth + gap);
          const y = chartHeight - animatedH;
          const staggerDelay = i * 60;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={animatedH}
                rx={4}
                fill="var(--sem-primary, #3b82f6)"
                opacity={0.85}
                style={{
                  transition: `y ${m.durationSlow} ${m.easingStandard} ${staggerDelay}ms, height ${m.durationSlow} ${m.easingStandard} ${staggerDelay}ms`,
                }}
              />
              {/* Highlight bar on top */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={chartInView ? Math.min(barH, 4) : 0}
                rx={4}
                fill="var(--sem-primary, #3b82f6)"
                style={{
                  transition: `y ${m.durationSlow} ${m.easingStandard} ${staggerDelay}ms, height ${m.durationSlow} ${m.easingStandard} ${staggerDelay}ms`,
                }}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 18}
                textAnchor="middle"
                fill="var(--sem-muted-foreground, rgba(23,23,23,0.5))"
                fontSize="11"
                fontFamily="var(--sem-font-body, Inter, system-ui, sans-serif)"
                style={{
                  opacity: chartInView ? 1 : 0,
                  transition: `opacity ${m.durationNormal} ${m.easingStandard} ${staggerDelay + 150}ms`,
                }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div style={{
      backgroundColor: 'var(--sem-background, #fafafa)',
      border: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
      borderRadius: 10,
      flex: 1,
      minWidth: 280,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--spacing-600, 1.5rem)',
        borderBottom: '1px solid var(--sem-border, rgba(115,115,115,0.25))',
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
          color: 'var(--sem-foreground, #171717)',
        }}>
          Recent Activity
        </div>
        <div style={{
          fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
          color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
          marginTop: 2,
        }}>
          Latest actions across the platform
        </div>
      </div>

      {/* Items */}
      <div style={{ flex: 1 }}>
        {activities.map((a, i) => (
          <SlideIn key={i} from="right" delay={i * 70 + 100} distance={16}>
            <div
              style={{
                padding: 'var(--spacing-400, 1rem) var(--spacing-600, 1.5rem)',
                borderBottom: i < activities.length - 1 ? '1px solid var(--sem-border, rgba(115,115,115,0.25))' : 'none',
                display: 'flex',
                gap: 'var(--spacing-300, 0.75rem)',
                alignItems: 'flex-start',
              }}
            >
              <IconCircle letter={a.user[0]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                  color: 'var(--sem-foreground, #171717)',
                  lineHeight: 1.5,
                }}>
                  <span style={{ fontWeight: 600 }}>{a.user}</span>
                  {' '}{a.action}
                </div>
                <div style={{
                  fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
                  color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
                  lineHeight: 1.4,
                  marginTop: 2,
                }}>
                  {a.detail}
                </div>
              </div>
              <div style={{
                fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
                color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {a.time}
              </div>
            </div>
          </SlideIn>
        ))}
      </div>
    </div>
  );
}

// ---- Main Dashboard ----

export default function DashboardDemo() {
  const [activeNav, setActiveNav] = useState('Dashboard');

  return (
    <div style={{
      fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
      color: 'var(--sem-foreground, #171717)',
      backgroundColor: 'var(--sem-background, #fafafa)',
      minHeight: '100vh',
      display: 'flex',
    }}>
      <Sidebar activeNav={activeNav} onNavClick={setActiveNav} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: '100vh',
      }}>
        <TopBar />

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: 'var(--spacing-600, 1.5rem)',
          backgroundColor: 'var(--sem-secondary, rgba(115,115,115,0.06))',
          overflow: 'auto',
        }}>
          {/* Page heading */}
          <FadeIn distance={10} style={{ marginBottom: 'var(--spacing-600, 1.5rem)' }}>
            <h1 style={{
              fontSize: 'var(--typography-fontSize-lg, 1.25rem)',
              fontWeight: 700,
              fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
              color: 'var(--sem-foreground, #171717)',
              margin: 0,
              lineHeight: 1.3,
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
              color: 'var(--sem-muted-foreground, rgba(23,23,23,0.5))',
              margin: '4px 0 0 0',
            }}>
              Welcome back, Jane. Here is what is happening today.
            </p>
          </FadeIn>

          {/* Stats */}
          <StatsRow />

          {/* Chart + Activity */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-400, 1rem)',
            marginTop: 'var(--spacing-400, 1rem)',
          }}>
            <BarChart />
            <ActivityFeed />
          </div>

          {/* Data table */}
          <div style={{ marginTop: 'var(--spacing-400, 1rem)' }}>
            <DataTable />
          </div>
        </main>
      </div>
    </div>
  );
}
