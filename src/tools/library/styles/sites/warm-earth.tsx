import { useState, type CSSProperties } from 'react';

// ============================================================================
// Warm Earth — Reference Design
// A restaurant/artisan cafe website with organic, grounded aesthetic.
// Terracotta and amber on warm stone neutrals. Serif headings.
// Pure React + inline styles. No Tailwind, no external CSS.
// ============================================================================

// ---- Color Tokens (literal values) ----

const c = {
  // Surfaces
  bg: '#f5ede4',
  surface0: '#efe6db',
  surface1: '#e8ddd1',
  surface2: '#ddd0c2',
  surfaceWhite: '#faf6f1',
  surfaceHover: 'rgba(199, 123, 74, 0.06)',

  // Borders
  border: 'rgba(107, 74, 48, 0.12)',
  borderSubtle: 'rgba(107, 74, 48, 0.08)',
  borderAccent: 'rgba(199, 123, 74, 0.30)',

  // Text
  heading: '#2c2520',
  text: '#6b4a30',
  textSecondary: '#8a6e54',
  textTertiary: '#a89078',
  textLight: '#c4ad98',

  // Primary (terracotta)
  primary: '#c77b4a',
  primaryDark: '#a8623a',
  primaryDim: 'rgba(199, 123, 74, 0.12)',
  primaryGlow: 'rgba(199, 123, 74, 0.06)',

  // Secondary (amber)
  secondary: '#d4a043',
  secondaryDim: 'rgba(212, 160, 67, 0.12)',

  // Shadows
  shadowAmbient: 'rgba(107, 74, 48, 0.08)',
  shadowDirectional: 'rgba(107, 74, 48, 0.10)',
};

// ---- Typography ----

const font = {
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

// ---- Easing ----

const ease = 'cubic-bezier(0.25, 0, 0.15, 1)';
const transition = `120ms ${ease}`;

// ---- Decorative Divider ----

function Divider({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        ...style,
      }}
    >
      <div style={{ flex: 1, height: 1, background: c.border }} />
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2L10 6L14 8L10 10L8 14L6 10L2 8L6 6Z"
          fill={c.primary}
          opacity={0.35}
        />
      </svg>
      <div style={{ flex: 1, height: 1, background: c.border }} />
    </div>
  );
}

// ---- Nav Link ----

function NavLink({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: font.sans,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        color: hovered ? c.primary : c.text,
        textDecoration: 'none',
        transition: `color ${transition}`,
        cursor: 'pointer',
      }}
    >
      {children}
    </a>
  );
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

  const isPrimary = variant === 'primary';

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: font.sans,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        padding: '14px 32px',
        border: isPrimary ? 'none' : `1.5px solid ${c.primary}`,
        borderRadius: 2,
        cursor: 'pointer',
        transition: `all ${transition}`,
        ...(isPrimary
          ? {
              background: hovered ? c.primaryDark : c.primary,
              color: '#faf6f1',
            }
          : {
              background: hovered ? c.primaryDim : 'transparent',
              color: c.primary,
            }),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ---- Menu Item Card ----

interface MenuItem {
  name: string;
  description: string;
  price: string;
  tag?: string;
}

function MenuCard({ item }: { item: MenuItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.surfaceWhite,
        border: `1px solid ${hovered ? c.borderAccent : c.border}`,
        borderRadius: 4,
        padding: '32px 28px',
        transition: `all ${transition}`,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 4px 16px ${c.shadowAmbient}, 0 8px 24px ${c.shadowDirectional}`
          : `0 2px 8px ${c.shadowAmbient}`,
        position: 'relative' as const,
        overflow: 'hidden' as const,
      }}
    >
      {item.tag && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            fontFamily: font.sans,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: c.secondary,
            background: c.secondaryDim,
            padding: '3px 10px',
            borderRadius: 2,
          }}
        >
          {item.tag}
        </div>
      )}
      <h3
        style={{
          fontFamily: font.serif,
          fontSize: 21,
          fontWeight: 400,
          color: c.heading,
          margin: 0,
          marginBottom: 10,
          lineHeight: 1.3,
        }}
      >
        {item.name}
      </h3>
      <p
        style={{
          fontFamily: font.sans,
          fontSize: 15,
          color: c.textSecondary,
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 16,
        }}
      >
        {item.description}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: font.serif,
            fontSize: 19,
            fontWeight: 400,
            color: c.primary,
          }}
        >
          {item.price}
        </span>
        <div
          style={{
            width: 32,
            height: 1,
            background: c.border,
          }}
        />
      </div>
    </div>
  );
}

// ---- Section Heading ----

function SectionHeading({
  subtitle,
  title,
  style,
}: {
  subtitle?: string;
  title: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ textAlign: 'center' as const, ...style }}>
      {subtitle && (
        <div
          style={{
            fontFamily: font.sans,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: c.primary,
            marginBottom: 12,
          }}
        >
          {subtitle}
        </div>
      )}
      <h2
        style={{
          fontFamily: font.serif,
          fontSize: 36,
          fontWeight: 400,
          color: c.heading,
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

// ---- Info Card (for Hours/Location) ----

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: c.surfaceWhite,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        padding: '32px 28px',
        textAlign: 'center' as const,
        boxShadow: `0 2px 8px ${c.shadowAmbient}`,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: c.primaryDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: c.primary,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: font.serif,
          fontSize: 19,
          fontWeight: 400,
          color: c.heading,
          margin: '0 0 12px',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontFamily: font.sans,
          fontSize: 15,
          color: c.textSecondary,
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---- Top Bar ----

function TopBar() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 48px',
        borderBottom: `1px solid ${c.border}`,
        background: `${c.bg}ee`,
        backdropFilter: 'blur(8px)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <NavLink>Menu</NavLink>
        <NavLink>Story</NavLink>
      </div>

      {/* Restaurant Name */}
      <div
        style={{
          fontFamily: font.serif,
          fontSize: 24,
          fontWeight: 400,
          color: c.heading,
          letterSpacing: '0.02em',
        }}
      >
        Terra & Ember
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <NavLink>Hours</NavLink>
        <NavLink>Reserve</NavLink>
      </div>
    </header>
  );
}

// ---- Hero ----

function Hero() {
  return (
    <section
      style={{
        padding: '100px 48px 88px',
        textAlign: 'center' as const,
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          fontFamily: font.sans,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
          color: c.primary,
          marginBottom: 24,
        }}
      >
        Seasonal & Locally Sourced
      </div>
      <h1
        style={{
          fontFamily: font.serif,
          fontSize: 56,
          fontWeight: 400,
          color: c.heading,
          margin: '0 0 24px',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}
      >
        Farm to Table,
        <br />
        Heart to Plate
      </h1>
      <p
        style={{
          fontFamily: font.sans,
          fontSize: 17,
          color: c.textSecondary,
          lineHeight: 1.7,
          maxWidth: 520,
          margin: '0 auto 40px',
        }}
      >
        Every dish tells the story of the land it came from. We honor local
        farmers, seasonal rhythms, and the simple beauty of ingredients at
        their peak.
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Button>View Our Menu</Button>
        <Button variant="secondary">Reserve a Table</Button>
      </div>
    </section>
  );
}

// ---- Menu Highlights ----

const menuItems: MenuItem[] = [
  {
    name: 'Roasted Beet & Chevre Tartine',
    description:
      'Slow-roasted golden beets, whipped chevre, walnut gremolata, and wild arugula on house-baked sourdough.',
    price: '$18',
    tag: 'Seasonal',
  },
  {
    name: 'Braised Short Rib',
    description:
      'Grass-fed short rib braised in red wine and root vegetables, served over creamy polenta with herb oil.',
    price: '$34',
  },
  {
    name: 'Wood-Fired Market Vegetables',
    description:
      'Today\'s harvest, charred in our wood-burning oven with aged balsamic, smoked sea salt, and fresh herbs.',
    price: '$16',
    tag: 'Farm Fresh',
  },
  {
    name: 'Honey-Lavender Panna Cotta',
    description:
      'Local wildflower honey and Provencal lavender set in cream, topped with seasonal stone fruit compote.',
    price: '$14',
  },
];

function MenuHighlights() {
  return (
    <section
      style={{
        padding: '80px 48px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <SectionHeading
        subtitle="From Our Kitchen"
        title="Seasonal Highlights"
        style={{ marginBottom: 56 }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
        }}
      >
        {menuItems.map((item) => (
          <MenuCard key={item.name} item={item} />
        ))}
      </div>
      <div style={{ textAlign: 'center' as const, marginTop: 48 }}>
        <Button variant="secondary">See Full Menu</Button>
      </div>
    </section>
  );
}

// ---- About Section ----

function About() {
  return (
    <section
      style={{
        padding: '80px 48px',
        background: c.surface0,
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          textAlign: 'center' as const,
        }}
      >
        <SectionHeading
          subtitle="Our Story"
          title="Rooted in Tradition"
          style={{ marginBottom: 36 }}
        />
        <Divider style={{ marginBottom: 36, maxWidth: 200, margin: '0 auto 36px' }} />
        <p
          style={{
            fontFamily: font.sans,
            fontSize: 17,
            color: c.textSecondary,
            lineHeight: 1.75,
            marginBottom: 24,
          }}
        >
          Terra & Ember was born from a simple belief: that great food starts in
          the soil. Our founder spent years traveling through the countryside,
          learning from farmers, foragers, and home cooks who understood that the
          best meals don't need to be complicated &mdash; they need to be honest.
        </p>
        <p
          style={{
            fontFamily: font.sans,
            fontSize: 17,
            color: c.textSecondary,
            lineHeight: 1.75,
            marginBottom: 32,
          }}
        >
          Today, we partner with over a dozen local farms within 50 miles of our
          kitchen. Our menu changes with the seasons, and our chefs treat every
          ingredient with the care it deserves. From the wood-fired hearth to your
          table, every plate carries the warmth of the earth it came from.
        </p>
        <div
          style={{
            fontFamily: font.serif,
            fontSize: 19,
            fontStyle: 'italic' as const,
            color: c.primary,
            lineHeight: 1.5,
          }}
        >
          &ldquo;Cook with the seasons. Eat with gratitude.&rdquo;
        </div>
      </div>
    </section>
  );
}

// ---- Hours & Location ----

function HoursLocation() {
  return (
    <section
      style={{
        padding: '80px 48px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <SectionHeading
        subtitle="Visit Us"
        title="Hours & Location"
        style={{ marginBottom: 56 }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
      >
        <InfoCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          title="Hours"
        >
          <div>Tuesday &ndash; Thursday: 5pm &ndash; 10pm</div>
          <div>Friday &ndash; Saturday: 5pm &ndash; 11pm</div>
          <div>Sunday Brunch: 10am &ndash; 2pm</div>
          <div style={{ color: c.textTertiary, marginTop: 8, fontSize: 13 }}>
            Closed Mondays
          </div>
        </InfoCard>

        <InfoCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
          title="Location"
        >
          <div>248 Willow Creek Road</div>
          <div>Ashland, Oregon 97520</div>
          <div style={{ color: c.primary, marginTop: 12, fontSize: 14, fontWeight: 500 }}>
            Get Directions
          </div>
        </InfoCard>

        <InfoCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          }
          title="Reservations"
        >
          <div>(541) 482-3200</div>
          <div style={{ marginTop: 4 }}>hello@terraandember.com</div>
          <div style={{ color: c.primary, marginTop: 12, fontSize: 14, fontWeight: 500 }}>
            Book Online
          </div>
        </InfoCard>
      </div>
    </section>
  );
}

// ---- Footer ----

function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const links = ['Menu', 'Story', 'Reservations', 'Private Events', 'Gift Cards'];

  return (
    <footer
      style={{
        padding: '48px 48px 32px',
        borderTop: `1px solid ${c.border}`,
        background: c.surface0,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 40,
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: font.serif,
                fontSize: 22,
                color: c.heading,
                marginBottom: 8,
              }}
            >
              Terra & Ember
            </div>
            <div
              style={{
                fontFamily: font.sans,
                fontSize: 14,
                color: c.textTertiary,
                lineHeight: 1.6,
              }}
            >
              Seasonal. Local. Honest.
            </div>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', gap: 28 }}>
            {links.map((link) => (
              <a
                key={link}
                href="#"
                onClick={(e) => e.preventDefault()}
                onMouseEnter={() => setHoveredLink(link)}
                onMouseLeave={() => setHoveredLink(null)}
                style={{
                  fontFamily: font.sans,
                  fontSize: 14,
                  color: hoveredLink === link ? c.primary : c.textSecondary,
                  textDecoration: 'none',
                  transition: `color ${transition}`,
                }}
              >
                {link}
              </a>
            ))}
          </nav>
        </div>

        <Divider style={{ marginBottom: 24 }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: font.sans,
              fontSize: 12,
              color: c.textLight,
            }}
          >
            &copy; 2026 Terra & Ember. All rights reserved.
          </div>
          <div
            style={{
              fontFamily: font.sans,
              fontSize: 12,
              color: c.textLight,
            }}
          >
            248 Willow Creek Road, Ashland, OR
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---- Main Layout ----

export default function WarmEarthSite() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: c.bg,
        color: c.text,
        fontFamily: font.sans,
        fontSize: 17,
        lineHeight: 1.55,
        position: 'relative',
      }}
    >
      <TopBar />
      <Hero />
      <Divider
        style={{
          maxWidth: 240,
          margin: '0 auto',
        }}
      />
      <MenuHighlights />
      <About />
      <HoursLocation />
      <Footer />
    </div>
  );
}
