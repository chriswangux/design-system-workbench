import type { ReactNode } from 'react';

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ToolLayout({ title, description, children, actions }: ToolLayoutProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle shrink-0">
        <div>
          <h1 className="text-base font-semibold text-text-primary">{title}</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

interface SplitPanelProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string;
}

export function SplitPanel({ left, right, leftWidth = '360px' }: SplitPanelProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <div
        className="border-r border-border-subtle overflow-y-auto shrink-0"
        style={{ width: leftWidth }}
      >
        {left}
      </div>
      <div className="flex-1 overflow-y-auto">
        {right}
      </div>
    </div>
  );
}

interface ParameterSectionProps {
  title: string;
  children: ReactNode;
}

export function ParameterSection({ title, children }: ParameterSectionProps) {
  return (
    <div className="px-4 py-3 border-b border-border-subtle">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
