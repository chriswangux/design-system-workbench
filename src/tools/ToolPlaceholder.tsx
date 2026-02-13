import { ToolLayout } from '@/components/shell/ToolLayout';

interface ToolPlaceholderProps {
  title: string;
  description: string;
}

export function ToolPlaceholder({ title, description }: ToolPlaceholderProps) {
  return (
    <ToolLayout title={title} description={description}>
      <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
        <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-4">
          <div className="w-8 h-8 rounded-lg bg-surface-3 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
        <p className="text-xs text-text-tertiary max-w-md text-center">{description}</p>
        <p className="text-xs text-text-tertiary mt-4 opacity-50">Coming soon</p>
      </div>
    </ToolLayout>
  );
}
