import type { Project } from '@/data/content';
import type { KeyboardEvent } from 'react';
import ExternalLinkGlyph from '@/components/ExternalLinkGlyph';

type CardColors = {
  border: string;
  badge: string;
};

type ProjectCardProps = {
  projectId: string;
  title: string;
  summary: string;
  role?: string;
  yearLabel?: string;
  statusLabel: string;
  statusKey: Project['status'] | string;
  typeLabel?: string;
  topicLabels: string[];
  links?: { label: string; url: string }[];
  colors: CardColors;
  variant: 'light' | 'dark';
  onCardClick?: () => void;
  onStatusClick?: (status: string) => void;
  onTypeClick?: () => void;
  onTopicClick?: (index: number) => void;
};

export default function ProjectCard({
  projectId,
  title,
  summary,
  role,
  yearLabel,
  statusLabel,
  statusKey,
  typeLabel,
  topicLabels,
  links,
  colors,
  variant,
  onCardClick,
  onStatusClick,
  onTypeClick,
  onTopicClick,
}: ProjectCardProps) {
  const primaryLink = links && links.length > 0 ? links[0] : null;
  const secondaryLinks = links && links.length > 1 ? links.slice(1) : [];
  const openPrimaryLink = () => {
    if (!primaryLink) return;
    window.open(primaryLink.url, '_blank', 'noopener,noreferrer');
  };
  const handleCardActivate = onCardClick || (primaryLink ? openPrimaryLink : undefined);
  const isDark = variant === 'dark';
  const cardTextColor = isDark ? '#F5F1E8' : 'var(--color-ink)';
  const mutedColor = isDark ? 'rgba(245, 241, 232, 0.82)' : 'var(--color-ink-muted)';
  const statusPillColor = statusKey === 'archived' && !isDark ? 'var(--color-ink)' : colors.badge;
  const statusPillTextColor = statusKey === 'archived' && !isDark ? 'var(--color-cream)' : '#111111';
  const cardProps = handleCardActivate
    ? {
        role: 'link' as const,
        tabIndex: 0,
        onClick: handleCardActivate,
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCardActivate();
          }
        },
      }
    : {};

  return (
    <article
      id={projectId}
      className={`project-card-selection group p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 ${handleCardActivate ? 'cursor-pointer' : ''}`}
      style={{
        backgroundColor: isDark ? '#1a1a1a' : 'var(--color-editor-bg)',
        border: `2px solid ${colors.border}`,
        borderRadius: 'var(--radius-soft)',
        ['--project-card-selection-bg' as string]: colors.border,
        ['--project-card-selection-fg' as string]: '#111111',
      }}
      {...cardProps}
    >
      <div className="flex justify-end mb-3">
        <button
          type="button"
          className="pill-badge"
          onClick={(event) => {
            event.stopPropagation();
            onStatusClick?.(statusKey);
          }}
          style={{
            backgroundColor: statusPillColor,
            color: statusPillTextColor,
            borderColor: statusPillColor,
            cursor: onStatusClick ? 'pointer' : 'default',
          }}
        >
          {statusLabel}
        </button>
      </div>

      {yearLabel && (
        <p className="font-mono text-xs-custom mb-1" style={{ color: mutedColor }}>
          {yearLabel}
        </p>
      )}

      <h3 className="font-serif text-2xl-custom mb-2" style={{ color: cardTextColor }}>
        {title}
      </h3>

      {role && (
        <p className="font-grotesk text-sm-custom mb-2" style={{ color: colors.border }}>
          {role}
        </p>
      )}

      <p className="font-grotesk text-sm-custom mb-4" style={{ color: mutedColor }}>
        {summary}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {typeLabel && (
          <button
            type="button"
            className="pill-badge pill-badge-contextual"
            onClick={(event) => {
              event.stopPropagation();
              onTypeClick?.();
            }}
            style={{
              cursor: onTypeClick ? 'pointer' : 'default',
              ['--badge-base-border' as string]: colors.border,
              ['--badge-base-fg' as string]: colors.border,
              ['--badge-hover-bg' as string]: colors.border,
              ['--badge-hover-fg' as string]: '#111111',
            }}
          >
            {typeLabel}
          </button>
        )}
        {topicLabels.map((topic, index) => (
          <button
            type="button"
            key={`${projectId}-${topic}`}
            className="pill-badge pill-badge-contextual"
            onClick={(event) => {
              event.stopPropagation();
              onTopicClick?.(index);
            }}
            style={{
              cursor: onTopicClick ? 'pointer' : 'default',
              ['--badge-base-border' as string]: colors.border,
              ['--badge-base-fg' as string]: colors.border,
              ['--badge-hover-bg' as string]: colors.border,
              ['--badge-hover-fg' as string]: '#111111',
            }}
          >
            {topic}
          </button>
        ))}
      </div>

      {primaryLink && (
        <div className="project-card-links flex gap-3 mt-auto pt-4">
          <a
            href={primaryLink.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="project-card-link project-card-primary-link font-grotesk text-xs-custom uppercase tracking-widest transition-colors hover:underline"
            style={{ color: colors.border, textUnderlineOffset: '3px' }}
          >
            {primaryLink.label}
            <ExternalLinkGlyph />
          </a>
          {secondaryLinks.map((link, index) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="project-card-link project-card-secondary-link font-grotesk text-xs-custom uppercase tracking-widest hover:underline"
              style={{
                color: colors.border,
                textUnderlineOffset: '3px',
                transitionDelay: `${index * 55}ms`,
              }}
            >
              {link.label}
              <ExternalLinkGlyph />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
