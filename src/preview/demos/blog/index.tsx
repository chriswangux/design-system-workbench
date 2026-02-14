/**
 * Blog / Content Demo
 * Exercises: reading typography, generous spacing, contrast, minimal color
 * All visual properties use CSS custom properties from the token bridge.
 */

import { useState, useEffect, useCallback } from 'react';
import { m, FadeIn, ScaleIn, SlideIn } from '../shared/motion';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ARTICLE = {
  title: 'The Case for Procedural Design Tokens',
  subtitle: 'Why deriving every value from math produces more coherent systems than hand-picking them',
  author: {
    name: 'Elena Vasquez',
    role: 'Design Systems Engineer',
    bio: 'Elena builds tooling at the intersection of design and engineering. She has spent the last decade working on design systems at scale, from component libraries to token infrastructure. She writes about the craft of systematic design.',
    avatar: null as null, // We'll render initials
  },
  date: 'February 10, 2026',
  readingTime: '8 min read',
  tags: ['Design Systems', 'Tokens', 'Engineering'],
};

const RELATED_ARTICLES = [
  {
    title: 'Building a Type Scale from First Principles',
    excerpt:
      'How a single ratio and a base size can generate an entire typographic system that feels intentional at every level.',
    date: 'Jan 28, 2026',
    tag: 'Typography',
  },
  {
    title: 'Color Spaces Matter More Than You Think',
    excerpt:
      'OKLCH gives us perceptual uniformity. Here is why that changes everything about palette generation and accessibility.',
    date: 'Jan 15, 2026',
    tag: 'Color',
  },
  {
    title: 'Undo/Redo in Complex State Machines',
    excerpt:
      'Implementing robust history in a design tool requires more than a stack. We explore Immer, structural sharing, and selective snapshotting.',
    date: 'Dec 30, 2025',
    tag: 'Engineering',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Initials({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--sem-primary, #3b82f6)',
        color: 'var(--sem-primary-foreground, #ffffff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
        fontWeight: 600,
        fontSize: size * 0.4,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    const container = document.querySelector('[data-blog-scroll]');
    if (container) {
      const onScroll = () => setScrolled(container.scrollTop > 10);
      container.addEventListener('scroll', onScroll, { passive: true });
      return () => container.removeEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const linkStyle: React.CSSProperties = {
    color: 'var(--sem-muted-foreground, #6b7280)',
    textDecoration: 'none',
    fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
    fontWeight: 500,
    transition: `color ${m.durationFast} ${m.easingStandard}`,
  };

  return (
    <nav
      style={{
        borderBottom: '1px solid var(--sem-border, #e5e7eb)',
        backgroundColor: 'var(--sem-background, #ffffff)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none',
        transition: `box-shadow ${m.durationNormal} ${m.easingStandard}`,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: 'var(--spacing-400, 1rem) var(--spacing-600, 1.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a
          href="#"
          style={{
            fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
            fontSize: 'var(--typography-fontSize-lg, 1.25rem)',
            fontWeight: 700,
            color: 'var(--sem-foreground, #111827)',
            textDecoration: 'none',
            letterSpacing: '-0.025em',
          }}
        >
          the token post
        </a>

        <div style={{ display: 'flex', gap: 'var(--spacing-600, 1.5rem)', alignItems: 'center' }}>
          {['Home', 'About', 'Archive', 'Newsletter'].map((label) => (
            <a key={label} href="#" style={linkStyle}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function ArticleHeader() {
  return (
    <header style={{ marginBottom: 'var(--spacing-800, 2rem)' }}>
      {/* Tags */}
      <FadeIn delay={0} distance={12}>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-200, 0.5rem)',
            marginBottom: 'var(--spacing-600, 1.5rem)',
            flexWrap: 'wrap',
          }}
        >
          {ARTICLE.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                padding: '0.2em 0.7em',
                fontSize: 'var(--typography-fontSize-sm, 0.75rem)',
                fontWeight: 600,
                fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
                color: 'var(--sem-primary, #3b82f6)',
                backgroundColor: 'var(--sem-secondary, #3b82f610)',
                borderRadius: 9999,
                letterSpacing: '0.02em',
                textTransform: 'uppercase' as const,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </FadeIn>

      {/* Title */}
      <FadeIn delay={80} distance={12}>
        <h1
          style={{
            fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
            fontSize: 'var(--typography-fontSize-3xl, 2.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--sem-foreground, #111827)',
            margin: 0,
            marginBottom: 'var(--spacing-400, 1rem)',
          }}
        >
          {ARTICLE.title}
        </h1>
      </FadeIn>

      {/* Subtitle */}
      <FadeIn delay={160} distance={12}>
        <p
          style={{
            fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
            fontSize: 'var(--typography-fontSize-xl, 1.5rem)',
            fontWeight: 400,
            lineHeight: 'var(--typography-lineHeight-base, 1.6)',
            color: 'var(--sem-muted-foreground, #6b7280)',
            margin: 0,
            marginBottom: 'var(--spacing-800, 2rem)',
          }}
        >
          {ARTICLE.subtitle}
        </p>
      </FadeIn>

      {/* Author row */}
      <FadeIn delay={240} distance={12}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-400, 1rem)',
            paddingBottom: 'var(--spacing-800, 2rem)',
            borderBottom: '1px solid var(--sem-border, #e5e7eb)',
          }}
        >
          <Initials name={ARTICLE.author.name} size={44} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
                fontWeight: 600,
                fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                color: 'var(--sem-foreground, #111827)',
              }}
            >
              {ARTICLE.author.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
                fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                color: 'var(--sem-muted-foreground, #6b7280)',
              }}
            >
              {ARTICLE.date} &middot; {ARTICLE.readingTime}
            </div>
          </div>
        </div>
      </FadeIn>
    </header>
  );
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 'var(--spacing-200, 0.5rem)',
          right: 'var(--spacing-200, 0.5rem)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3em',
          padding: '0.3em 0.7em',
          fontSize: 'var(--typography-fontSize-xs, 0.75rem)',
          fontWeight: 600,
          fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
          color: copied ? '#22c55e' : 'var(--sem-muted-foreground, #6b7280)',
          backgroundColor: 'var(--sem-background, #ffffff)',
          border: `1px solid ${copied ? '#22c55e' : 'var(--sem-border, #e5e7eb)'}`,
          borderRadius: 6,
          cursor: 'pointer',
          transition: `color ${m.durationFast} ${m.easingStandard}, border-color ${m.durationFast} ${m.easingStandard}, background-color ${m.durationFast} ${m.easingStandard}`,
          zIndex: 1,
        }}
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          'Copy'
        )}
      </button>
      <pre
        style={{
          fontFamily: 'var(--sem-font-mono, JetBrains Mono, monospace)',
          fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
          lineHeight: 1.7,
          backgroundColor: 'var(--sem-secondary, #f3f4f6)',
          color: 'var(--sem-foreground, #111827)',
          padding: 'var(--spacing-600, 1.5rem)',
          borderRadius: 8,
          overflowX: 'auto',
          margin: 0,
          marginBottom: 'var(--spacing-600, 1.5rem)',
          border: '1px solid var(--sem-border, #e5e7eb)',
        }}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

function ArticleBody() {
  const paragraphStyle: React.CSSProperties = {
    fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
    fontSize: 'var(--typography-fontSize-base, 1.0625rem)',
    lineHeight: 'var(--typography-lineHeight-base, 1.75)',
    color: 'var(--sem-foreground, #111827)',
    margin: 0,
    marginBottom: 'var(--spacing-600, 1.5rem)',
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
    fontSize: 'var(--typography-fontSize-xl, 1.5rem)',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
    color: 'var(--sem-foreground, #111827)',
    margin: 0,
    marginTop: 'var(--spacing-1000, 2.5rem)',
    marginBottom: 'var(--spacing-400, 1rem)',
  };

  return (
    <div>
      {/* Paragraph 1 */}
      <FadeIn distance={10}>
        <p style={paragraphStyle}>
          Most design systems are born the same way. A designer opens a tool, picks a blue that
          &ldquo;feels right,&rdquo; then nudges the lightness up and down a few times to build a
          palette. Spacing gets rounded to multiples of four or eight because someone read an article
          about it once. Type sizes follow a list copied from another system. The result works, until
          it doesn&rsquo;t. One day a new surface color is needed, and nothing in the existing palette
          quite fits. A component needs a 14px gap, but the scale jumps from 12 to 16. The system
          frays at the edges because it was never generated from a coherent set of rules&mdash;it was
          assembled from individual judgment calls.
        </p>
      </FadeIn>

      {/* Paragraph 2 */}
      <FadeIn distance={10}>
        <p style={paragraphStyle}>
          The alternative is <strong>procedural generation</strong>. Instead of hand-picking values,
          you define the <em>parameters</em> that produce them: a bezier curve that maps lightness
          across a color ramp, a modular ratio that generates a type scale, a spring constant that
          governs easing curves. Every token in the system becomes a function of these inputs. Change
          the curve, and every shade recalculates. Change the ratio, and every heading and body size
          adjusts in concert. The system stays internally consistent because the math enforces it.
        </p>
      </FadeIn>

      {/* Subheading */}
      <FadeIn distance={10}>
        <h2 style={headingStyle}>Why math beats intuition at scale</h2>
      </FadeIn>

      {/* Paragraph 3 */}
      <FadeIn distance={10}>
        <p style={paragraphStyle}>
          The human eye is remarkably good at judging <em>relative</em> harmony but unreliable at
          maintaining <em>absolute</em> consistency. When you hand-pick fifty color values across
          light and dark themes, you introduce micro-inconsistencies that compound. One ramp might
          have even perceptual steps; another might bunch up in the midtones. Procedural systems
          eliminate this class of error entirely. A single bezier curve guarantees that the perceptual
          distance between each step is intentional, not accidental. Here is what that looks like in
          practice:
        </p>
      </FadeIn>

      {/* Code Block */}
      <FadeIn distance={12}>
        <CodeBlock>{`// Define the curve, not the colors
const lightnessRamp = bezier([0.05, 0.0], [0.35, 0.45], [0.7, 0.85], [0.98, 1.0]);

// Generate 11 stops from a single hue + chroma
function generatePalette(hue: number, chroma: number) {
  return Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    const L = lightnessRamp(t);
    return oklch(L, chroma * (1 - Math.pow(2 * t - 1, 2)), hue);
  });
}`}</CodeBlock>
      </FadeIn>

      {/* Paragraph 4 */}
      <FadeIn distance={10}>
        <p style={paragraphStyle}>
          Notice that nowhere in this code do we specify a hex value. The palette is defined by three
          inputs&mdash;hue, chroma, and a bezier curve&mdash;and every value follows from those. If
          accessibility testing reveals that the 400-step lacks contrast, you adjust the curve and
          every stop recalculates. No manual re-picking. No drift.
        </p>
      </FadeIn>

      {/* Blockquote */}
      <SlideIn from="left" distance={24}>
        <blockquote
          style={{
            borderLeft: '3px solid var(--sem-primary, #3b82f6)',
            margin: 0,
            marginBottom: 'var(--spacing-600, 1.5rem)',
            marginTop: 'var(--spacing-800, 2rem)',
            padding: 'var(--spacing-400, 1rem) var(--spacing-600, 1.5rem)',
            backgroundColor: 'var(--sem-secondary, #f9fafb)',
            borderRadius: '0 6px 6px 0',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
              fontSize: 'var(--typography-fontSize-lg, 1.25rem)',
              fontStyle: 'italic',
              lineHeight: 'var(--typography-lineHeight-base, 1.7)',
              color: 'var(--sem-foreground, #111827)',
              margin: 0,
              marginBottom: 'var(--spacing-200, 0.5rem)',
            }}
          >
            &ldquo;A design system is not a collection of assets. It is the set of rules that
            generate those assets. When you ship the rules instead of the results, every product team
            inherits the system&rsquo;s intelligence, not just its output.&rdquo;
          </p>
          <cite
            style={{
              fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
              fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
              fontStyle: 'normal',
              color: 'var(--sem-muted-foreground, #6b7280)',
            }}
          >
            &mdash; Jina Anne, Design Tokens Community Group
          </cite>
        </blockquote>
      </SlideIn>

      {/* Subheading 2 */}
      <FadeIn distance={10}>
        <h2 style={headingStyle}>The benefits compound</h2>
      </FadeIn>

      {/* Paragraph 5 */}
      <FadeIn distance={10}>
        <p style={paragraphStyle}>
          Once you commit to a procedural approach, other capabilities emerge naturally. Because
          tokens are functions of parameters, you can:
        </p>
      </FadeIn>

      {/* Bulleted list */}
      <FadeIn distance={10}>
        <ul
          style={{
            fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
            fontSize: 'var(--typography-fontSize-base, 1.0625rem)',
            lineHeight: 'var(--typography-lineHeight-base, 1.75)',
            color: 'var(--sem-foreground, #111827)',
            paddingLeft: 'var(--spacing-600, 1.5rem)',
            margin: 0,
            marginBottom: 'var(--spacing-600, 1.5rem)',
          }}
        >
          <li style={{ marginBottom: 'var(--spacing-200, 0.5rem)' }}>
            <strong>Derive dark themes algorithmically</strong> by inverting the lightness curve and
            adjusting chroma to maintain contrast ratios
          </li>
          <li style={{ marginBottom: 'var(--spacing-200, 0.5rem)' }}>
            <strong>Generate responsive spacing</strong> from a single scale factor that adapts to
            viewport width
          </li>
          <li style={{ marginBottom: 'var(--spacing-200, 0.5rem)' }}>
            <strong>Run accessibility audits at generation time</strong> rather than after the fact,
            catching contrast failures before any component is built
          </li>
          <li style={{ marginBottom: 'var(--spacing-200, 0.5rem)' }}>
            <strong>Version the system as parameters</strong>, not as hundreds of individual values,
            making diffs meaningful and reviews tractable
          </li>
        </ul>
      </FadeIn>

      {/* Closing paragraph */}
      <FadeIn distance={10}>
        <p style={paragraphStyle}>
          The shift is philosophical as much as technical. You stop asking &ldquo;what value should
          this token have?&rdquo; and start asking &ldquo;what rule should govern this category of
          tokens?&rdquo; The answer is almost always some form of interpolation: a curve through
          color space, a geometric progression for sizes, a physics simulation for motion. The tools
          we build should make those curves visible and editable. That is the promise of a procedural
          design system workbench&mdash;not a bigger library of hand-picked values, but a smaller set
          of powerful controls that generate everything else.
        </p>
      </FadeIn>
    </div>
  );
}

function HorizontalRule() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--sem-border, #e5e7eb)',
        margin: 'var(--spacing-1000, 2.5rem) 0',
      }}
    />
  );
}

function AuthorBio() {
  return (
    <ScaleIn>
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-600, 1.5rem)',
          alignItems: 'flex-start',
          padding: 'var(--spacing-600, 1.5rem)',
          backgroundColor: 'var(--sem-secondary, #f9fafb)',
          borderRadius: 12,
          border: '1px solid var(--sem-border, #e5e7eb)',
        }}
      >
        <Initials name={ARTICLE.author.name} size={56} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
              fontWeight: 700,
              fontSize: 'var(--typography-fontSize-base, 1rem)',
              color: 'var(--sem-foreground, #111827)',
              marginBottom: 2,
            }}
          >
            {ARTICLE.author.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
              fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
              color: 'var(--sem-primary, #3b82f6)',
              fontWeight: 500,
              marginBottom: 'var(--spacing-200, 0.5rem)',
            }}
          >
            {ARTICLE.author.role}
          </div>
          <p
            style={{
              fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
              fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
              lineHeight: 1.65,
              color: 'var(--sem-muted-foreground, #6b7280)',
              margin: 0,
            }}
          >
            {ARTICLE.author.bio}
          </p>
        </div>
      </div>
    </ScaleIn>
  );
}

function RelatedArticles() {
  return (
    <section>
      <FadeIn distance={10}>
        <h2
          style={{
            fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
            fontSize: 'var(--typography-fontSize-xl, 1.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--sem-foreground, #111827)',
            margin: 0,
            marginBottom: 'var(--spacing-600, 1.5rem)',
          }}
        >
          Related Articles
        </h2>
      </FadeIn>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-600, 1.5rem)',
        }}
      >
        {RELATED_ARTICLES.map((article, i) => (
          <FadeIn key={article.title} delay={i * 100} distance={14}>
            <a
              href="#"
              style={{
                display: 'block',
                textDecoration: 'none',
                padding: 'var(--spacing-600, 1.5rem)',
                borderRadius: 10,
                border: '1px solid var(--sem-border, #e5e7eb)',
                backgroundColor: 'var(--sem-background, #ffffff)',
                transition: `box-shadow ${m.durationNormal} ${m.easingStandard}, border-color ${m.durationNormal} ${m.easingStandard}, transform ${m.durationNormal} ${m.easingStandard}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 4px 24px rgba(0,0,0,0.06)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'var(--sem-primary, #3b82f6)';
                (e.currentTarget as HTMLElement).style.transform =
                  'perspective(600px) rotateY(2deg) rotateX(-1deg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'var(--sem-border, #e5e7eb)';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  color: 'var(--sem-primary, #3b82f6)',
                  marginBottom: 'var(--spacing-200, 0.5rem)',
                }}
              >
                {article.tag}
              </span>

              <h3
                style={{
                  fontFamily: 'var(--sem-font-heading, Inter, system-ui, sans-serif)',
                  fontSize: 'var(--typography-fontSize-base, 1rem)',
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: 'var(--sem-foreground, #111827)',
                  margin: 0,
                  marginBottom: 'var(--spacing-200, 0.5rem)',
                }}
              >
                {article.title}
              </h3>

              <p
                style={{
                  fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
                  fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
                  lineHeight: 1.6,
                  color: 'var(--sem-muted-foreground, #6b7280)',
                  margin: 0,
                  marginBottom: 'var(--spacing-400, 1rem)',
                }}
              >
                {article.excerpt}
              </p>

              <time
                style={{
                  fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
                  fontSize: '0.75rem',
                  color: 'var(--sem-muted-foreground, #9ca3af)',
                }}
              >
                {article.date}
              </time>
            </a>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const linkStyle: React.CSSProperties = {
    color: 'var(--sem-muted-foreground, #6b7280)',
    textDecoration: 'none',
    fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
  };

  return (
    <footer
      style={{
        borderTop: '1px solid var(--sem-border, #e5e7eb)',
        marginTop: 'var(--spacing-1000, 2.5rem)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: 'var(--spacing-800, 2rem) var(--spacing-600, 1.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--spacing-400, 1rem)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
            fontSize: 'var(--typography-fontSize-sm, 0.875rem)',
            color: 'var(--sem-muted-foreground, #9ca3af)',
          }}
        >
          &copy; 2026 the token post. All rights reserved.
        </span>

        <div style={{ display: 'flex', gap: 'var(--spacing-600, 1.5rem)' }}>
          {['Twitter', 'GitHub', 'RSS', 'Privacy'].map((label) => (
            <a key={label} href="#" style={linkStyle}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BlogDemo() {
  return (
    <div
      style={{
        fontFamily: 'var(--sem-font-body, Inter, system-ui, sans-serif)',
        color: 'var(--sem-foreground, #111827)',
        backgroundColor: 'var(--sem-background, #ffffff)',
        minHeight: '100vh',
        WebkitFontSmoothing: 'antialiased' as string,
        MozOsxFontSmoothing: 'grayscale' as string,
      }}
    >
      <Navbar />

      {/* Article container -- centered narrow column */}
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'var(--spacing-1000, 2.5rem) var(--spacing-600, 1.5rem)',
        }}
      >
        <ArticleHeader />
        <ArticleBody />
        <HorizontalRule />
        <AuthorBio />
      </main>

      {/* Related articles -- slightly wider */}
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '0 var(--spacing-600, 1.5rem) var(--spacing-1000, 2.5rem)',
        }}
      >
        <HorizontalRule />
        <RelatedArticles />
      </div>

      <Footer />
    </div>
  );
}
