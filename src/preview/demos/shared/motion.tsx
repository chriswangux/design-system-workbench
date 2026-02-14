import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// ---- Replay context ----
// When replayKey changes, all entrance animations re-trigger.
// The provider manages the centralized reset-then-show sequence.

interface ReplayState {
  /** Increments on each replay trigger */
  key: number;
  /** True = force all elements visible (bypass IntersectionObserver) */
  forceVisible: boolean;
}

const ReplayContext = createContext<ReplayState>({ key: 0, forceVisible: false });

export function ReplayProvider({ replayKey, children }: { replayKey: number; children: ReactNode }) {
  const [forceVisible, setForceVisible] = useState(false);
  const prevKey = useRef(replayKey);

  useEffect(() => {
    if (replayKey > 0 && replayKey !== prevKey.current) {
      prevKey.current = replayKey;

      // Step 1: Hide everything
      setForceVisible(false);

      // Step 2: Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

      // Step 3: After a brief pause (elements go to opacity:0), force ALL visible
      const timer = setTimeout(() => {
        setForceVisible(true);
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [replayKey]);

  return (
    <ReplayContext.Provider value={{ key: replayKey, forceVisible }}>
      {children}
    </ReplayContext.Provider>
  );
}

function useReplayState(): ReplayState {
  return useContext(ReplayContext);
}

// ---- Motion token references ----

export const m = {
  easingStandard: 'var(--motion-easing-standard, cubic-bezier(0.2, 0, 0, 1))',
  easingEntrance: 'var(--motion-easing-entrance, cubic-bezier(0, 0, 0, 1))',
  easingExit: 'var(--motion-easing-exit, cubic-bezier(0.3, 0, 1, 1))',
  easingSpring: 'var(--motion-easing-spring, cubic-bezier(0.34, 1.56, 0.64, 1))',
  durationInstant: 'var(--motion-duration-instant, 100ms)',
  durationFast: 'var(--motion-duration-fast, 150ms)',
  durationNormal: 'var(--motion-duration-normal, 225ms)',
  durationSlow: 'var(--motion-duration-slow, 337ms)',
};

// ---- useInView hook ----

export function useInView(options?: { threshold?: number; once?: boolean }): [
  ref: React.RefObject<HTMLDivElement | null>,
  inView: boolean,
] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const { threshold = 0.15, once = true } = options ?? {};
  const replay = useReplayState();

  // Replay: centralized force-visible from provider
  useEffect(() => {
    if (replay.key > 0) {
      if (replay.forceVisible) {
        setInView(true);
      } else {
        setInView(false);
      }
    }
  }, [replay.key, replay.forceVisible]);

  // Normal scroll-triggered entrance (initial page load only)
  useEffect(() => {
    if (replay.key > 0) return; // Skip observer during/after replay

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, replay.key]);

  return [ref, inView];
}

// ---- FadeIn component ----

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  spring?: boolean;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'span' | 'li' | 'article' | 'header' | 'footer';
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  distance = 16,
  spring = false,
  style,
  as: Tag = 'div',
  className,
}: FadeInProps) {
  const [ref, inView] = useInView();

  // Use the standard easing (which reflects whatever the user set in DSW -- bezier OR spring)
  const easing = spring ? m.easingSpring : m.easingStandard;

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity ${m.durationSlow} ${easing} ${delay}ms, transform ${m.durationSlow} ${easing} ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// ---- ScaleIn component ----

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

export function ScaleIn({ children, delay = 0, style, className }: ScaleInProps) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'scale(1)' : 'scale(0.95)',
        transition: `opacity ${m.durationSlow} ${m.easingStandard} ${delay}ms, transform ${m.durationSlow} ${m.easingStandard} ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---- SlideIn component ----

interface SlideInProps {
  children: ReactNode;
  delay?: number;
  from?: 'left' | 'right' | 'bottom';
  distance?: number;
  style?: CSSProperties;
  className?: string;
}

export function SlideIn({ children, delay = 0, from = 'bottom', distance = 20, style, className }: SlideInProps) {
  const [ref, inView] = useInView();

  const translateMap = {
    left: `translateX(-${distance}px)`,
    right: `translateX(${distance}px)`,
    bottom: `translateY(${distance}px)`,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate(0)' : translateMap[from],
        transition: `opacity ${m.durationSlow} ${m.easingStandard} ${delay}ms, transform ${m.durationSlow} ${m.easingStandard} ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---- StaggerChildren: wraps children with incremental delays ----

interface StaggerProps {
  children: ReactNode[];
  baseDelay?: number;
  staggerDelay?: number;
  distance?: number;
  style?: CSSProperties;
  className?: string;
}

export function Stagger({ children, baseDelay = 0, staggerDelay = 80, distance = 16, style, className }: StaggerProps) {
  const [ref, inView] = useInView();

  return (
    <div ref={ref} style={style} className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : `translateY(${distance}px)`,
            transition: `opacity ${m.durationNormal} ${m.easingStandard} ${baseDelay + i * staggerDelay}ms, transform ${m.durationNormal} ${m.easingStandard} ${baseDelay + i * staggerDelay}ms`,
            willChange: 'opacity, transform',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ---- AnimatedNumber: counts up to a target value ----

export function AnimatedNumber({ value, duration = 1200 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const [ref, inView] = useInView();
  const animationId = useRef(0);
  const replay = useReplayState();

  useEffect(() => {
    if (!inView) {
      // Reset to starting value when not visible (for replay)
      setDisplay(value.replace(/[\d,.]+/, (match) => {
        return match.includes(',') ? '0' : '0';
      }));
      return;
    }

    // Extract numeric part and prefix/suffix
    const match = value.match(/^([^0-9]*)([\d,.]+)(.*)$/);
    if (!match) { setDisplay(value); return; }

    const prefix = match[1];
    const numStr = match[2];
    const suffix = match[3];
    const hasCommas = numStr.includes(',');
    const target = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(target)) { setDisplay(value); return; }

    const id = ++animationId.current;
    const startTime = performance.now();

    function tick(now: number) {
      if (id !== animationId.current) return; // Cancelled
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      const formatted = hasCommas ? current.toLocaleString() : String(current);
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    return () => { animationId.current++; }; // Cancel on unmount/re-run
  }, [inView, value, duration, replay.key]);

  return <span ref={ref as React.RefObject<HTMLSpanElement>}>{display}</span>;
}
