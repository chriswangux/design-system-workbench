import { useState } from 'react';

// ============================================================================
// Linear — Reference Design
// A dark, focused, precise project management tool landing page.
// Violet accents on deep charcoal neutrals. Tight spacing. Tool-like.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Design Tokens ----

const c = {
  bg: '#0e0e14', surface0: '#131319', surface1: '#1c1b22',
  surface2: '#222130', surface3: '#2a293a', surfaceHover: '#1f1e2a',
  accent: '#9b6ee0', accentHover: '#ad82e8', accentMuted: '#c5a3f5',
  accentDim: 'rgba(155, 110, 224, 0.12)',
  text: '#ededf0', textSecondary: '#9494a0',
  textTertiary: '#6b6b78', textMuted: '#4a4a58',
  border: 'rgba(155, 110, 224, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderHover: 'rgba(155, 110, 224, 0.18)',
  positive: '#3dd68c', positiveDim: 'rgba(61, 214, 140, 0.12)',
  shadowSm: '1px 2px 4px rgba(20, 10, 40, 0.3)',
  shadowMd: '2px 4px 12px rgba(20, 10, 40, 0.4)',
  shadowLg: '3px 6px 24px rgba(20, 10, 40, 0.5)',
};

const font = {
  sans: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
};

const ease = 'cubic-bezier(0.16, 0, 0, 1)';

// ---- Background layers ----

function GridBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: `linear-gradient(rgba(155,110,224,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(155,110,224,0.02) 1px, transparent 1px)`,
      backgroundSize: '64px 64px',
    }} />
  );
}

// ---- Nav Bar ----

function NavBar() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [ctaHov, setCtaHov] = useState(false);

  return (
    <header style={{
      position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '14px 40px',
      borderBottom: `1px solid ${c.borderSubtle}`,
      background: `${c.bg}e6`, backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="11" y="1" width="14" height="14" rx="3" transform="rotate(45 11 1)" fill={c.accent} opacity="0.9" />
            <rect x="11" y="4" width="10" height="10" rx="2" transform="rotate(45 11 4)" fill={c.bg} opacity="0.6" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 600, color: c.text, fontFamily: font.sans, letterSpacing: '-0.03em' }}>
            Prism
          </span>
        </div>
        <nav style={{ display: 'flex', gap: 24 }}>
          {['Features', 'Integrations', 'Pricing', 'Changelog'].map((item) => (
            <span key={item}
              onMouseEnter={() => setHovered(item)} onMouseLeave={() => setHovered(null)}
              style={{
                fontSize: 13, fontWeight: 450, fontFamily: font.sans, cursor: 'pointer',
                color: hovered === item ? c.text : c.textTertiary,
                transition: `color 80ms ${ease}`,
              }}>{item}</span>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 450, fontFamily: font.sans, color: c.textTertiary, cursor: 'pointer' }}>
          Log in
        </span>
        <button
          onMouseEnter={() => setCtaHov(true)} onMouseLeave={() => setCtaHov(false)}
          style={{
            fontSize: 13, fontWeight: 500, fontFamily: font.sans, color: '#fff',
            background: ctaHov ? c.accentHover : c.accent, border: 'none',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
            transition: `background 80ms ${ease}, box-shadow 80ms ${ease}`,
            boxShadow: ctaHov ? `0 0 0 1px rgba(155,110,224,0.3), ${c.shadowSm}` : c.shadowSm,
          }}>Get started</button>
      </div>
    </header>
  );
}

// ---- Hero Section ----

function HeroSection() {
  const [priHov, setPriHov] = useState(false);
  const [secHov, setSecHov] = useState(false);

  return (
    <section style={{ position: 'relative', padding: '80px 40px 64px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at center, rgba(155,110,224,0.06) 0%, transparent 70%)',
      }} />

      {/* Version badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px 4px 6px',
        background: c.accentDim, borderRadius: 20, border: `1px solid ${c.border}`,
        marginBottom: 28, position: 'relative', zIndex: 1,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, fontFamily: font.mono, color: c.accent,
          background: 'rgba(155,110,224,0.2)', borderRadius: 10, padding: '2px 6px',
        }}>v3.2</span>
        <span style={{ fontSize: 12, fontFamily: font.sans, color: c.textSecondary, fontWeight: 450 }}>
          Cycles & automations are here
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 48, fontWeight: 550, fontFamily: font.sans, color: c.text,
        letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 16px',
        position: 'relative', zIndex: 1,
      }}>
        Build products<br />
        <span style={{ color: c.accentMuted }}>with precision</span>
      </h1>

      <p style={{
        fontSize: 16, fontFamily: font.sans, color: c.textTertiary, lineHeight: 1.55,
        margin: '0 auto 36px', maxWidth: 480, fontWeight: 400,
        position: 'relative', zIndex: 1,
      }}>
        Prism is the project management tool for teams who ship.
        Streamlined issue tracking, cycles, and roadmaps designed
        around how you actually work.
      </p>

      {/* CTA buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <button
          onMouseEnter={() => setPriHov(true)} onMouseLeave={() => setPriHov(false)}
          style={{
            fontSize: 14, fontWeight: 500, fontFamily: font.sans, color: '#fff',
            background: priHov ? c.accentHover : c.accent, border: 'none',
            borderRadius: 8, padding: '10px 24px', cursor: 'pointer',
            transition: `background 80ms ${ease}, box-shadow 160ms ${ease}, transform 160ms ${ease}`,
            boxShadow: priHov
              ? '0 0 0 1px rgba(155,110,224,0.4), 0 4px 16px rgba(155,110,224,0.25)'
              : `0 0 0 1px rgba(155,110,224,0.2), ${c.shadowSm}`,
            transform: priHov ? 'translateY(-1px)' : 'translateY(0)',
          }}>Start building — free</button>
        <button
          onMouseEnter={() => setSecHov(true)} onMouseLeave={() => setSecHov(false)}
          style={{
            fontSize: 14, fontWeight: 450, fontFamily: font.sans,
            color: secHov ? c.text : c.textSecondary,
            background: secHov ? c.surface2 : c.surface1,
            border: `1px solid ${secHov ? c.borderHover : c.border}`,
            borderRadius: 8, padding: '9px 24px', cursor: 'pointer',
            transition: `all 80ms ${ease}`,
          }}>View demo</button>
      </div>
    </section>
  );
}

// ---- Task List Preview ----

interface Task {
  id: string; title: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: string; label: string;
}

const tasks: Task[] = [
  { id: 'PRI-142', title: 'Implement webhook retry logic', status: 'in-progress', priority: 'urgent', assignee: 'AK', label: 'Backend' },
  { id: 'PRI-141', title: 'Design settings page redesign', status: 'in-progress', priority: 'high', assignee: 'SW', label: 'Design' },
  { id: 'PRI-140', title: 'Add batch operations to API', status: 'todo', priority: 'high', assignee: 'JR', label: 'Backend' },
  { id: 'PRI-139', title: 'Fix tooltip positioning on overflow', status: 'todo', priority: 'medium', assignee: 'AK', label: 'Frontend' },
  { id: 'PRI-138', title: 'Migrate auth to PKCE flow', status: 'backlog', priority: 'medium', assignee: 'LM', label: 'Security' },
  { id: 'PRI-137', title: 'Update onboarding copy', status: 'done', priority: 'low', assignee: 'SW', label: 'Content' },
];

const statusCfg: Record<Task['status'], { color: string; bg: string; label: string }> = {
  'backlog': { color: c.textMuted, bg: 'rgba(74,74,88,0.15)', label: 'Backlog' },
  'todo': { color: c.textTertiary, bg: 'rgba(107,107,120,0.12)', label: 'Todo' },
  'in-progress': { color: '#eab308', bg: 'rgba(234,179,8,0.12)', label: 'In Progress' },
  'done': { color: c.positive, bg: c.positiveDim, label: 'Done' },
};

const priCfg: Record<Task['priority'], { color: string; bars: number }> = {
  'urgent': { color: '#ef4444', bars: 4 }, 'high': { color: '#f97316', bars: 3 },
  'medium': { color: '#eab308', bars: 2 }, 'low': { color: c.textMuted, bars: 1 },
};

function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  const { color, bars } = priCfg[priority];
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 3} y={10 - (i + 1) * 2.2} width="2" height={(i + 1) * 2.2}
          rx="0.5" fill={i < bars ? color : 'rgba(255,255,255,0.06)'} />
      ))}
    </svg>
  );
}

function TaskRow({ task }: { task: Task }) {
  const [hov, setHov] = useState(false);
  const sc = statusCfg[task.status];
  const done = task.status === 'done';

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '20px 72px 1fr auto auto auto',
        gap: 12, alignItems: 'center', padding: '7px 16px',
        borderBottom: `1px solid ${c.borderSubtle}`, cursor: 'pointer',
        background: hov ? c.surfaceHover : 'transparent',
        transition: `background 80ms ${ease}`,
      }}>
      <PriorityIcon priority={task.priority} />
      <span style={{ fontSize: 12, fontFamily: font.mono, color: c.textMuted }}>{task.id}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {/* Status dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          border: `${done ? 2 : 1.5}px solid ${sc.color}`,
          background: done ? sc.color : 'transparent',
        }} />
        <span style={{
          fontSize: 13, fontFamily: font.sans, fontWeight: 400,
          color: done ? c.textTertiary : c.text,
          textDecoration: done ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</span>
      </div>
      <span style={{
        fontSize: 11, fontFamily: font.sans, color: c.textTertiary, fontWeight: 450,
        background: c.accentDim, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
      }}>{task.label}</span>
      <span style={{
        fontSize: 11, fontFamily: font.sans, color: sc.color, fontWeight: 450,
        background: sc.bg, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
      }}>{sc.label}</span>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: c.surface3,
        border: `1px solid ${c.borderSubtle}`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 9, fontFamily: font.sans,
        fontWeight: 600, color: c.textSecondary,
      }}>{task.assignee}</div>
    </div>
  );
}

function TaskListPreview() {
  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px 72px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{
          fontSize: 11, fontFamily: font.mono, color: c.accent, textTransform: 'uppercase',
          letterSpacing: '0.1em', margin: '0 0 8px', fontWeight: 500,
        }}>Purpose-built</p>
        <h2 style={{
          fontSize: 26, fontWeight: 550, fontFamily: font.sans, color: c.text,
          letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2,
        }}>Every detail, considered</h2>
      </div>

      <div style={{
        background: c.surface0, border: `1px solid ${c.border}`,
        borderRadius: 12, overflow: 'hidden', boxShadow: c.shadowLg,
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: `1px solid ${c.borderSubtle}`, background: c.surface1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontFamily: font.sans, fontWeight: 500, color: c.text }}>Active Sprint</span>
            <span style={{ fontSize: 11, fontFamily: font.mono, color: c.textMuted }}>6 issues</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { label: 'Filter', d: 'M4 6h16M8 12h8M11 18h2' },
              { label: 'Group', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
            ].map((btn) => (
              <div key={btn.label} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                fontFamily: font.sans, color: c.textTertiary, padding: '4px 8px',
                borderRadius: 5, border: `1px solid ${c.borderSubtle}`, cursor: 'pointer',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {btn.d.split('M').filter(Boolean).map((seg, i) => (
                    <path key={i} d={`M${seg}`} />
                  ))}
                </svg>
                {btn.label}
              </div>
            ))}
          </div>
        </div>

        {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
      </div>

      {/* Keyboard shortcuts */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
        {[{ key: 'C', label: 'New issue' }, { key: 'S', label: 'Status' }, { key: 'P', label: 'Priority' }].map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: font.sans, color: c.textMuted }}>
            <span style={{
              fontSize: 10, fontFamily: font.mono, color: c.textTertiary,
              background: c.surface2, border: `1px solid ${c.borderSubtle}`,
              borderRadius: 3, padding: '1px 5px', fontWeight: 500,
            }}>{s.key}</span>
            {s.label}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Feature Cards ----

const features = [
  { title: 'Issue tracking', desc: 'Create, assign, and track issues with sub-tasks, labels, and custom views.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { title: 'Cycles', desc: 'Time-boxed work periods with automatic rollover and velocity tracking.', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { title: 'Roadmaps', desc: 'Visualize project timelines and milestones across teams and quarters.', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { title: 'Automations', desc: 'Define rules to auto-assign, transition, and notify — no manual work.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(180deg, ${c.surface2} 0%, ${c.surface1} 100%)` : c.surface0,
        border: `1px solid ${hov ? c.borderHover : c.border}`, borderRadius: 10,
        padding: '24px 20px', cursor: 'default',
        transition: `all 160ms ${ease}`,
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? c.shadowMd : 'none',
      }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: c.accentDim,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.accent}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : `M${seg}`} />)}
        </svg>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 550, fontFamily: font.sans, color: c.text, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, fontFamily: font.sans, color: c.textTertiary, margin: 0, lineHeight: 1.45 }}>
        {desc}
      </p>
    </div>
  );
}

// ---- Metrics Strip ----

function MetricsStrip() {
  const metrics = [
    { value: '50k+', label: 'Teams' }, { value: '99.99%', label: 'Uptime' },
    { value: '<50ms', label: 'Latency' }, { value: '2M+', label: 'Issues tracked' },
  ];
  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px 72px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
        background: c.border, borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${c.border}`,
      }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: c.surface0, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: font.mono, color: c.text, letterSpacing: '-0.03em', marginBottom: 4 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, fontFamily: font.sans, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 450 }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- CTA Section ----

function CTASection() {
  const [hov, setHov] = useState(false);
  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px 72px', textAlign: 'center' }}>
      <div style={{
        background: `linear-gradient(180deg, ${c.surface1} 0%, ${c.surface0} 100%)`,
        border: `1px solid ${c.border}`, borderRadius: 12, padding: '48px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '50%', height: 1, background: `linear-gradient(90deg, transparent, ${c.accent}40, transparent)`,
        }} />
        <h2 style={{
          fontSize: 24, fontWeight: 550, fontFamily: font.sans, color: c.text,
          letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2,
        }}>Ready to ship faster?</h2>
        <p style={{ fontSize: 14, fontFamily: font.sans, color: c.textTertiary, margin: '0 0 28px', lineHeight: 1.5 }}>
          Free for teams up to 10. No credit card required.
        </p>
        <button
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            fontSize: 14, fontWeight: 500, fontFamily: font.sans, color: '#fff',
            background: hov ? c.accentHover : c.accent, border: 'none',
            borderRadius: 8, padding: '10px 28px', cursor: 'pointer',
            transition: `background 80ms ${ease}, box-shadow 160ms ${ease}, transform 160ms ${ease}`,
            boxShadow: hov
              ? '0 0 0 1px rgba(155,110,224,0.4), 0 4px 20px rgba(155,110,224,0.3)'
              : `0 0 0 1px rgba(155,110,224,0.2), ${c.shadowSm}`,
            transform: hov ? 'translateY(-1px)' : 'translateY(0)',
          }}>Get started for free</button>
      </div>
    </section>
  );
}

// ---- Footer ----

function Footer() {
  return (
    <footer style={{
      maxWidth: 800, margin: '0 auto', padding: '24px 40px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderTop: `1px solid ${c.borderSubtle}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
          <rect x="11" y="1" width="14" height="14" rx="3" transform="rotate(45 11 1)" fill={c.textMuted} opacity="0.6" />
        </svg>
        <span style={{ fontSize: 12, fontFamily: font.sans, color: c.textMuted }}>Prism Inc.</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        {['Privacy', 'Terms', 'Status'].map((item) => (
          <span key={item} style={{ fontSize: 12, fontFamily: font.sans, color: c.textMuted, cursor: 'pointer' }}>{item}</span>
        ))}
      </div>
    </footer>
  );
}

// ---- Main Layout ----

export default function LinearSite() {
  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: c.bg,
      color: c.text, fontFamily: font.sans, position: 'relative', overflow: 'hidden',
    }}>
      <GridBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <HeroSection />
        <TaskListPreview />
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px 72px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {features.map((f) => <FeatureCard key={f.title} title={f.title} desc={f.desc} icon={f.icon} />)}
          </div>
        </section>
        <MetricsStrip />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
