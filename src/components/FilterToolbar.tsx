import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';

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
  accentColor?: string;
}

const MOBILE_BREAKPOINT = 768;
const COLLAPSE_SCROLL_DISTANCE = 24;

export default function FilterToolbar({
  groups,
  containerClassName,
  filtersRef,
  leading,
  accentColor = 'var(--color-page-accent)',
}: FilterToolbarProps) {
  const optionsId = useId();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeLabels = useMemo(
    () => groups
      .map((group) => group.options.find((option) => option.key === group.activeKey))
      .filter((option): option is FilterOption => option !== undefined && option.key !== 'all')
      .map((option) => option.label),
    [groups]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleMediaChange = () => {
      const nextIsMobile = mediaQuery.matches;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) {
        setIsCollapsed(false);
      }
    };

    handleMediaChange();
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    let lastScrollY = window.scrollY;
    let frameId = 0;

    const updateCollapsedState = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollingDown = currentScrollY > lastScrollY;
      const movedEnough = Math.abs(currentScrollY - lastScrollY) > 4;
      const hasPassedToolbar = currentScrollY > COLLAPSE_SCROLL_DISTANCE;

      if (movedEnough && hasPassedToolbar) {
        setIsCollapsed(scrollingDown);
      } else if (currentScrollY <= COLLAPSE_SCROLL_DISTANCE) {
        setIsCollapsed(false);
      }

      lastScrollY = currentScrollY;
      frameId = 0;
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateCollapsedState);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [isMobile]);

  const handleSelect = (group: FilterGroup, key: string) => {
    const hasAllOption = group.options.some((option) => option.key === 'all');
    if (hasAllOption && group.activeKey === key && key !== 'all') {
      group.onSelect('all');
      return;
    }
    group.onSelect(key);
  };

  const toggleCollapsed = () => {
    setIsCollapsed((current) => !current);
  };

  return (
    <section
      ref={filtersRef}
      data-sticky-filters="true"
      data-collapsed={isMobile && isCollapsed ? 'true' : 'false'}
      className="sticky top-14 z-40 px-6 py-3 md:py-4 backdrop-blur-sm transition-[padding] duration-200"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-editor-bg) 92%, transparent)',
        borderBottom: '1px solid var(--color-border-brutalist)',
      }}
    >
      <div className={containerClassName || 'max-w-[1200px] mx-auto'}>
        <button
          type="button"
          className="mb-0 flex w-full items-center justify-between gap-3 py-1 text-left md:hidden"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-controls={optionsId}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="font-mono text-xs-custom uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-muted)' }}>
              Filters
            </span>
            <span className="flex min-w-0 flex-1 gap-1 overflow-hidden">
              {activeLabels.length > 0 ? activeLabels.slice(0, 2).map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="truncate rounded-full border px-2 py-0.5 font-mono text-xs-custom uppercase"
                  style={{
                    borderColor: accentColor,
                    color: 'var(--color-ink)',
                  }}
                >
                  {label}
                </span>
              )) : (
                <span className="truncate font-mono text-xs-custom uppercase" style={{ color: 'var(--color-ink-muted)' }}>
                  All
                </span>
              )}
              {activeLabels.length > 2 ? (
                <span className="font-mono text-xs-custom" style={{ color: 'var(--color-ink-muted)' }}>
                  +{activeLabels.length - 2}
                </span>
              ) : null}
            </span>
          </span>
          <span className="font-mono text-xs-custom uppercase" style={{ color: 'var(--color-ink)' }}>
            {isCollapsed ? 'Show' : 'Hide'}
          </span>
        </button>

        <div
          id={optionsId}
          className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 md:mt-0 md:max-h-none md:overflow-visible md:opacity-100 ${isMobile && isCollapsed ? 'mt-0 max-h-0 opacity-0' : 'mt-3 max-h-[70vh] opacity-100'}`}
        >
          {leading}
          <div className="flex flex-wrap gap-3 md:gap-4">
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
                      backgroundColor: group.activeKey === option.key ? accentColor : 'transparent',
                      color: group.activeKey === option.key ? 'var(--color-dark-void)' : 'var(--color-ink)',
                      borderColor: group.activeKey === option.key ? accentColor : 'var(--color-border-brutalist)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
