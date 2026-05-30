import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { projects } from '@/data/content';
import FilterToolbar from '@/components/FilterToolbar';
import NewsletterSignup from '@/components/NewsletterSignup';
import ExternalLinkGlyph from '@/components/ExternalLinkGlyph';


type ArchiveItem = {
  id: string;
  title: string;
  titleDe?: string;
  period: string;
  periodDe?: string;
  role: string;
  roleDe?: string;
  description: string;
  descriptionDe?: string;
  links?: { label: string; url: string }[];
  status: 'archived';
  type: string;
  topics: string[];
};

function normalizeTopic(topic: string): string {
  return topic.trim();
}

function getStartYear(period: string): number {
  const years = period.match(/\d{4}/g);
  if (!years || years.length === 0) return Number.MAX_SAFE_INTEGER;
  return Number(years[0]);
}

export default function Archive() {
  const { lang, t } = useLanguage();
  const filtersRef = useRef<HTMLElement | null>(null);

  const timelineEntries = useMemo<ArchiveItem[]>(
    () => projects
      .filter((project) => project.status === 'archived')
      .map((project) => ({
        ...project,
        id: `project-${project.id}`,
        title: project.title,
        titleDe: project.titleDe,
        period: ((project.startYear && project.endYear && project.startYear === project.endYear) || (project.status === 'archived' && project.startYear && !project.endYear)
          ? `${project.startYear ?? ''}`
          : project.endYear
            ? `${project.startYear ?? ''} - ${project.endYear}`
            : project.startYear
              ? `${project.startYear} - now`
              : ''),
        periodDe: ((project.startYear && project.endYear && project.startYear === project.endYear) || (project.status === 'archived' && project.startYear && !project.endYear)
          ? `${project.startYear ?? ''}`
          : project.endYear
            ? `${project.startYear ?? ''} - ${project.endYear}`
            : project.startYear
              ? `${project.startYear} - heute`
              : ''),
        role: project.role || 'Archived project',
        roleDe: project.roleDe || 'Archiviertes Projekt',
        description: project.summary,
        descriptionDe: project.summaryDe,
        links: project.links,
        status: 'archived' as const,
        type: project.type,
        topics: Array.from(new Set(project.topics.map(normalizeTopic))),
      }))
      .sort((a, b) => {
        const startDiff = getStartYear(a.period) - getStartYear(b.period);
        if (startDiff !== 0) return startDiff;
        return a.title.localeCompare(b.title);
      }),
    []
  );

  const topicFilters = useMemo(
    () => ['all', ...Array.from(new Set(timelineEntries.flatMap((entry) => entry.topics)))],
    [timelineEntries]
  );
  const typeFilters = useMemo(
    () => ['all', ...Array.from(new Set(timelineEntries.map((entry) => entry.type)))],
    [timelineEntries]
  );

  const [topicFilter, setTopicFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const toggleTopicFilter = (topic: string) => {
    setTopicFilter((prev) => (prev === topic ? 'all' : topic));
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter((prev) => (prev === type ? 'all' : type));
  };

  const filtered = timelineEntries.filter((entry) => {
    if (topicFilter !== 'all' && !entry.topics.includes(topicFilter)) return false;
    if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="px-6 py-12 md:py-16" style={{ borderBottom: '2px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[1200px] mx-auto">
          <h1 className="font-serif text-4xl-custom mb-3" style={{ color: 'var(--color-ink)' }}>
            {t.archive.title}
          </h1>
          <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink-muted)' }}>
            {t.archive.subtitle}
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="px-6 py-8">
        <div className="max-w-[800px] mx-auto">
          <p className="font-grotesk text-lg-custom italic leading-relaxed" style={{ color: 'var(--color-ink)' }}>
            {t.archive.intro}
          </p>
        </div>
      </section>

      {/* Filters */}
      <FilterToolbar
        filtersRef={filtersRef}
        containerClassName="max-w-[800px] mx-auto"
        groups={[
          {
            label: t.work.filters.topic,
            activeKey: topicFilter,
            onSelect: setTopicFilter,
            options: topicFilters.map((f) => ({ key: f, label: f === 'all' ? t.work.filters.all : f })),
          },
          {
            label: t.work.filters.type,
            activeKey: typeFilter,
            onSelect: setTypeFilter,
            options: typeFilters.map((f) => ({ key: f, label: f === 'all' ? t.work.filters.all : f })),
          },
        ]}
      />

      {/* Timeline */}
      <section className="px-6 py-12">
        <div className="max-w-[800px] mx-auto relative">
          {/* Vertical Line */}
          <div
            className="absolute left-[3px] top-0 bottom-0 w-0.5"
            style={{ backgroundColor: 'var(--color-border-brutalist)' }}
          />

          {filtered.map((entry) => {
            const title = lang === 'de' && entry.titleDe ? entry.titleDe : entry.title;
            const period = lang === 'de' && entry.periodDe ? entry.periodDe : entry.period;
            const role = lang === 'de' && entry.roleDe ? entry.roleDe : entry.role;
            const description = lang === 'de' && entry.descriptionDe ? entry.descriptionDe : entry.description;
            const typeLabel = entry.type || null;
            return (
              <div
                key={entry.id}
                id={entry.id}
                className="relative pl-8 pb-10 group"
                style={{ scrollMarginTop: '7rem' }}
              >
                {/* Dot */}
                <div
                  className="absolute left-0 top-1.5 w-2 h-2 rounded-full transition-transform group-hover:scale-150"
                  style={{ backgroundColor: 'var(--color-accent-cyan)' }}
                />

                {/* Card */}
                <div
                  className="p-5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: 'var(--color-editor-bg)',
                    border: '1px solid var(--color-border-brutalist)',
                    borderRadius: 'var(--radius-soft)',
                  }}
                >
                  <p className="font-mono text-xs-custom mb-1" style={{ color: 'var(--color-ink-muted)' }}>
                    {period}
                  </p>
                  <h3 className="font-grotesk text-xl-custom font-medium mb-1" style={{ color: 'var(--color-ink)' }}>
                    {entry.links?.[0]?.url ? (
                      <a
                        href={entry.links[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:underline"
                        style={{ color: 'var(--color-ink)', textUnderlineOffset: '3px' }}
                      >
                        {title}
                      </a>
                    ) : (
                      title
                    )}
                  </h3>
                  <p className="font-grotesk text-sm-custom mb-2" style={{ color: 'var(--color-accent-cyan)' }}>
                    {role}
                  </p>
                  <p className="font-grotesk text-sm-custom mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                    {description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.type && typeLabel && (
                      <button
                        type="button"
                        onClick={() => toggleTypeFilter(entry.type)}
                        className="pill-badge"
                        style={{
                          backgroundColor: typeFilter === entry.type ? 'var(--color-accent-lime)' : 'transparent',
                          color: typeFilter === entry.type ? 'var(--color-dark-void)' : 'var(--color-ink)',
                          borderColor: typeFilter === entry.type ? 'var(--color-accent-lime)' : 'var(--color-border-brutalist)',
                        }}
                      >
                        {typeLabel}
                      </button>
                    )}
                    {entry.topics.map((tag) => (
                      <button
                        type="button"
                        key={`${entry.id}-${tag}`}
                        onClick={() => toggleTopicFilter(tag)}
                        className="pill-badge"
                        style={{
                          backgroundColor: topicFilter === tag ? 'var(--color-accent-lime)' : 'transparent',
                          color: topicFilter === tag ? 'var(--color-dark-void)' : 'var(--color-ink)',
                          borderColor: topicFilter === tag ? 'var(--color-accent-lime)' : 'var(--color-border-brutalist)',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {entry.links && entry.links.length > 0 && (
                    <div className="flex gap-3 mt-3">
                      {entry.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-grotesk text-xs-custom uppercase tracking-widest transition-colors hover:underline"
                          style={{ color: 'var(--color-accent-cyan)', textUnderlineOffset: '3px' }}
                        >
                          {link.label}
                          <ExternalLinkGlyph />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-12" style={{ borderTop: '1px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[800px] mx-auto">
          <p className="font-grotesk text-sm-custom mb-4" style={{ color: 'var(--color-ink-muted)' }}>
            {lang === 'de'
              ? 'Laufende und aktuelle Arbeit findest du auf der Work-Seite.'
              : 'For ongoing and current work, head over to the Work page.'}
          </p>
          <Link
            to="/work"
            className="font-grotesk text-sm-custom inline-flex items-center gap-1 transition-colors link-with-arrow"
            style={{ color: 'var(--color-accent-cyan)', textUnderlineOffset: '4px' }}
          >
            <span className="link-label">{lang === 'de' ? 'Zur Work-Seite' : 'Go to Work'}</span>
            <span className="link-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <NewsletterSignup />
    </div>
  );
}
