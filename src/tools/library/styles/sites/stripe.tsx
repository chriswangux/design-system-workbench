import { useState, type CSSProperties } from 'react';

// ============================================================================
// Stripe — Reference Design
// A pristine, spacious payment checkout page for "Pay".
// Indigo gradients on bright whites. System fonts. Layered shadows.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens ----

const c = {
  // Surfaces
  bg: '#ffffff',
  bgGradientStart: '#f6f9fc',
  bgGradientEnd: '#e9ecf5',
  surface: '#ffffff',
  surfaceHover: '#f7f8fa',
  surfaceAlt: '#f6f9fc',

  // Accent
  primary: '#635bff',
  primaryHover: '#7a73ff',
  primaryDark: '#4b45c6',
  primaryDim: 'rgba(99, 91, 255, 0.08)',
  primaryGlow: 'rgba(99, 91, 255, 0.15)',
  primaryGradient: 'linear-gradient(135deg, #635bff 0%, #7a73ff 50%, #80e9ff 100%)',

  // Text
  heading: '#32325d',
  body: '#525f7f',
  muted: '#8898aa',
  placeholder: '#aab7c4',
  onPrimary: '#ffffff',

  // Borders
  border: '#e6ebf1',
  borderFocus: '#635bff',
  borderSubtle: '#f0f3f7',

  // Semantic
  success: '#3ecf8e',
  successDim: 'rgba(62, 207, 142, 0.1)',
  error: '#fa755a',

  // Shadows
  shadowSoft: 'rgba(50, 50, 93, 0.06)',
  shadowMedium: 'rgba(50, 50, 93, 0.10)',
  shadowStrong: 'rgba(50, 50, 93, 0.12)',
  shadowDirectional: 'rgba(0, 0, 0, 0.04)',
};

// ---- Typography ----

const font = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  mono: "'SF Mono', SFMono-Regular, Menlo, monospace",
};

// ---- Easing ----

const ease = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

// ---- Shared Shadow Utilities ----

const shadow = {
  card: [
    `0 2px 4px ${c.shadowDirectional}`,
    `0 6px 12px ${c.shadowSoft}`,
    `0 12px 24px ${c.shadowMedium}`,
    `0 30px 60px ${c.shadowStrong}`,
  ].join(', '),
  sm: `0 1px 3px ${c.shadowDirectional}, 0 2px 6px ${c.shadowSoft}`,
  md: `0 4px 12px ${c.shadowMedium}, 0 2px 4px ${c.shadowDirectional}`,
  button: `0 2px 6px rgba(99, 91, 255, 0.2), 0 1px 3px rgba(99, 91, 255, 0.1)`,
  buttonHover: `0 4px 12px rgba(99, 91, 255, 0.35), 0 1px 3px rgba(99, 91, 255, 0.2)`,
};

// ---- Gradient Background ----

function GradientBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: `linear-gradient(150deg, ${c.bgGradientStart} 15%, ${c.bgGradientEnd} 70%, #d6dfef 94%)`,
        zIndex: 0,
      }}
    />
  );
}

// ---- Top Navigation Bar ----

function TopBar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [ctaHover, setCtaHover] = useState(false);

  const navItems = ['Products', 'Developers', 'Company', 'Pricing'];

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 48px',
        background: 'transparent',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: Logo + Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="7" fill={c.primary} />
            <path
              d="M12.2 9.5c0-1 .8-1.7 1.8-1.7s1.8.7 1.8 1.7c0 .7-.4 1.3-1 1.6L13 18"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: c.heading,
              fontFamily: font.sans,
              letterSpacing: '-0.025em',
            }}
          >
            Pay
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 28 }}>
          {navItems.map((item) => (
            <span
              key={item}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                fontSize: 15,
                fontWeight: 500,
                fontFamily: font.sans,
                color: hoveredItem === item ? c.primary : c.body,
                cursor: 'pointer',
                transition: `color 150ms ${ease}`,
              }}
            >
              {item}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Auth actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 500,
            fontFamily: font.sans,
            color: c.body,
            cursor: 'pointer',
          }}
        >
          Sign in
        </span>
        <button
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: font.sans,
            color: c.onPrimary,
            background: ctaHover ? c.primaryHover : c.primary,
            border: 'none',
            borderRadius: 8,
            padding: '9px 20px',
            cursor: 'pointer',
            transition: `background 150ms ${ease}, transform 150ms ${ease}, box-shadow 150ms ${ease}`,
            transform: ctaHover ? 'translateY(-1px)' : 'translateY(0)',
            boxShadow: ctaHover ? shadow.buttonHover : shadow.button,
          }}
        >
          Get started
        </button>
      </div>
    </header>
  );
}

// ---- Form Input ----

function FormInput({
  label,
  placeholder,
  type = 'text',
  icon,
  style: styleProp,
}: {
  label: string;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  style?: CSSProperties;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...styleProp }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: font.sans,
          color: c.heading,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: 44,
            padding: icon ? '0 14px 0 40px' : '0 14px',
            fontSize: 15,
            fontFamily: font.sans,
            color: c.heading,
            background: c.surface,
            border: `1px solid ${focused ? c.borderFocus : c.border}`,
            borderRadius: 8,
            outline: 'none',
            boxShadow: focused
              ? `0 0 0 3px ${c.primaryGlow}, 0 1px 2px ${c.shadowDirectional}`
              : `0 1px 2px ${c.shadowDirectional}`,
            transition: `border-color 150ms ${ease}, box-shadow 150ms ${ease}`,
            boxSizing: 'border-box' as const,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  );
}

// ---- Order Summary Item ----

function OrderItem({
  name,
  description,
  price,
  icon,
}: {
  name: string;
  description: string;
  price: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        borderBottom: `1px solid ${c.borderSubtle}`,
      }}
    >
      {/* Product icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: c.primaryDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: font.sans,
            color: c.heading,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: font.sans,
            color: c.muted,
            marginTop: 1,
          }}
        >
          {description}
        </div>
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontFamily: font.mono,
          color: c.heading,
          whiteSpace: 'nowrap',
        }}
      >
        {price}
      </div>
    </div>
  );
}

// ---- Trust Badge ----

function TrustBadge({ icon, label }: { icon: 'shield' | 'lock' | 'check'; label: string }) {
  const icons: Record<string, React.ReactNode> = {
    shield: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.muted}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    lock: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.muted}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    check: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.muted}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {icons[icon]}
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          fontFamily: font.sans,
          color: c.muted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---- Checkout Card ----

function CheckoutCard() {
  const [payHovered, setPayHovered] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        background: c.surface,
        borderRadius: 16,
        padding: '40px 40px 36px',
        boxShadow: shadow.card,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent gradient line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: c.primaryGradient,
        }}
      />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: font.sans,
            color: c.heading,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Checkout
        </h2>
        <p
          style={{
            fontSize: 14,
            fontFamily: font.sans,
            color: c.muted,
            margin: '6px 0 0',
          }}
        >
          Complete your purchase securely
        </p>
      </div>

      {/* Order Summary */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: font.sans,
            color: c.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Order Summary
        </div>

        <OrderItem
          name="Pro Plan"
          description="Annual subscription"
          price="$199.00"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
        />

        <OrderItem
          name="Priority Support"
          description="24/7 add-on"
          price="$49.00"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />

        {/* Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0 0',
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: font.sans,
              color: c.heading,
            }}
          >
            Total
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: font.mono,
              color: c.heading,
              letterSpacing: '-0.01em',
            }}
          >
            $248.00
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: c.border, margin: '0 0 28px' }} />

      {/* Payment Details */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: font.sans,
            color: c.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 16,
          }}
        >
          Payment Details
        </div>

        <FormInput
          label="Email"
          placeholder="jenny@example.com"
          type="email"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c.muted}
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
          }
        />

        <div style={{ marginTop: 18 }}>
          <FormInput
            label="Card number"
            placeholder="1234 1234 1234 1234"
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c.muted}
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <path d="M1 10h22" />
              </svg>
            }
          />
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
          <FormInput label="Expiry" placeholder="MM / YY" style={{ flex: 1 }} />
          <FormInput label="CVC" placeholder="123" style={{ flex: 1 }} />
        </div>

        <div style={{ marginTop: 18 }}>
          <FormInput
            label="Cardholder name"
            placeholder="Full name on card"
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c.muted}
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Pay Button */}
      <button
        onMouseEnter={() => setPayHovered(true)}
        onMouseLeave={() => setPayHovered(false)}
        style={{
          width: '100%',
          height: 48,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: font.sans,
          color: c.onPrimary,
          background: payHovered ? c.primaryHover : c.primary,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: payHovered ? shadow.buttonHover : shadow.button,
          transform: payHovered ? 'translateY(-1px)' : 'translateY(0)',
          transition: `all 150ms ${ease}`,
          letterSpacing: '0.01em',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        Pay $248.00
      </button>

      {/* Trust indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          marginTop: 24,
          paddingTop: 20,
          borderTop: `1px solid ${c.borderSubtle}`,
        }}
      >
        <TrustBadge icon="shield" label="SSL Secured" />
        <TrustBadge icon="lock" label="Encrypted" />
        <TrustBadge icon="check" label="PCI Compliant" />
      </div>
    </div>
  );
}

// ---- Floating Feature Pills ----

function FeaturePill({
  label,
  x,
  y,
  icon,
}: {
  label: string;
  x: string;
  y: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        background: 'rgba(255, 255, 255, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 24,
        padding: '9px 18px 9px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: font.sans,
        color: c.body,
        boxShadow: `0 2px 8px ${c.shadowSoft}, 0 1px 3px ${c.shadowDirectional}`,
        border: '1px solid rgba(255, 255, 255, 0.65)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {icon}
      {label}
    </div>
  );
}

// ---- Powered By Section ----

function PoweredByStrip() {
  const partners = ['Shopify', 'Notion', 'Figma', 'Vercel', 'Linear'];

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '0 48px 24px',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: font.sans,
          color: c.placeholder,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 16,
        }}
      >
        Trusted by leading companies
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {partners.map((name) => (
          <span
            key={name}
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: font.sans,
              color: c.muted,
              opacity: 0.5,
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Footer ----

function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const footerLinks = ['Terms', 'Privacy', 'Security', 'Docs', 'Contact'];

  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '32px 48px 44px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          marginBottom: 14,
        }}
      >
        {footerLinks.map((item) => (
          <span
            key={item}
            onMouseEnter={() => setHoveredLink(item)}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              fontSize: 13,
              fontWeight: 500,
              fontFamily: font.sans,
              color: hoveredLink === item ? c.body : c.muted,
              cursor: 'pointer',
              transition: `color 150ms ${ease}`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
      <p
        style={{
          fontSize: 12,
          fontFamily: font.sans,
          color: c.placeholder,
          margin: 0,
        }}
      >
        Powered by Pay — Payments infrastructure for the internet
      </p>
    </footer>
  );
}

// ---- Main Layout ----

export default function StripeSite() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        fontFamily: font.sans,
        color: c.body,
        fontSize: 16,
        lineHeight: 1.5,
        position: 'relative',
        overflow: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <GradientBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <TopBar />

        {/* Main content area */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px 48px',
            position: 'relative',
          }}
        >
          {/* Floating decorative pills */}
          <FeaturePill
            label="256-bit encryption"
            x="6%"
            y="16%"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.primary}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            }
          />
          <FeaturePill
            label="3D Secure"
            x="80%"
            y="10%"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.primary}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          />
          <FeaturePill
            label="Instant payouts"
            x="3%"
            y="70%"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.success}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            }
          />
          <FeaturePill
            label="135+ currencies"
            x="82%"
            y="66%"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.primary}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            }
          />
          <FeaturePill
            label="99.99% uptime"
            x="76%"
            y="40%"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.success}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            }
          />
          <FeaturePill
            label="Radar fraud detection"
            x="1%"
            y="44%"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.primary}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v10l6.93 4" />
              </svg>
            }
          />

          <CheckoutCard />
        </main>

        <PoweredByStrip />
        <Footer />
      </div>
    </div>
  );
}
