import { useState, useCallback, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';

type CopyContext = 'error' | 'empty-state' | 'success' | 'cta' | 'confirmation' | 'tooltip' | 'validation' | 'loading';
type Tone = 'professional' | 'friendly' | 'playful' | 'minimal';

interface CopyVariant {
  text: string;
  isBestPractice: boolean;
}

interface ContextDef {
  id: CopyContext;
  name: string;
}

interface ToneDef {
  id: Tone;
  name: string;
}

const CONTEXTS: ContextDef[] = [
  { id: 'error', name: 'Error Messages' },
  { id: 'empty-state', name: 'Empty States' },
  { id: 'success', name: 'Success Messages' },
  { id: 'cta', name: 'CTAs' },
  { id: 'confirmation', name: 'Confirmation Dialogs' },
  { id: 'tooltip', name: 'Tooltips' },
  { id: 'validation', name: 'Form Validation' },
  { id: 'loading', name: 'Loading States' },
];

const TONES: ToneDef[] = [
  { id: 'professional', name: 'Professional' },
  { id: 'friendly', name: 'Friendly' },
  { id: 'playful', name: 'Playful' },
  { id: 'minimal', name: 'Minimal' },
];

const COPY_LIBRARY: Record<CopyContext, Record<Tone, CopyVariant[]>> = {
  error: {
    professional: [
      { text: 'An error occurred while processing your request. Please try again.', isBestPractice: true },
      { text: 'Unable to complete the action. Check your connection and retry.', isBestPractice: true },
      { text: 'Something went wrong. Contact support if the issue persists.', isBestPractice: true },
      { text: 'ERROR: SYSTEM FAILURE. CONTACT ADMIN IMMEDIATELY.', isBestPractice: false },
    ],
    friendly: [
      { text: "Something went wrong on our end. We're looking into it!", isBestPractice: true },
      { text: "That didn't work as expected. Give it another try?", isBestPractice: true },
      { text: "We hit a snag. Don't worry, your data is safe.", isBestPractice: true },
      { text: 'Oops! Everything is broken and we have no idea why.', isBestPractice: false },
    ],
    playful: [
      { text: "Well, that didn't go as planned! Let's try again.", isBestPractice: true },
      { text: 'Hmm, something tripped us up. One more try?', isBestPractice: true },
      { text: "We fumbled that one. Back to it!", isBestPractice: true },
      { text: 'KABOOM! Just kidding. But something did break.', isBestPractice: false },
    ],
    minimal: [
      { text: 'Action failed. Please retry.', isBestPractice: true },
      { text: 'Error. Try again.', isBestPractice: true },
      { text: 'Request failed. Retry or contact support.', isBestPractice: true },
      { text: 'Error occurred.', isBestPractice: false },
    ],
  },
  'empty-state': {
    professional: [
      { text: 'No items to display. Create your first item to get started.', isBestPractice: true },
      { text: 'This section is empty. Add content to populate this view.', isBestPractice: true },
      { text: 'No results found. Adjust your filters or create new content.', isBestPractice: true },
      { text: 'Nothing here.', isBestPractice: false },
    ],
    friendly: [
      { text: "It's a blank canvas! Start by adding your first item.", isBestPractice: true },
      { text: "Nothing here yet, but that's about to change!", isBestPractice: true },
      { text: "Your collection is empty. Let's fill it up!", isBestPractice: true },
      { text: 'Wow, such empty. Much void.', isBestPractice: false },
    ],
    playful: [
      { text: "Looks like a fresh start! Ready to create something?", isBestPractice: true },
      { text: "This space is waiting for your first masterpiece!", isBestPractice: true },
      { text: "Empty for now — but not for long, right?", isBestPractice: true },
      { text: '*crickets* ...Add something already!', isBestPractice: false },
    ],
    minimal: [
      { text: 'No items yet. Create one.', isBestPractice: true },
      { text: 'Empty. Add your first item.', isBestPractice: true },
      { text: 'No content. Get started.', isBestPractice: true },
      { text: '0 results.', isBestPractice: false },
    ],
  },
  success: {
    professional: [
      { text: 'Your changes have been saved successfully.', isBestPractice: true },
      { text: 'Operation completed. All changes are applied.', isBestPractice: true },
      { text: 'Item created successfully. View it in your dashboard.', isBestPractice: true },
      { text: 'Success!!! Everything worked!!! Amazing!!!', isBestPractice: false },
    ],
    friendly: [
      { text: "All done! Your changes are saved and ready to go.", isBestPractice: true },
      { text: "Great job! Everything has been updated.", isBestPractice: true },
      { text: "Saved! You're all set.", isBestPractice: true },
      { text: "YAAAS! We did it! High five!", isBestPractice: false },
    ],
    playful: [
      { text: "Nailed it! Everything is saved.", isBestPractice: true },
      { text: "Done and dusted! Changes are live.", isBestPractice: true },
      { text: "Boom! Saved successfully.", isBestPractice: true },
      { text: "OMG you're the best user ever!!!", isBestPractice: false },
    ],
    minimal: [
      { text: 'Saved.', isBestPractice: true },
      { text: 'Changes applied.', isBestPractice: true },
      { text: 'Done.', isBestPractice: true },
      { text: 'OK', isBestPractice: false },
    ],
  },
  cta: {
    professional: [
      { text: 'Get Started', isBestPractice: true },
      { text: 'Start Free Trial', isBestPractice: true },
      { text: 'Request a Demo', isBestPractice: true },
      { text: 'Click Here', isBestPractice: false },
    ],
    friendly: [
      { text: "Let's Get Started", isBestPractice: true },
      { text: 'Try It Free', isBestPractice: true },
      { text: 'See It in Action', isBestPractice: true },
      { text: 'Do the Thing', isBestPractice: false },
    ],
    playful: [
      { text: 'Jump Right In', isBestPractice: true },
      { text: 'Take It for a Spin', isBestPractice: true },
      { text: "Yes, I'm In!", isBestPractice: true },
      { text: 'SMASH THIS BUTTON', isBestPractice: false },
    ],
    minimal: [
      { text: 'Start', isBestPractice: true },
      { text: 'Begin', isBestPractice: true },
      { text: 'Try Free', isBestPractice: true },
      { text: 'Submit', isBestPractice: false },
    ],
  },
  confirmation: {
    professional: [
      { text: 'Are you sure you want to delete this item? This action cannot be undone.', isBestPractice: true },
      { text: 'Confirm: discard unsaved changes?', isBestPractice: true },
      { text: 'This will permanently remove 3 items. Proceed?', isBestPractice: true },
      { text: 'Are you sure? Are you really sure? Really really sure?', isBestPractice: false },
    ],
    friendly: [
      { text: "Just checking — do you want to delete this? It can't be recovered.", isBestPractice: true },
      { text: "You have unsaved work. Leave without saving?", isBestPractice: true },
      { text: "This will remove all selected items. Sound good?", isBestPractice: true },
      { text: "Whoa there! You sure about that?", isBestPractice: false },
    ],
    playful: [
      { text: "About to delete this forever. No take-backs! Continue?", isBestPractice: true },
      { text: "Hold up — leave without saving your awesome work?", isBestPractice: true },
      { text: "Ready to clear the decks? This can't be undone.", isBestPractice: true },
      { text: "Self-destruct sequence initiated. Cancel?", isBestPractice: false },
    ],
    minimal: [
      { text: 'Delete this item? This is permanent.', isBestPractice: true },
      { text: 'Discard changes?', isBestPractice: true },
      { text: 'Remove 3 items?', isBestPractice: true },
      { text: 'Confirm?', isBestPractice: false },
    ],
  },
  tooltip: {
    professional: [
      { text: 'Keyboard shortcut: Cmd+S to save your progress', isBestPractice: true },
      { text: 'Required. Must be at least 8 characters.', isBestPractice: true },
      { text: 'Last modified by Jane Smith on Dec 12, 2024', isBestPractice: true },
      { text: 'This is the button. It does things. Click it to do the things.', isBestPractice: false },
    ],
    friendly: [
      { text: 'Pro tip: Use Cmd+S to quickly save!', isBestPractice: true },
      { text: 'Pick a strong password — at least 8 characters.', isBestPractice: true },
      { text: 'Last edited by Jane, two days ago', isBestPractice: true },
      { text: 'You probably already know this, but just in case...', isBestPractice: false },
    ],
    playful: [
      { text: 'Shortcut alert! Cmd+S saves the day.', isBestPractice: true },
      { text: 'Make it strong: 8+ characters, please!', isBestPractice: true },
      { text: 'Jane was here — 2 days ago', isBestPractice: true },
      { text: 'Hover over everything! Tooltips everywhere!', isBestPractice: false },
    ],
    minimal: [
      { text: 'Save: Cmd+S', isBestPractice: true },
      { text: 'Min. 8 characters', isBestPractice: true },
      { text: 'Edited Dec 12', isBestPractice: true },
      { text: 'Info', isBestPractice: false },
    ],
  },
  validation: {
    professional: [
      { text: 'Please enter a valid email address.', isBestPractice: true },
      { text: 'Password must contain at least 8 characters, one number, and one symbol.', isBestPractice: true },
      { text: 'This field is required.', isBestPractice: true },
      { text: 'INVALID INPUT! FIX ERRORS BEFORE CONTINUING.', isBestPractice: false },
    ],
    friendly: [
      { text: "That email doesn't look quite right. Mind double-checking?", isBestPractice: true },
      { text: 'Almost there! Add a number and symbol to your password.', isBestPractice: true },
      { text: "Oops, this one's required.", isBestPractice: true },
      { text: 'Wrong. Try again, but better this time.', isBestPractice: false },
    ],
    playful: [
      { text: "Hmm, that doesn't look like an email. Try adding an @!", isBestPractice: true },
      { text: "Your password needs more spice — add a number and symbol!", isBestPractice: true },
      { text: "Don't skip this one — it's important!", isBestPractice: true },
      { text: "Nope! Not even close. Guess again!", isBestPractice: false },
    ],
    minimal: [
      { text: 'Invalid email.', isBestPractice: true },
      { text: '8+ characters, 1 number, 1 symbol.', isBestPractice: true },
      { text: 'Required.', isBestPractice: true },
      { text: 'Error.', isBestPractice: false },
    ],
  },
  loading: {
    professional: [
      { text: 'Loading your content...', isBestPractice: true },
      { text: 'Processing your request. This may take a moment.', isBestPractice: true },
      { text: 'Syncing data with the server...', isBestPractice: true },
      { text: 'Please wait........................', isBestPractice: false },
    ],
    friendly: [
      { text: 'Hang tight, almost there!', isBestPractice: true },
      { text: 'Getting everything ready for you...', isBestPractice: true },
      { text: 'Loading your stuff — just a sec!', isBestPractice: true },
      { text: 'This is taking forever, sorry about that...', isBestPractice: false },
    ],
    playful: [
      { text: 'Warming up the engines...', isBestPractice: true },
      { text: 'Fetching the good stuff!', isBestPractice: true },
      { text: 'Almost ready — putting the finishing touches on!', isBestPractice: true },
      { text: 'Loading... go grab a coffee, this will take a while.', isBestPractice: false },
    ],
    minimal: [
      { text: 'Loading...', isBestPractice: true },
      { text: 'Processing...', isBestPractice: true },
      { text: 'Syncing...', isBestPractice: true },
      { text: 'Wait.', isBestPractice: false },
    ],
  },
};

function charCountColor(len: number, limit: number): string {
  const ratio = len / limit;
  if (ratio > 1) return 'bg-error/10 text-error border-error/30';
  if (ratio > 0.85) return 'bg-warning/10 text-warning border-warning/30';
  return 'bg-success/10 text-success border-success/30';
}

function MockUIContext({
  context,
  text,
}: {
  context: CopyContext;
  text: string;
}) {
  switch (context) {
    case 'error':
      return (
        <div className="p-2.5 rounded-md border" style={{ borderColor: 'var(--color-border-subtle)', background: 'color-mix(in srgb, var(--color-error) 8%, var(--color-surface-2))' }}>
          <div className="flex items-start gap-2">
            <span className="text-error text-sm shrink-0">&#9888;</span>
            <p className="text-xs text-text-primary">{text}</p>
          </div>
        </div>
      );
    case 'empty-state':
      return (
        <div className="p-4 rounded-md border border-border-subtle bg-surface-2 text-center">
          <div className="w-10 h-10 rounded-full bg-surface-3 mx-auto mb-2 flex items-center justify-center">
            <span className="text-text-tertiary text-lg">&#9744;</span>
          </div>
          <p className="text-xs text-text-secondary">{text}</p>
        </div>
      );
    case 'success':
      return (
        <div className="p-2.5 rounded-md border" style={{ borderColor: 'var(--color-border-subtle)', background: 'color-mix(in srgb, var(--color-success) 8%, var(--color-surface-2))' }}>
          <div className="flex items-start gap-2">
            <span className="text-success text-sm shrink-0">&#10003;</span>
            <p className="text-xs text-text-primary">{text}</p>
          </div>
        </div>
      );
    case 'cta':
      return (
        <div className="inline-flex">
          <span className="px-4 py-2 rounded-md text-xs font-medium text-surface-0" style={{ background: 'var(--color-accent)' }}>
            {text}
          </span>
        </div>
      );
    case 'confirmation':
      return (
        <div className="p-3 rounded-lg border border-border-subtle bg-surface-1 shadow-md max-w-xs">
          <p className="text-xs text-text-primary mb-3">{text}</p>
          <div className="flex justify-end gap-2">
            <span className="px-2.5 py-1 rounded text-[10px] bg-surface-3 text-text-secondary">Cancel</span>
            <span className="px-2.5 py-1 rounded text-[10px] bg-error/10 text-error">Delete</span>
          </div>
        </div>
      );
    case 'tooltip':
      return (
        <div className="inline-flex flex-col items-center gap-1">
          <span className="px-2.5 py-1.5 rounded-md text-[10px] text-text-primary bg-surface-3 border border-border-subtle shadow-sm max-w-[200px]">
            {text}
          </span>
          <span className="w-2 h-2 bg-surface-3 border-b border-r border-border-subtle rotate-45 -mt-2.5" />
          <span className="px-2 py-1 rounded text-[10px] bg-surface-2 text-text-tertiary border border-border-subtle">
            Hover target
          </span>
        </div>
      );
    case 'validation':
      return (
        <div className="space-y-1 max-w-xs">
          <div className="px-2 py-1.5 rounded border border-red-500/30 bg-surface-2 text-xs text-text-tertiary">
            user@example
          </div>
          <p className="text-[10px] text-error px-0.5">{text}</p>
        </div>
      );
    case 'loading':
      return (
        <div className="p-3 rounded-md border border-border-subtle bg-surface-2 flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-xs text-text-secondary">{text}</p>
        </div>
      );
  }
}

function CopyCard({
  variant,
  context,
  charLimit,
  showCharCount,
}: {
  variant: CopyVariant;
  context: CopyContext;
  charLimit: number;
  showCharCount: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const len = variant.text.length;
  const colorClass = charCountColor(len, charLimit);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(variant.text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [variant.text]);

  return (
    <div className="p-3 rounded-lg border border-border-subtle bg-surface-1 space-y-2.5">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            variant.isBestPractice
              ? 'bg-success/10 text-success'
              : 'bg-error/10 text-error'
          }`}
        >
          {variant.isBestPractice ? '\u2713 Do' : '\u2717 Don\'t'}
        </span>
        <div className="flex items-center gap-1.5">
          {showCharCount && (
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono border ${colorClass}`}>
              {len}/{charLimit}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-text-tertiary hover:text-text-secondary hover:bg-surface-3 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <><Check size={10} className="text-success" /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
        </div>
      </div>
      <MockUIContext context={context} text={variant.text} />
    </div>
  );
}

export default function MicrocopyWorkshopTool() {
  const [context, setContext] = useState<CopyContext>('error');
  const [tone, setTone] = useState<Tone>('professional');
  const [charLimit, setCharLimit] = useState(120);
  const [showCharCount, setShowCharCount] = useState(true);
  const [customText, setCustomText] = useState('');

  const variants = useMemo(
    () => COPY_LIBRARY[context]?.[tone] ?? [],
    [context, tone],
  );

  const customLen = customText.length;
  const customColorClass = charCountColor(customLen, charLimit);

  const handleExport = useCallback(() => {
    const allVariants: Record<string, Record<string, CopyVariant[]>> = {};
    for (const ctx of CONTEXTS) {
      allVariants[ctx.id] = {};
      for (const t of TONES) {
        allVariants[ctx.id][t.id] = COPY_LIBRARY[ctx.id]?.[t.id] ?? [];
      }
    }
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), variants: allVariants }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'microcopy-patterns.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <ToolLayout
      title="Microcopy Workshop"
      description="Templates and patterns for common UI copy across tones and contexts"
      actions={
        <button
          onClick={handleExport}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors"
        >
          Export Patterns
        </button>
      }
    >
      <SplitPanel
        leftWidth="360px"
        left={
          <div>
            <ParameterSection title="Context">
              <div className="flex flex-wrap gap-1.5">
                {CONTEXTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContext(c.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      context === c.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Tone">
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      tone === t.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Character Limit">
              <SliderWithInput
                label="Max characters"
                value={charLimit}
                onChange={setCharLimit}
                min={20}
                max={280}
                step={10}
                unit="ch"
              />
              <div className="flex items-center justify-between mt-1">
                <label className="text-xs text-text-secondary">Show character count</label>
                <button
                  onClick={() => setShowCharCount(!showCharCount)}
                  className={`relative w-8 h-[18px] rounded-full transition-colors ${
                    showCharCount ? 'bg-accent' : 'bg-surface-3'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface-0 transition-transform ${
                      showCharCount ? 'left-[16px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            </ParameterSection>

            <ParameterSection title="Writing Tips">
              <div className="space-y-2">
                <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                  <p className="text-[10px] font-medium text-text-primary mb-0.5">Be specific</p>
                  <p className="text-[10px] text-text-tertiary">Tell users what happened and what to do next. Avoid vague messages.</p>
                </div>
                <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                  <p className="text-[10px] font-medium text-text-primary mb-0.5">Use active voice</p>
                  <p className="text-[10px] text-text-tertiary">"We saved your changes" beats "Your changes have been saved."</p>
                </div>
                <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                  <p className="text-[10px] font-medium text-text-primary mb-0.5">Keep it short</p>
                  <p className="text-[10px] text-text-tertiary">Every word should earn its place. Cut filler words ruthlessly.</p>
                </div>
              </div>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                {CONTEXTS.find((c) => c.id === context)?.name} &mdash; {TONES.find((t) => t.id === tone)?.name}
              </h3>
              <p className="text-[10px] text-text-tertiary">
                {variants.filter((v) => v.isBestPractice).length} recommended, {variants.filter((v) => !v.isBestPractice).length} anti-pattern
              </p>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <CopyCard
                  key={`${context}-${tone}-${i}`}
                  variant={v}
                  context={context}
                  charLimit={charLimit}
                  showCharCount={showCharCount}
                />
              ))}
            </div>

            <div className="border-t border-border-subtle pt-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Custom Copy Preview
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder={`Write your own ${CONTEXTS.find((c) => c.id === context)?.name.toLowerCase()} copy...`}
                    className="w-full h-20 px-3 py-2 rounded-md border border-border-subtle bg-surface-2 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                  />
                  {showCharCount && customText.length > 0 && (
                    <span className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono border ${customColorClass}`}>
                      {customLen}/{charLimit}
                    </span>
                  )}
                </div>
                {customText.length > 0 && (
                  <div className="p-3 rounded-lg border border-border-subtle bg-surface-1">
                    <p className="text-[10px] text-text-tertiary mb-2">Preview:</p>
                    <MockUIContext context={context} text={customText} />
                  </div>
                )}
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
