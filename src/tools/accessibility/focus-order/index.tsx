import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';

type LayoutTemplate = 'login-form' | 'navigation-bar' | 'card-grid' | 'modal-dialog' | 'settings-page';

interface FocusableElement {
  id: string;
  label: string;
  type: 'button' | 'input' | 'link' | 'select' | 'checkbox' | 'textarea';
  order: number;
}

interface LayoutDef {
  id: LayoutTemplate;
  name: string;
  elements: FocusableElement[];
}

const LAYOUTS: LayoutDef[] = [
  {
    id: 'login-form',
    name: 'Login Form',
    elements: [
      { id: 'email', label: 'Email', type: 'input', order: 1 },
      { id: 'password', label: 'Password', type: 'input', order: 2 },
      { id: 'remember', label: 'Remember me', type: 'checkbox', order: 3 },
      { id: 'forgot', label: 'Forgot password?', type: 'link', order: 4 },
      { id: 'login', label: 'Log In', type: 'button', order: 5 },
      { id: 'signup', label: 'Sign Up', type: 'link', order: 6 },
    ],
  },
  {
    id: 'navigation-bar',
    name: 'Navigation Bar',
    elements: [
      { id: 'skip', label: 'Skip to content', type: 'link', order: 1 },
      { id: 'logo', label: 'Logo / Home', type: 'link', order: 2 },
      { id: 'nav-products', label: 'Products', type: 'link', order: 3 },
      { id: 'nav-pricing', label: 'Pricing', type: 'link', order: 4 },
      { id: 'nav-docs', label: 'Docs', type: 'link', order: 5 },
      { id: 'search', label: 'Search', type: 'input', order: 6 },
      { id: 'profile', label: 'Profile', type: 'button', order: 7 },
    ],
  },
  {
    id: 'card-grid',
    name: 'Card Grid',
    elements: [
      { id: 'filter', label: 'Filter', type: 'select', order: 1 },
      { id: 'sort', label: 'Sort by', type: 'select', order: 2 },
      { id: 'card-1-link', label: 'Card 1 Link', type: 'link', order: 3 },
      { id: 'card-1-action', label: 'Card 1 Action', type: 'button', order: 4 },
      { id: 'card-2-link', label: 'Card 2 Link', type: 'link', order: 5 },
      { id: 'card-2-action', label: 'Card 2 Action', type: 'button', order: 6 },
      { id: 'card-3-link', label: 'Card 3 Link', type: 'link', order: 7 },
      { id: 'card-3-action', label: 'Card 3 Action', type: 'button', order: 8 },
      { id: 'load-more', label: 'Load More', type: 'button', order: 9 },
    ],
  },
  {
    id: 'modal-dialog',
    name: 'Modal Dialog',
    elements: [
      { id: 'close', label: 'Close (X)', type: 'button', order: 1 },
      { id: 'title-input', label: 'Title', type: 'input', order: 2 },
      { id: 'description', label: 'Description', type: 'textarea', order: 3 },
      { id: 'category', label: 'Category', type: 'select', order: 4 },
      { id: 'agree', label: 'I agree to terms', type: 'checkbox', order: 5 },
      { id: 'cancel', label: 'Cancel', type: 'button', order: 6 },
      { id: 'submit', label: 'Submit', type: 'button', order: 7 },
    ],
  },
  {
    id: 'settings-page',
    name: 'Settings Page',
    elements: [
      { id: 'nav-general', label: 'General', type: 'link', order: 1 },
      { id: 'nav-notifications', label: 'Notifications', type: 'link', order: 2 },
      { id: 'nav-privacy', label: 'Privacy', type: 'link', order: 3 },
      { id: 'display-name', label: 'Display Name', type: 'input', order: 4 },
      { id: 'email', label: 'Email', type: 'input', order: 5 },
      { id: 'theme', label: 'Theme', type: 'select', order: 6 },
      { id: 'notifications-toggle', label: 'Enable Notifications', type: 'checkbox', order: 7 },
      { id: 'save', label: 'Save Changes', type: 'button', order: 8 },
    ],
  },
];

const GUIDELINES = [
  {
    title: 'Use Skip Links',
    description: 'Provide "skip to main content" links so keyboard users can bypass repetitive navigation.',
    type: 'do' as const,
  },
  {
    title: 'Follow Visual Order',
    description: 'Tab order should match the visual reading order (top-to-bottom, left-to-right in LTR layouts).',
    type: 'do' as const,
  },
  {
    title: 'Manage Focus in Modals',
    description: 'Trap focus within open dialogs and restore focus to the trigger element on close.',
    type: 'do' as const,
  },
  {
    title: 'Avoid Positive tabindex',
    description: 'Using tabindex > 0 overrides natural DOM order and causes confusing navigation.',
    type: 'dont' as const,
  },
  {
    title: 'Avoid Focus Traps',
    description: 'Never trap keyboard focus in a region with no way to exit (except modal dialogs).',
    type: 'dont' as const,
  },
  {
    title: 'Keep Focus Visible',
    description: 'Always show a visible focus indicator. WCAG requires 2px minimum width, 3:1 contrast ratio.',
    type: 'do' as const,
  },
];

function MockElement({
  element,
  order,
  isFocused,
  showRing,
  ringOffset,
  ringWidth,
}: {
  element: FocusableElement;
  order: number;
  isFocused: boolean;
  showRing: boolean;
  ringOffset: number;
  ringWidth: number;
}) {
  const baseClasses = 'relative transition-all duration-200';
  const focusRingStyle: React.CSSProperties =
    isFocused && showRing
      ? {
          outline: `${ringWidth}px solid var(--color-accent)`,
          outlineOffset: `${ringOffset}px`,
        }
      : {};

  const renderElement = () => {
    switch (element.type) {
      case 'button':
        return (
          <div
            className={`${baseClasses} px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer
              ${isFocused ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-text-primary hover:bg-surface-3/80'}`}
            style={focusRingStyle}
          >
            {element.label}
          </div>
        );
      case 'input':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-tertiary">{element.label}</span>
            <div
              className={`${baseClasses} px-2 py-1 rounded border text-xs
                ${isFocused ? 'border-accent bg-accent/5 text-text-primary' : 'border-border-subtle bg-surface-2 text-text-tertiary'}`}
              style={focusRingStyle}
            >
              {element.label === 'Search' ? 'Search...' : `Enter ${element.label.toLowerCase()}`}
            </div>
          </div>
        );
      case 'textarea':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-tertiary">{element.label}</span>
            <div
              className={`${baseClasses} px-2 py-1 rounded border text-xs h-12
                ${isFocused ? 'border-accent bg-accent/5 text-text-primary' : 'border-border-subtle bg-surface-2 text-text-tertiary'}`}
              style={focusRingStyle}
            >
              Enter {element.label.toLowerCase()}...
            </div>
          </div>
        );
      case 'link':
        return (
          <div
            className={`${baseClasses} text-xs cursor-pointer
              ${isFocused ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
            style={focusRingStyle}
          >
            <span className={isFocused ? 'underline' : 'hover:underline'}>{element.label}</span>
          </div>
        );
      case 'select':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-tertiary">{element.label}</span>
            <div
              className={`${baseClasses} px-2 py-1 rounded border text-xs flex items-center justify-between
                ${isFocused ? 'border-accent bg-accent/5 text-text-primary' : 'border-border-subtle bg-surface-2 text-text-secondary'}`}
              style={focusRingStyle}
            >
              <span>Select...</span>
              <span className="text-text-tertiary ml-2">&#9662;</span>
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <div
            className={`${baseClasses} flex items-center gap-2 text-xs cursor-pointer
              ${isFocused ? 'text-accent' : 'text-text-secondary'}`}
            style={focusRingStyle}
          >
            <div
              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center
                ${isFocused ? 'border-accent bg-accent/10' : 'border-border-subtle bg-surface-2'}`}
            />
            <span>{element.label}</span>
          </div>
        );
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <span
        className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
          ${isFocused ? 'bg-accent text-surface-0' : 'bg-surface-3 text-text-secondary'}`}
      >
        {order}
      </span>
      {renderElement()}
    </div>
  );
}

function LoginFormLayout(props: { focusedIndex: number; showRing: boolean; ringOffset: number; ringWidth: number; elements: FocusableElement[] }) {
  const { focusedIndex, showRing, ringOffset, ringWidth, elements } = props;
  return (
    <div className="max-w-xs mx-auto p-6 rounded-lg border border-border-subtle bg-surface-1">
      <h4 className="text-sm font-semibold text-text-primary mb-4">Log In</h4>
      <div className="space-y-3">
        {elements.slice(0, 2).map((el, i) => (
          <MockElement key={el.id} element={el} order={i + 1} isFocused={focusedIndex === i} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        ))}
        <div className="flex items-center justify-between">
          <MockElement element={elements[2]} order={3} isFocused={focusedIndex === 2} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
          <MockElement element={elements[3]} order={4} isFocused={focusedIndex === 3} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        </div>
        <MockElement element={elements[4]} order={5} isFocused={focusedIndex === 4} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        <div className="text-center pt-2">
          <MockElement element={elements[5]} order={6} isFocused={focusedIndex === 5} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        </div>
      </div>
    </div>
  );
}

function NavigationBarLayout(props: { focusedIndex: number; showRing: boolean; ringOffset: number; ringWidth: number; elements: FocusableElement[] }) {
  const { focusedIndex, showRing, ringOffset, ringWidth, elements } = props;
  return (
    <div className="p-4 rounded-lg border border-border-subtle bg-surface-1">
      <div className="mb-2">
        <MockElement element={elements[0]} order={1} isFocused={focusedIndex === 0} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {elements.slice(1).map((el, i) => (
          <MockElement key={el.id} element={el} order={i + 2} isFocused={focusedIndex === i + 1} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        ))}
      </div>
    </div>
  );
}

function CardGridLayout(props: { focusedIndex: number; showRing: boolean; ringOffset: number; ringWidth: number; elements: FocusableElement[] }) {
  const { focusedIndex, showRing, ringOffset, ringWidth, elements } = props;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {elements.slice(0, 2).map((el, i) => (
          <MockElement key={el.id} element={el} order={i + 1} isFocused={focusedIndex === i} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((cardIdx) => {
          const linkEl = elements[2 + cardIdx * 2];
          const actionEl = elements[3 + cardIdx * 2];
          const linkOrder = 3 + cardIdx * 2;
          const actionOrder = 4 + cardIdx * 2;
          return (
            <div key={cardIdx} className="p-3 rounded-lg border border-border-subtle bg-surface-1 space-y-2">
              <div className="w-full h-10 rounded bg-surface-3 mb-2" />
              <MockElement element={linkEl} order={linkOrder} isFocused={focusedIndex === linkOrder - 1} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
              <MockElement element={actionEl} order={actionOrder} isFocused={focusedIndex === actionOrder - 1} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <MockElement element={elements[8]} order={9} isFocused={focusedIndex === 8} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
      </div>
    </div>
  );
}

function ModalDialogLayout(props: { focusedIndex: number; showRing: boolean; ringOffset: number; ringWidth: number; elements: FocusableElement[] }) {
  const { focusedIndex, showRing, ringOffset, ringWidth, elements } = props;
  return (
    <div className="max-w-sm mx-auto">
      <div className="rounded-lg border border-border-subtle bg-surface-1 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary">Create Item</h4>
          <MockElement element={elements[0]} order={1} isFocused={focusedIndex === 0} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        </div>
        <div className="p-4 space-y-3">
          {elements.slice(1, 5).map((el, i) => (
            <MockElement key={el.id} element={el} order={i + 2} isFocused={focusedIndex === i + 1} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
          <MockElement element={elements[5]} order={6} isFocused={focusedIndex === 5} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
          <MockElement element={elements[6]} order={7} isFocused={focusedIndex === 6} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        </div>
      </div>
      <p className="text-[10px] text-text-tertiary mt-2 text-center italic">Focus is trapped within the modal dialog</p>
    </div>
  );
}

function SettingsPageLayout(props: { focusedIndex: number; showRing: boolean; ringOffset: number; ringWidth: number; elements: FocusableElement[] }) {
  const { focusedIndex, showRing, ringOffset, ringWidth, elements } = props;
  return (
    <div className="flex gap-4">
      <div className="w-32 space-y-1 shrink-0">
        <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Settings</p>
        {elements.slice(0, 3).map((el, i) => (
          <div key={el.id} className="py-0.5">
            <MockElement element={el} order={i + 1} isFocused={focusedIndex === i} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 rounded-lg border border-border-subtle bg-surface-1 space-y-3">
        <h4 className="text-xs font-semibold text-text-primary mb-3">General</h4>
        {elements.slice(3, 7).map((el, i) => (
          <MockElement key={el.id} element={el} order={i + 4} isFocused={focusedIndex === i + 3} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        ))}
        <div className="pt-2">
          <MockElement element={elements[7]} order={8} isFocused={focusedIndex === 7} showRing={showRing} ringOffset={ringOffset} ringWidth={ringWidth} />
        </div>
      </div>
    </div>
  );
}

export default function FocusOrderVisualizerTool() {
  const [template, setTemplate] = useState<LayoutTemplate>('login-form');
  const [showRing, setShowRing] = useState(true);
  const [ringOffset, setRingOffset] = useState(2);
  const [ringWidth, setRingWidth] = useState(2);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isTabbing, setIsTabbing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentLayout = useMemo(
    () => LAYOUTS.find((l) => l.id === template) ?? LAYOUTS[0],
    [template],
  );

  const totalStops = currentLayout.elements.length;

  const stopTabThrough = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTabbing(false);
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTabThrough = useCallback(() => {
    if (isTabbing) {
      stopTabThrough();
      return;
    }
    setIsTabbing(true);
    setFocusedIndex(0);
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += 1;
      if (current >= totalStops) {
        stopTabThrough();
      } else {
        setFocusedIndex(current);
      }
    }, 600);
  }, [isTabbing, totalStops, stopTabThrough]);

  const handleTemplateChange = useCallback((id: LayoutTemplate) => {
    stopTabThrough();
    setTemplate(id);
  }, [stopTabThrough]);

  const layoutProps = {
    focusedIndex,
    showRing,
    ringOffset,
    ringWidth,
    elements: currentLayout.elements,
  };

  const renderLayout = () => {
    switch (template) {
      case 'login-form': return <LoginFormLayout {...layoutProps} />;
      case 'navigation-bar': return <NavigationBarLayout {...layoutProps} />;
      case 'card-grid': return <CardGridLayout {...layoutProps} />;
      case 'modal-dialog': return <ModalDialogLayout {...layoutProps} />;
      case 'settings-page': return <SettingsPageLayout {...layoutProps} />;
    }
  };

  return (
    <ToolLayout
      title="Focus Order Visualizer"
      description="Simulate tab order through component layouts and validate focus ring styles"
    >
      <SplitPanel
        leftWidth="360px"
        left={
          <div>
            <ParameterSection title="Layout Template">
              <div className="flex flex-wrap gap-1.5">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleTemplateChange(l.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      template === l.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Focus Ring">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">Show focus rings</label>
                <button
                  onClick={() => setShowRing(!showRing)}
                  className={`relative w-8 h-[18px] rounded-full transition-colors ${
                    showRing ? 'bg-accent' : 'bg-surface-3'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface-0 transition-transform ${
                      showRing ? 'left-[16px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
              <SliderWithInput
                label="Outline Offset"
                value={ringOffset}
                onChange={setRingOffset}
                min={1}
                max={6}
                step={1}
                unit="px"
              />
              <SliderWithInput
                label="Ring Width"
                value={ringWidth}
                onChange={setRingWidth}
                min={1}
                max={4}
                step={1}
                unit="px"
              />
            </ParameterSection>

            <ParameterSection title="WCAG Requirements">
              <div className="space-y-2">
                <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                  <p className="text-[10px] font-medium text-text-primary mb-0.5">2.4.7 Focus Visible (AA)</p>
                  <p className="text-[10px] text-text-tertiary">
                    Focus indicators must be visible. Minimum 2px wide, with at least 3:1 contrast ratio against adjacent colors.
                  </p>
                </div>
                <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                  <p className="text-[10px] font-medium text-text-primary mb-0.5">2.4.3 Focus Order (A)</p>
                  <p className="text-[10px] text-text-tertiary">
                    Navigation order must be logical and meaningful. Tab sequence should follow the visual layout order.
                  </p>
                </div>
                <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                  <p className="text-[10px] font-medium text-text-primary mb-0.5">2.4.11 Focus Appearance (AAA)</p>
                  <p className="text-[10px] text-text-tertiary">
                    Focus indicator should enclose the element with a 2px solid outline and 3:1 contrast.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${ringWidth >= 2 ? 'bg-success' : 'bg-warning'}`}
                  />
                  <span className="text-[10px] text-text-tertiary">
                    Ring width: {ringWidth}px {ringWidth >= 2 ? '(meets minimum)' : '(below 2px minimum)'}
                  </span>
                </div>
              </div>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {currentLayout.name}
                </h3>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {totalStops} tab stop{totalStops !== 1 ? 's' : ''}
                  {focusedIndex >= 0 && ` \u2014 focused on #${focusedIndex + 1}`}
                </p>
              </div>
              <button
                onClick={startTabThrough}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isTabbing
                    ? 'bg-error/10 text-error border border-error/30 hover:bg-error/20'
                    : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
                }`}
              >
                {isTabbing ? 'Stop' : 'Tab Through'}
              </button>
            </div>

            <div className="py-4">
              {renderLayout()}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Tab Order Sequence
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {currentLayout.elements.map((el, i) => (
                  <button
                    key={el.id}
                    onClick={() => setFocusedIndex(focusedIndex === i ? -1 : i)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                      focusedIndex === i
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      focusedIndex === i ? 'bg-accent text-surface-0' : 'bg-surface-3 text-text-tertiary'
                    }`}>
                      {i + 1}
                    </span>
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Guidelines
              </h3>
              <div className="space-y-2">
                {GUIDELINES.map((g) => (
                  <div key={g.title} className="flex gap-2.5 p-2.5 rounded-lg bg-surface-2 border border-border-subtle">
                    <span
                      className={`shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                        g.type === 'do'
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      {g.type === 'do' ? '\u2713' : '\u2717'}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-text-primary">{g.title}</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">{g.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
