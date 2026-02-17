import { useState, type CSSProperties } from 'react';

// ============================================================================
// Airbnb — Reference Design
// A warm, inviting listing page for a vacation rental.
// Coral accent (#FF385C) on pristine white. Generous whitespace. Rounded.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens ----

const c = {
  // Surfaces
  bg: '#ffffff',
  surfaceAlt: '#F7F7F7',
  surfaceWarm: '#FFF8F6',
  surface: '#ffffff',

  // Accent / Rausch
  primary: '#FF385C',
  primaryHover: '#E31C5F',
  primaryDim: 'rgba(255, 56, 92, 0.08)',
  primaryGlow: 'rgba(255, 56, 92, 0.15)',
  gradient: 'linear-gradient(135deg, #BD1E59 0%, #FF385C 50%, #E61E4D 100%)',

  // Text
  heading: '#222222',
  body: '#484848',
  muted: '#717171',
  placeholder: '#B0B0B0',
  onPrimary: '#ffffff',

  // Borders
  border: '#DDDDDD',
  borderSubtle: '#EBEBEB',
  borderFocus: '#222222',
  borderDark: '#B0B0B0',

  // Semantic
  success: '#008A05',
  successDim: 'rgba(0, 138, 5, 0.08)',
  star: '#222222',
  superhost: '#FF385C',

  // Shadows
  shadowSoft: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
  shadowCard: 'rgba(0, 0, 0, 0.15)',
};

// ---- Typography ----

const font = {
  sans: "Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'SF Mono', SFMono-Regular, Menlo, monospace",
};

// ---- Easing ----

const ease = 'cubic-bezier(0.2, 0, 0, 1)';

// ---- Shadow Presets ----

const shadow = {
  card: `0 1px 2px ${c.shadowSoft}, 0 4px 12px ${c.shadowMedium}`,
  cardHover: `0 2px 4px ${c.shadowMedium}, 0 8px 24px ${c.shadowStrong}`,
  nav: `0 1px 0 ${c.borderSubtle}`,
  dropdown: `0 2px 16px ${c.shadowCard}`,
  button: `0 1px 2px ${c.shadowSoft}`,
  buttonHover: `0 2px 8px ${c.shadowMedium}`,
};

// ---- Star Rating ----

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < Math.floor(rating) ? c.star : 'none'}
          stroke={c.star} strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ---- Top Navigation ----

function TopBar() {
  const [searchHover, setSearchHover] = useState(false);
  const [profileHover, setProfileHover] = useState(false);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: c.bg,
      borderBottom: `1px solid ${c.borderSubtle}`,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 40px',
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="30" height="32" viewBox="0 0 30 32" fill={c.primary}>
            <path d="M15 0C9.6 0 5.2 3.8 5.2 8.6c0 5.8 7.4 14.8 9 16.8.4.4.8.6 1.3.6h0c.4 0 .8-.2 1.2-.6 1.6-2 9-11 9-16.8C25.8 3.8 21.4 0 16 0h-1zm.5 12.2c-2 0-3.6-1.6-3.6-3.6s1.6-3.6 3.6-3.6 3.6 1.6 3.6 3.6-1.6 3.6-3.6 3.6z" />
          </svg>
          <span style={{
            fontSize: 22, fontWeight: 700, color: c.primary, fontFamily: font.sans,
            letterSpacing: '-0.02em',
          }}>
            staybnb
          </span>
        </div>

        {/* Search Pill */}
        <button
          onMouseEnter={() => setSearchHover(true)}
          onMouseLeave={() => setSearchHover(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 0,
            border: `1px solid ${c.border}`,
            borderRadius: 40, padding: 0, background: c.bg, cursor: 'pointer',
            boxShadow: searchHover ? shadow.cardHover : shadow.card,
            transition: `box-shadow 200ms ${ease}`,
          }}
        >
          {['Anywhere', 'Any week', 'Add guests'].map((text, i) => (
            <span key={text} style={{
              padding: '14px 20px', fontSize: 14, fontWeight: i < 2 ? 600 : 400,
              fontFamily: font.sans, color: i < 2 ? c.heading : c.muted,
              borderRight: i < 2 ? `1px solid ${c.borderSubtle}` : 'none',
              whiteSpace: 'nowrap',
            }}>
              {text}
            </span>
          ))}
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 8, flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </button>

        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{
            fontSize: 14, fontWeight: 600, fontFamily: font.sans, color: c.heading, cursor: 'pointer',
          }}>
            Become a host
          </span>
          <button
            onMouseEnter={() => setProfileHover(true)}
            onMouseLeave={() => setProfileHover(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              border: `1px solid ${c.border}`, borderRadius: 24,
              padding: '6px 6px 6px 14px', background: c.bg, cursor: 'pointer',
              boxShadow: profileHover ? shadow.card : 'none',
              transition: `box-shadow 200ms ${ease}`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
            <div style={{
              width: 30, height: 30, borderRadius: 15, background: c.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

// ---- Photo Grid ----

function PhotoGrid() {
  const [showAllHover, setShowAllHover] = useState(false);

  const photos: { bg: string; style?: CSSProperties }[] = [
    { bg: 'linear-gradient(135deg, #E8D5B7 0%, #D4B896 100%)', style: { gridRow: '1 / 3', gridColumn: '1 / 3' } },
    { bg: 'linear-gradient(135deg, #C4D4E0 0%, #A8BDD0 100%)' },
    { bg: 'linear-gradient(135deg, #D5C4A1 0%, #C2B08E 100%)' },
    { bg: 'linear-gradient(135deg, #B8C9D0 0%, #9BB4BF 100%)' },
    { bg: 'linear-gradient(135deg, #D0C4B0 0%, #BFB09A 100%)' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(2, 200px)', gap: 8, borderRadius: 16,
        overflow: 'hidden',
      }}>
        {photos.map((photo, i) => (
          <div key={i} style={{
            background: photo.bg, cursor: 'pointer',
            transition: `opacity 150ms ${ease}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...photo.style,
          }}>
            {i === 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: font.sans, fontWeight: 500 }}>
                  Living Room
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onMouseEnter={() => setShowAllHover(true)}
        onMouseLeave={() => setShowAllHover(false)}
        style={{
          position: 'absolute', bottom: 16, right: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', border: `1px solid ${c.heading}`,
          borderRadius: 8, background: showAllHover ? c.surfaceAlt : c.bg,
          fontSize: 13, fontWeight: 600, fontFamily: font.sans, color: c.heading,
          cursor: 'pointer', transition: `background 150ms ${ease}`,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
        Show all photos
      </button>
    </div>
  );
}

// ---- Guest Favorite Badge ----

function GuestFavoriteBadge() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '20px 24px', border: `1px solid ${c.borderSubtle}`, borderRadius: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 72 }}>
        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>Guest</span>
        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>favorite</span>
      </div>
      <div style={{ flex: 1, fontSize: 13, fontFamily: font.sans, color: c.body, lineHeight: 1.5 }}>
        One of the most loved homes on Staybnb, according to guests
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: font.sans, color: c.heading }}>4.94</div>
          <Stars rating={5} size={10} />
        </div>
        <div style={{ width: 1, height: 32, background: c.borderSubtle }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: font.sans, color: c.heading }}>878</div>
          <div style={{
            fontSize: 11, fontWeight: 600, fontFamily: font.sans, color: c.muted,
            textDecoration: 'underline',
          }}>Reviews</div>
        </div>
      </div>
    </div>
  );
}

// ---- Host Info ----

function HostInfo() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '24px 0', borderBottom: `1px solid ${c.borderSubtle}`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 22,
        background: 'linear-gradient(135deg, #8B5E3C 0%, #A67B5B 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 18, height: 18, borderRadius: 9, border: `2px solid ${c.bg}`,
          background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>
          Hosted by Sarah & Michael
        </div>
        <div style={{ fontSize: 14, fontFamily: font.sans, color: c.muted, marginTop: 2 }}>
          Superhost &middot; 6 years hosting
        </div>
      </div>
    </div>
  );
}

// ---- Feature Highlights ----

function Highlight({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '20px 0' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>{title}</div>
        <div style={{ fontSize: 14, fontFamily: font.sans, color: c.muted, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

function Highlights() {
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${c.borderSubtle}` }}>
      <Highlight
        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
        title="Entire home"
        desc="You'll have the guest suite to yourself."
      />
      <Highlight
        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>}
        title="Self check-in"
        desc="Check yourself in with the lockbox."
      />
      <Highlight
        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
        title="Free cancellation before Feb 26"
        desc="Get a full refund if you change your plans."
      />
    </div>
  );
}

// ---- Description ----

function Description() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ padding: '28px 0', borderBottom: `1px solid ${c.borderSubtle}` }}>
      <div style={{
        fontSize: 15, fontFamily: font.sans, color: c.body, lineHeight: 1.65,
        maxHeight: expanded ? 'none' : 80, overflow: 'hidden',
        position: 'relative',
      }}>
        <p style={{ margin: '0 0 12px' }}>
          Welcome to our charming guest suite in the heart of the Alberta Arts District.
          This beautifully designed space offers everything you need for a comfortable stay
          in one of Portland's most vibrant neighborhoods.
        </p>
        <p style={{ margin: 0 }}>
          The suite features a cozy bedroom with a premium queen mattress, a modern bathroom,
          and a small kitchenette. Step outside to find local coffee shops, restaurants,
          galleries, and boutiques all within walking distance.
        </p>
        {!expanded && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
            background: 'linear-gradient(transparent, white)',
          }} />
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', padding: 0, marginTop: 8,
          fontSize: 15, fontWeight: 600, fontFamily: font.sans, color: c.heading,
          cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        Show {expanded ? 'less' : 'more'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: `transform 200ms ${ease}` }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}

// ---- Amenities ----

function Amenity({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 15, fontFamily: font.sans, color: c.body }}>{label}</span>
    </div>
  );
}

function Amenities() {
  const [showAllHover, setShowAllHover] = useState(false);

  return (
    <div style={{ padding: '28px 0', borderBottom: `1px solid ${c.borderSubtle}` }}>
      <h2 style={{
        fontSize: 22, fontWeight: 600, fontFamily: font.sans, color: c.heading,
        margin: '0 0 20px', letterSpacing: '-0.01em',
      }}>
        What this place offers
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
        <Amenity
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>}
          label="Mountain view"
        />
        <Amenity
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M17 2l-5 5-5-5" /></svg>}
          label="Kitchen"
        />
        <Amenity
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><path d="M5 12.55a11 11 0 0114.08 0" /><path d="M1.42 9a16 16 0 0121.16 0" /><path d="M8.53 16.11a6 6 0 016.95 0" /><circle cx="12" cy="20" r="1" /></svg>}
          label="Wifi"
        />
        <Amenity
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>}
          label="Dedicated workspace"
        />
        <Amenity
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>}
          label="Free dryer &mdash; In unit"
        />
        <Amenity
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>}
          label="Carbon monoxide alarm"
        />
      </div>
      <button
        onMouseEnter={() => setShowAllHover(true)}
        onMouseLeave={() => setShowAllHover(false)}
        style={{
          marginTop: 20, padding: '12px 24px',
          border: `1px solid ${c.heading}`, borderRadius: 8,
          background: showAllHover ? c.surfaceAlt : c.bg,
          fontSize: 15, fontWeight: 600, fontFamily: font.sans, color: c.heading,
          cursor: 'pointer', transition: `background 150ms ${ease}`,
        }}
      >
        Show all 32 amenities
      </button>
    </div>
  );
}

// ---- Booking Card ----

function BookingCard() {
  const [reserveHover, setReserveHover] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div style={{
      position: 'sticky', top: 100, width: 372,
      border: `1px solid ${c.borderSubtle}`, borderRadius: 12,
      padding: '24px 24px 20px', background: c.bg,
      boxShadow: shadow.dropdown,
    }}>
      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontFamily: font.sans, color: c.muted, textDecoration: 'line-through' }}>$205</span>
        <span style={{ fontSize: 22, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>$177</span>
        <span style={{ fontSize: 15, fontFamily: font.sans, color: c.body }}>night</span>
      </div>

      {/* Date / Guest Input */}
      <div style={{
        border: `1px solid ${focusedField ? c.borderFocus : c.border}`,
        borderRadius: 8, overflow: 'hidden',
        transition: `border-color 150ms ${ease}`,
      }}>
        <div style={{ display: 'flex' }}>
          <div
            onClick={() => setFocusedField('checkin')}
            style={{
              flex: 1, padding: '10px 12px', cursor: 'pointer',
              borderRight: `1px solid ${c.border}`,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: font.sans, color: c.heading, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Check-in</div>
            <div style={{ fontSize: 14, fontFamily: font.sans, color: c.body, marginTop: 2 }}>2/27/2026</div>
          </div>
          <div
            onClick={() => setFocusedField('checkout')}
            style={{ flex: 1, padding: '10px 12px', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: font.sans, color: c.heading, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Checkout</div>
            <div style={{ fontSize: 14, fontFamily: font.sans, color: c.body, marginTop: 2 }}>3/1/2026</div>
          </div>
        </div>
        <div
          onClick={() => setFocusedField('guests')}
          style={{
            padding: '10px 12px', borderTop: `1px solid ${c.border}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: font.sans, color: c.heading, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Guests</div>
            <div style={{ fontSize: 14, fontFamily: font.sans, color: c.body, marginTop: 2 }}>1 guest</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.heading} strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Reserve Button */}
      <button
        onMouseEnter={() => setReserveHover(true)}
        onMouseLeave={() => setReserveHover(false)}
        style={{
          width: '100%', height: 48, marginTop: 16,
          background: reserveHover
            ? 'linear-gradient(135deg, #BD1E59 0%, #E31C5F 50%, #C21754 100%)'
            : c.gradient,
          border: 'none', borderRadius: 8,
          fontSize: 16, fontWeight: 600, fontFamily: font.sans, color: c.onPrimary,
          cursor: 'pointer',
          transform: reserveHover ? 'scale(1.01)' : 'scale(1)',
          transition: `transform 200ms ${ease}, background 200ms ${ease}`,
        }}
      >
        Reserve
      </button>

      <p style={{
        fontSize: 13, fontFamily: font.sans, color: c.muted, textAlign: 'center',
        margin: '12px 0 0',
      }}>
        You won't be charged yet
      </p>

      {/* Price Breakdown */}
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${c.borderSubtle}` }}>
        {[
          ['$177 x 2 nights', '$354'],
          ['Cleaning fee', '$45'],
          ['Service fee', '$56'],
        ].map(([label, amount]) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', padding: '4px 0',
          }}>
            <span style={{ fontSize: 15, fontFamily: font.sans, color: c.body, textDecoration: 'underline', textUnderlineOffset: 3 }}>{label}</span>
            <span style={{ fontSize: 15, fontFamily: font.sans, color: c.body }}>{amount}</span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', paddingTop: 16, marginTop: 16,
          borderTop: `1px solid ${c.borderSubtle}`,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>Total before taxes</span>
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>$455</span>
        </div>
      </div>
    </div>
  );
}

// ---- Review Summary ----

function ReviewCard({ name, date, text, avatar }: { name: string; date: string; text: string; avatar: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 20,
          background: avatar, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>{name}</div>
          <div style={{ fontSize: 13, fontFamily: font.sans, color: c.muted }}>{date}</div>
        </div>
      </div>
      <p style={{ fontSize: 15, fontFamily: font.sans, color: c.body, lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  );
}

function Reviews() {
  return (
    <div style={{ padding: '32px 0', borderBottom: `1px solid ${c.borderSubtle}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={c.heading} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span style={{ fontSize: 22, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>4.94</span>
        <span style={{ fontSize: 22, fontFamily: font.sans, color: c.heading }}>&middot;</span>
        <span style={{ fontSize: 22, fontWeight: 600, fontFamily: font.sans, color: c.heading, textDecoration: 'underline' }}>878 reviews</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
        <ReviewCard
          name="Jessica"
          date="January 2026"
          text="Absolutely loved our stay! The suite was spotless and beautifully decorated. The Alberta Arts neighborhood is incredible &mdash; so many great restaurants within walking distance."
          avatar="linear-gradient(135deg, #E8A87C 0%, #D4886A 100%)"
        />
        <ReviewCard
          name="David"
          date="December 2025"
          text="Perfect little getaway. The bed was incredibly comfortable and the self check-in was seamless. Sarah was super responsive and helpful with local recommendations."
          avatar="linear-gradient(135deg, #7BA7C4 0%, #6090AD 100%)"
        />
        <ReviewCard
          name="Mika"
          date="November 2025"
          text="A truly special place. Every detail was thoughtfully considered. We'll definitely be coming back on our next Portland trip."
          avatar="linear-gradient(135deg, #A8D4A0 0%, #8BC480 100%)"
        />
        <ReviewCard
          name="Thomas"
          date="October 2025"
          text="Great value for the price, especially with the free cancellation. The location in Alberta Arts can't be beat. Highly recommend!"
          avatar="linear-gradient(135deg, #C4A0D4 0%, #AD80C4 100%)"
        />
      </div>
    </div>
  );
}

// ---- Footer ----

function Footer() {
  const sections = [
    { title: 'Support', links: ['Help Center', 'AirCover', 'Safety information', 'Cancellation options'] },
    { title: 'Hosting', links: ['Staybnb your home', 'AirCover for Hosts', 'Resources', 'Community forum'] },
    { title: 'Staybnb', links: ['Newsroom', 'Learn about features', 'Careers', 'Investors'] },
  ];

  return (
    <footer style={{
      background: c.surfaceAlt, borderTop: `1px solid ${c.borderSubtle}`,
      padding: '48px 0 32px',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, fontFamily: font.sans, color: c.heading,
                margin: '0 0 16px',
              }}>
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.links.map((link) => (
                  <span key={link} style={{
                    fontSize: 14, fontFamily: font.sans, color: c.body, cursor: 'pointer',
                  }}>
                    {link}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          paddingTop: 24, borderTop: `1px solid ${c.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, fontFamily: font.sans, color: c.muted }}>
            &copy; 2026 Staybnb, Inc. &middot; Terms &middot; Sitemap &middot; Privacy
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>English (US)</span>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: font.sans, color: c.heading }}>$ USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---- Main Layout ----

export default function AirbnbSite() {
  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      fontFamily: font.sans, color: c.body, fontSize: 16, lineHeight: 1.5,
      background: c.bg,
      WebkitFontSmoothing: 'antialiased',
    }}>
      <TopBar />

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 40px 0' }}>
        {/* Title */}
        <h1 style={{
          fontSize: 26, fontWeight: 600, fontFamily: font.sans, color: c.heading,
          letterSpacing: '-0.01em', margin: '0 0 24px',
        }}>
          Attractive and Affordable Suite in Alberta Arts
        </h1>

        {/* Photo Grid */}
        <PhotoGrid />

        {/* Two-column: Details + Booking */}
        <div style={{
          display: 'flex', gap: 80, marginTop: 32, alignItems: 'flex-start',
        }}>
          {/* Left: Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Property basics */}
            <div style={{ borderBottom: `1px solid ${c.borderSubtle}`, paddingBottom: 24 }}>
              <h2 style={{
                fontSize: 22, fontWeight: 600, fontFamily: font.sans, color: c.heading,
                margin: '0 0 4px', letterSpacing: '-0.01em',
              }}>
                Entire guest suite in Portland, Oregon
              </h2>
              <p style={{ fontSize: 15, fontFamily: font.sans, color: c.body, margin: 0 }}>
                2 guests &middot; 1 bedroom &middot; 1 bed &middot; 1 bath
              </p>
            </div>

            <div style={{ margin: '16px 0' }}>
              <GuestFavoriteBadge />
            </div>

            <HostInfo />
            <Highlights />
            <Description />
            <Amenities />
            <Reviews />
          </div>

          {/* Right: Booking */}
          <div style={{ flexShrink: 0 }}>
            <BookingCard />
          </div>
        </div>
      </main>

      <div style={{ height: 48 }} />
      <Footer />
    </div>
  );
}
