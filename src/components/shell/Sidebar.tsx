import { useNavigate, useLocation } from 'react-router';
import { ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import { toolSections } from '@/router/routes';
import { useUIStore } from '@/core/store/uiStore';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarCollapsed,
    expandedSections,
    toggleSidebar,
    toggleSection,
  } = useUIStore();

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-surface-1 border-r border-border-subtle flex flex-col items-center py-3 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <div className="mt-4 flex flex-col gap-2">
          {toolSections.map(({ section, icon: Icon }) => (
            <button
              key={section}
              onClick={() => toggleSection(section)}
              className="p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-secondary transition-colors"
              title={section}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 bg-surface-1 border-r border-border-subtle flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tools</span>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-1">
        {toolSections.map(({ section, icon: SectionIcon, tools }) => {
          const isExpanded = expandedSections.includes(section);
          return (
            <div key={section}>
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
                <SectionIcon size={14} />
                <span>{section}</span>
              </button>
              {isExpanded && (
                <div className="ml-3">
                  {tools.map(({ path, label, icon: ToolIcon }) => {
                    const isActive = location.pathname === path;
                    return (
                      <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-l-md transition-colors ${
                          isActive
                            ? 'bg-accent/10 text-accent border-r-2 border-accent'
                            : 'text-text-tertiary hover:text-text-primary hover:bg-surface-2'
                        }`}
                      >
                        <ToolIcon size={13} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-border-subtle">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Designed by Chris Wang
          <br />
          Made by Claude Code
        </p>
      </div>
    </div>
  );
}
