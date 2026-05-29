import type { ReactNode } from 'react';

type FilterOption = {
  key: string;
  label: string;
};

type FilterGroup = {
  label?: string;
  options: FilterOption[];
  activeKey: string;
  onSelect: (key: string) => void;
};

interface FilterToolbarProps {
  groups: FilterGroup[];
  containerClassName?: string;
  filtersRef?: React.RefObject<HTMLElement | null>;
  leading?: ReactNode;
}

export default function FilterToolbar({ groups, containerClassName, filtersRef, leading }: FilterToolbarProps) {
  const handleSelect = (group: FilterGroup, key: string) => {
    const hasAllOption = group.options.some((option) => option.key === 'all');
    if (hasAllOption && group.activeKey === key && key !== 'all') {
      group.onSelect('all');
      return;
    }
    group.onSelect(key);
  };

  return (
    <section
      ref={filtersRef}
      data-sticky-filters="true"
      className="px-6 py-4 sticky top-14 z-40 backdrop-blur-sm"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-editor-bg) 92%, transparent)',
        borderBottom: '1px solid var(--color-border-brutalist)',
      }}
    >
      <div className={containerClassName || 'max-w-[1200px] mx-auto'}>
        {leading}
        <div className="flex flex-wrap gap-4">
          {groups.map((group) => (
            <div key={group.label || group.options.map((option) => option.key).join('-')} className="flex items-center gap-2 flex-wrap">
              {group.label ? (
                <span className="font-mono text-xs-custom uppercase mr-1" style={{ color: 'var(--color-ink-muted)' }}>
                  {group.label}:
                </span>
              ) : null}
              {group.options.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSelect(group, option.key)}
                  className="pill-badge transition-all duration-200"
                  style={{
                    backgroundColor: group.activeKey === option.key ? 'var(--color-accent-lime)' : 'transparent',
                    color: group.activeKey === option.key ? 'var(--color-dark-void)' : 'var(--color-ink)',
                    borderColor: group.activeKey === option.key ? 'var(--color-accent-lime)' : 'var(--color-border-brutalist)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
