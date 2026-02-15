import { useState, type CSSProperties } from 'react';

// ============================================================================
// Soft Pastel — Reference Design
// A calm, nurturing wellness/mindfulness app dashboard.
// Gentle pastels, high lightness, low saturation, rounded everything.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens (literal values) ----

const c = {
  // Surfaces
  bg: '#faf7f2',
  surface: '#ffffff',
  surfaceHover: '#f5f2ed',
  surfaceMuted: '#f3f0eb',

  // Borders
  border: '#e0ddd8',
  borderSubtle: '#eae7e2',

  // Text
  text: '#3a3838',
  textSecondary: '#6b6868',
  textTertiary: '#9a9696',
  textMuted: '#b8b4b0',

  // Pastels
  rose: '#f2d4d8',
  roseDim: '#faf0f2',
  roseAccent: '#d4929c',

  lavender: '#ddd0f0',
  lavenderDim: '#f0ecf8',
  lavenderAccent: '#a48cc8',

  mint: '#c8ece0',
  mintDim: '#ecf8f3',
  mintAccent: '#72b89a',

  // Accent (warm rose-mauve)
  accent: '#c4a0aa',
  accentSoft: 'rgba(196, 160, 170, 0.18)',

  // Semantic
  positive: '#72b89a',
  positiveDim: 'rgba(114, 184, 154, 0.15)',

  // Shadows
  shadowSoft: 'rgba(60, 50, 45, 0.04)',
  shadowMedium: 'rgba(60, 50, 45, 0.07)',
};

// ---- Typography ----

const font = {
  sans: "'DM Sans', system-ui, -apple-system, sans-serif",
};

// ---- Easing ----

const ease = 'cubic-bezier(0.25, 0.8, 0.25, 1)';
const duration = '180ms';

// ---- Card Component ----

function Card({
  children,
  style,
  hoverable = true,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
  hoverable?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={hoverable ? () => setHovered(true) : undefined}
      onMouseLeave={hoverable ? () => setHovered(false) : undefined}
      style={{
        background: c.surface,
        border: `1px solid ${c.borderSubtle}`,
        borderRadius: 18,
        padding: '24px 28px',
        position: 'relative',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 8px 32px ${c.shadowMedium}, 0 2px 8px ${c.shadowSoft}`
          : `0 2px 12px ${c.shadowSoft}, 0 1px 4px ${c.shadowSoft}`,
        transition: `transform ${duration} ${ease}, box-shadow ${duration} ${ease}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---- Soft Icon (simple SVG shapes) ----

function IconCircle({
  color,
  bgColor,
  children,
  size = 44,
}: {
  color: string;
  bgColor: string;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// ---- Top Bar ----

function TopBar() {
  const navItems = ['Home', 'Discover', 'Journal', 'Profile'];
  const [activeNav, setActiveNav] = useState('Home');

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 36px',
        background: c.surface,
        borderBottom: `1px solid ${c.borderSubtle}`,
        borderRadius: '20px 20px 0 0',
        boxShadow: `0 1px 8px ${c.shadowSoft}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${c.rose}, ${c.lavender})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3C10 3 8.5 4.5 7 7C5.5 9.5 5 12 5 14C5 17.87 8.13 21 12 21C15.87 21 19 17.87 19 14C19 12 18.5 9.5 17 7C15.5 4.5 14 3 12 3Z"
              fill={c.roseAccent}
              opacity="0.7"
            />
            <path
              d="M12 7C11 7 10 8 9.5 9.5C9 11 9 12.5 9 13.5C9 15.43 10.57 17 12.5 17C14.43 17 16 15.43 16 13.5C16 12.5 15.5 11 15 9.5C14.5 8 13.5 7 12 7Z"
              fill={c.lavenderAccent}
              opacity="0.5"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: 19,
            fontWeight: 600,
            color: c.text,
            fontFamily: font.sans,
            letterSpacing: '-0.01em',
          }}
        >
          Bloom
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: 4 }}>
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setActiveNav(item)}
            style={{
              fontSize: 14,
              fontFamily: font.sans,
              fontWeight: item === activeNav ? 600 : 400,
              color: item === activeNav ? c.text : c.textSecondary,
              background: item === activeNav ? c.surfaceMuted : 'transparent',
              border: 'none',
              borderRadius: 12,
              padding: '8px 18px',
              cursor: 'pointer',
              transition: `background ${duration} ${ease}, color ${duration} ${ease}`,
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${c.mint}, ${c.lavender})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: c.text,
            fontFamily: font.sans,
          }}
        >
          AJ
        </div>
      </div>
    </header>
  );
}

// ---- Welcome Card ----

function WelcomeCard() {
  return (
    <Card
      style={{
        background: `linear-gradient(135deg, ${c.roseDim} 0%, ${c.lavenderDim} 50%, ${c.mintDim} 100%)`,
        border: `1px solid ${c.borderSubtle}`,
        padding: '32px 36px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div
            style={{
              fontSize: 13,
              fontFamily: font.sans,
              color: c.textTertiary,
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Good morning
          </div>
          <div
            style={{
              fontSize: 26,
              fontFamily: font.sans,
              color: c.text,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              marginBottom: 8,
            }}
          >
            Welcome back, Ava
          </div>
          <div
            style={{
              fontSize: 15,
              fontFamily: font.sans,
              color: c.textSecondary,
              lineHeight: 1.6,
            }}
          >
            You're on a <strong style={{ color: c.text, fontWeight: 600 }}>12-day</strong> mindfulness streak. Keep going!
          </div>
        </div>

        {/* Streak circle */}
        <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            {/* Track */}
            <circle
              cx="44"
              cy="44"
              r="38"
              fill="none"
              stroke={c.border}
              strokeWidth="5"
              opacity="0.5"
            />
            {/* Progress */}
            <circle
              cx="44"
              cy="44"
              r="38"
              fill="none"
              stroke={c.roseAccent}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 38 * 0.85} ${2 * Math.PI * 38 * 0.15}`}
              strokeDashoffset={2 * Math.PI * 38 * 0.25}
              opacity="0.7"
              style={{ transition: `stroke-dasharray 600ms ${ease}` }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: font.sans, lineHeight: 1 }}>12</div>
            <div style={{ fontSize: 10, color: c.textTertiary, fontFamily: font.sans, marginTop: 2 }}>days</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---- Activity Card ----

interface ActivityCardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  progress: number; // 0 to 1
}

function ActivityCard({ label, value, unit, icon, accentColor, accentBg, progress }: ActivityCardProps) {
  return (
    <Card style={{ padding: '24px 24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <IconCircle color={accentColor} bgColor={accentBg}>
          {icon}
        </IconCircle>
        <div
          style={{
            fontSize: 11,
            fontFamily: font.sans,
            color: c.positive,
            background: c.positiveDim,
            padding: '4px 10px',
            borderRadius: 10,
            fontWeight: 500,
          }}
        >
          On track
        </div>
      </div>
      <div style={{ fontSize: 13, fontFamily: font.sans, color: c.textTertiary, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: c.text, fontFamily: font.sans, letterSpacing: '-0.02em' }}>
          {value}
        </span>
        <span style={{ fontSize: 14, color: c.textTertiary, fontFamily: font.sans }}>{unit}</span>
      </div>
      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: c.surfaceMuted,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: 3,
            background: accentColor,
            opacity: 0.7,
            transition: `width 600ms ${ease}`,
          }}
        />
      </div>
    </Card>
  );
}

// ---- Mood Tracker ----

const moods = [
  { label: 'Calm', emoji: '\u2728', selected: false },
  { label: 'Happy', emoji: '\u2600\uFE0F', selected: true },
  { label: 'Focused', emoji: '\uD83C\uDFAF', selected: false },
  { label: 'Grateful', emoji: '\uD83D\uDE4F', selected: false },
  { label: 'Tired', emoji: '\uD83C\uDF19', selected: false },
];

function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState(1);

  return (
    <Card style={{ padding: '28px 28px 24px' }}>
      <div style={{ fontSize: 15, fontFamily: font.sans, color: c.text, fontWeight: 600, marginBottom: 6 }}>
        How are you feeling?
      </div>
      <div style={{ fontSize: 13, fontFamily: font.sans, color: c.textTertiary, marginBottom: 22, lineHeight: 1.6 }}>
        Track your mood to understand your patterns
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {moods.map((mood, i) => (
          <button
            key={mood.label}
            onClick={() => setSelectedMood(i)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '16px 8px',
              borderRadius: 16,
              border: `1.5px solid ${i === selectedMood ? c.lavenderAccent : c.borderSubtle}`,
              background: i === selectedMood ? c.lavenderDim : c.surface,
              cursor: 'pointer',
              transition: `all ${duration} ${ease}`,
              boxShadow: i === selectedMood ? `0 2px 12px rgba(164, 140, 200, 0.15)` : 'none',
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{mood.emoji}</span>
            <span
              style={{
                fontSize: 12,
                fontFamily: font.sans,
                fontWeight: i === selectedMood ? 600 : 400,
                color: i === selectedMood ? c.lavenderAccent : c.textTertiary,
              }}
            >
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ---- Inspirational Quote ----

function QuoteCard() {
  return (
    <Card
      style={{
        background: `linear-gradient(135deg, ${c.mintDim} 0%, ${c.lavenderDim} 100%)`,
        border: `1px solid ${c.borderSubtle}`,
        padding: '32px 36px',
        textAlign: 'center',
      }}
      hoverable={false}
    >
      <div style={{ marginBottom: 16 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" opacity="0.35">
          <path
            d="M10 8C10 5.79 8.21 4 6 4C3.79 4 2 5.79 2 8C2 10.21 3.79 12 6 12C6 16 2 16 2 20H10C10 16 10 12.21 10 8Z"
            fill={c.lavenderAccent}
          />
          <path
            d="M22 8C22 5.79 20.21 4 18 4C15.79 4 14 5.79 14 8C14 10.21 15.79 12 18 12C18 16 14 16 14 20H22C22 16 22 12.21 22 8Z"
            fill={c.lavenderAccent}
          />
        </svg>
      </div>
      <div
        style={{
          fontSize: 18,
          fontFamily: font.sans,
          color: c.text,
          fontWeight: 500,
          lineHeight: 1.7,
          maxWidth: 480,
          margin: '0 auto',
          letterSpacing: '-0.01em',
          fontStyle: 'italic',
        }}
      >
        Almost everything will work again if you unplug it for a few minutes, including you.
      </div>
      <div
        style={{
          fontSize: 13,
          fontFamily: font.sans,
          color: c.textTertiary,
          marginTop: 16,
          fontWeight: 500,
        }}
      >
        Anne Lamott
      </div>
    </Card>
  );
}

// ---- Weekly Overview (small bar chart) ----

function WeeklyOverview() {
  const days = [
    { label: 'Mon', value: 25 },
    { label: 'Tue', value: 40 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 55 },
    { label: 'Fri', value: 35 },
    { label: 'Sat', value: 60 },
    { label: 'Sun', value: 20 },
  ];
  const maxVal = Math.max(...days.map((d) => d.value));

  return (
    <Card style={{ padding: '28px 28px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 15, fontFamily: font.sans, color: c.text, fontWeight: 600 }}>This Week</div>
          <div style={{ fontSize: 13, fontFamily: font.sans, color: c.textTertiary, marginTop: 4 }}>
            Mindful minutes per day
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontFamily: font.sans,
            color: c.accent,
            background: c.accentSoft,
            padding: '5px 12px',
            borderRadius: 10,
            fontWeight: 500,
          }}
        >
          250 min total
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100 }}>
        {days.map((day) => {
          const barHeight = (day.value / maxVal) * 80;
          return (
            <div
              key={day.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 32,
                  height: barHeight,
                  borderRadius: 8,
                  background: day.label === 'Sat'
                    ? `linear-gradient(180deg, ${c.mintAccent} 0%, ${c.mint} 100%)`
                    : c.surfaceMuted,
                  opacity: day.label === 'Sat' ? 0.8 : 1,
                  transition: `height 400ms ${ease}`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: font.sans,
                  color: c.textMuted,
                  fontWeight: 500,
                }}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---- Meditation Icon ----
function MeditationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="3" />
      <path d="M12 9v4" />
      <path d="M8 17c0-2.21 1.79-4 4-4s4 1.79 4 4" />
      <path d="M6 20c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2" />
    </svg>
  );
}

// ---- Breathing Icon ----
function BreathingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C12 22 4 16 4 10C4 6 7.58 3 12 3C16.42 3 20 6 20 10C20 16 12 22 12 22Z" />
      <path d="M12 13V7" />
      <path d="M9 10l3-3 3 3" />
    </svg>
  );
}

// ---- Journal Icon ----
function JournalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
      <path d="M7 8h10" />
      <path d="M7 12h10" />
      <path d="M7 16h6" />
    </svg>
  );
}

// ============================================================================
// Main Layout
// ============================================================================

export default function SoftPastelSite() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: c.bg,
        color: c.text,
        fontFamily: font.sans,
        fontSize: 16,
        lineHeight: 1.6,
        position: 'relative',
      }}
    >
      {/* Gentle ambient glow in top-right */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          right: '-5%',
          width: '40%',
          height: '50%',
          background: `radial-gradient(ellipse at center, rgba(221, 208, 240, 0.25) 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Gentle ambient glow in bottom-left */}
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          left: '-5%',
          width: '35%',
          height: '45%',
          background: `radial-gradient(ellipse at center, rgba(242, 212, 216, 0.2) 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <TopBar />

        <main style={{ padding: '32px 0 48px' }}>
          {/* Welcome Card */}
          <div style={{ marginBottom: 24 }}>
            <WelcomeCard />
          </div>

          {/* Activity Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
            <ActivityCard
              label="Meditation"
              value="24"
              unit="min today"
              icon={<MeditationIcon />}
              accentColor={c.roseAccent}
              accentBg={c.roseDim}
              progress={0.65}
            />
            <ActivityCard
              label="Breathing"
              value="3"
              unit="sessions"
              icon={<BreathingIcon />}
              accentColor={c.mintAccent}
              accentBg={c.mintDim}
              progress={0.75}
            />
            <ActivityCard
              label="Journal"
              value="5"
              unit="entries"
              icon={<JournalIcon />}
              accentColor={c.lavenderAccent}
              accentBg={c.lavenderDim}
              progress={0.5}
            />
          </div>

          {/* Mood Tracker + Weekly Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
            <MoodTracker />
            <WeeklyOverview />
          </div>

          {/* Inspirational Quote */}
          <div style={{ marginBottom: 32 }}>
            <QuoteCard />
          </div>
        </main>
      </div>
    </div>
  );
}
