import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { projects } from '@/data/content';
import FilterToolbar from '@/components/FilterToolbar';
import NewsletterSignup from '@/components/NewsletterSignup';

const statusColors: Record<string, string> = {
  current: 'var(--color-accent-lime)',
  work_in_progress: 'var(--color-accent-coral)',
  archived: 'var(--color-ink)',
  inactive: 'var(--color-ink-muted)',
  experimental: 'var(--color-accent-magenta)',
};

const statusLabels: Record<string, { en: string; de: string }> = {
  current: { en: 'Current', de: 'Aktiv' },
  work_in_progress: { en: 'Work in progress', de: 'In Entwicklung' },
  archived: { en: 'Archived', de: 'Archiviert' },
  inactive: { en: 'Inactive', de: 'Inaktiv' },
  experimental: { en: 'Experimental', de: 'Experimentell' },
};

const typeLabels: Record<string, { en: string; de: string }> = {
  project: { en: 'Project', de: 'Projekt' },
  campaign: { en: 'Campaign', de: 'Kampagne' },
  organisation: { en: 'Organisation', de: 'Organisation' },
  tool: { en: 'Tool', de: 'Tool' },
  website: { en: 'Website', de: 'Website' },
  role: { en: 'Role', de: 'Rolle' },
  community: { en: 'Community', de: 'Community' },
  space: { en: 'Space', de: 'Space' },
  reading_circle: { en: 'Reading circle', de: 'Lesekreis' },
  education: { en: 'Education', de: 'Bildung' },
};

const consolidatedTopicMap: Record<string, string> = {
  activism: 'politics & organising',
  activitypub: 'civic tech',
  advocacy: 'digital rights',
  austria: 'digital rights',
  bachelor: 'education & research',
  campaign: 'politics & organising',
  campaigning: 'politics & organising',
  cities: 'mobility & cities',
  communities: 'community & culture',
  'community space': 'community & culture',
  'community spaces': 'community & culture',
  copyright: 'digital rights',
  culture: 'community & culture',
  'civic tech': 'civic tech',
  'civil society': 'digital rights',
  data: 'civic tech',
  'digital rights': 'digital rights',
  'digital single market': 'digital rights',
  education: 'education & research',
  elections: 'politics & organising',
  europe: 'digital rights',
  federated: 'civic tech',
  'free knowledge': 'open knowledge',
  'open access': 'open knowledge',
  'open data': 'civic tech',
  'open web': 'civic tech',
  infrastructure: 'public infrastructure',
  international: 'education & research',
  migration: 'education & research',
  organising: 'politics & organising',
  'political education': 'education & research',
  politics: 'politics & organising',
  'public infrastructure': 'public infrastructure',
  reading: 'education & research',
  streets: 'mobility & cities',
  theory: 'education & research',
  transport: 'mobility & cities',
  'urban mobility': 'mobility & cities',
  vienna: 'mobility & cities',
  wikimedia: 'open knowledge',
};

const consolidatedTopicLabels: Record<string, { en: string; de: string }> = {
  'digital rights': { en: 'Digital rights', de: 'Digitale Rechte' },
  'civic tech': { en: 'Civic tech', de: 'Civic Tech' },
  'mobility & cities': { en: 'Mobility & cities', de: 'Mobilität & Städte' },
  'open knowledge': { en: 'Open knowledge', de: 'Offenes Wissen' },
  'politics & organising': { en: 'Politics & organising', de: 'Politik & Organisierung' },
  'community & culture': { en: 'Community & culture', de: 'Community & Kultur' },
  'education & research': { en: 'Education & research', de: 'Bildung & Forschung' },
  'public infrastructure': { en: 'Public infrastructure', de: 'Öffentliche Infrastruktur' },
};

type WorkEntry = {
  id: string;
  title: string;
  titleDe?: string;
  summary: string;
  summaryDe?: string;
  status: string;
  type?: string;
  startYear?: number;
  endYear?: number;
  dateLabel?: string;
  dateLabelDe?: string;
  role?: string;
  roleDe?: string;
  links?: { label: string; url: string }[];
  topics: string[];
};

function normalizeTopic(topic: string): string {
  return consolidatedTopicMap[topic.trim().toLowerCase()] || 'public infrastructure';
}

export default function Work() {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const filtersRef = useRef<HTMLElement | null>(null);

  const workEntries = useMemo<WorkEntry[]>(() => {
    return projects.map((project) => ({
      ...project,
      topics: Array.from(new Set(project.topics.map(normalizeTopic))),
    }));
  }, []);

  const statusFilters = useMemo(
    () => ['all', ...Array.from(new Set(workEntries.map((p) => p.status)))],
    [workEntries]
  );
  const topicFilters = useMemo(
    () => ['all', ...Array.from(new Set(workEntries.flatMap((p) => p.topics)))],
    [workEntries]
  );
  const typeFilters = useMemo(
    () => ['all', ...Array.from(new Set(workEntries.map((p) => p.type).filter((type): type is string => Boolean(type))))],
    [workEntries]
  );

  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const status = searchParams.get('status');
    const topic = searchParams.get('topic');
    const type = searchParams.get('type');

    const nextStatus = status && statusFilters.includes(status)
      ? status
      : 'all';
    const normalizedTopic = topic ? normalizeTopic(topic) : null;
    const nextTopic = normalizedTopic && topicFilters.includes(normalizedTopic)
      ? normalizedTopic
      : 'all';
    const nextType = type && typeFilters.includes(type)
      ? type
      : 'all';

    setStatusFilter(nextStatus);
    setTopicFilter(nextTopic);
    setTypeFilter(nextType);

  }, [searchParams, statusFilters, topicFilters, typeFilters]);

  const filtered = workEntries.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (topicFilter !== 'all' && !p.topics.includes(topicFilter)) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) => (prev === status ? 'all' : status));
  };

  const toggleTopicFilter = (topic: string) => {
    setTopicFilter((prev) => (prev === topic ? 'all' : topic));
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter((prev) => (prev === type ? 'all' : type));
  };

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="px-6 py-12 md:py-16" style={{ borderBottom: '2px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[1200px] mx-auto">
          <h1 className="font-serif text-4xl-custom mb-3" style={{ color: 'var(--color-ink)' }}>
            {t.work.title}
          </h1>
          <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink-muted)' }}>
            {t.work.subtitle}
          </p>
        </div>
      </section>

      {/* Filters */}
      <FilterToolbar
        filtersRef={filtersRef}
        groups={[
          {
            label: t.work.filters.status,
            activeKey: statusFilter,
            onSelect: setStatusFilter,
            options: statusFilters.map((f) => ({ key: f, label: f === 'all' ? t.work.filters.all : (statusLabels[f]?.[lang] || f) })),
          },
          {
            label: t.work.filters.topic,
            activeKey: topicFilter,
            onSelect: setTopicFilter,
            options: topicFilters.map((f) => ({ key: f, label: f === 'all' ? t.work.filters.all : (consolidatedTopicLabels[f]?.[lang] || f) })),
          },
          {
            label: t.work.filters.type,
            activeKey: typeFilter,
            onSelect: setTypeFilter,
            options: typeFilters.map((f) => ({ key: f, label: f === 'all' ? t.work.filters.all : (typeLabels[f]?.[lang] || f) })),
          },
        ]}
      />

      {/* Project Grid */}
      <section className="px-6 py-12">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => {
            const title = lang === 'de' && project.titleDe ? project.titleDe : project.title;
            const summary = lang === 'de' && project.summaryDe ? project.summaryDe : project.summary;
            const topics = project.topics;
            const statusColor = statusColors[project.status] || 'var(--color-ink-muted)';
            const statusLabel = statusLabels[project.status]?.[lang] || project.status;
            const typeLabel = project.type ? (typeLabels[project.type]?.[lang] || project.type) : null;
            const roleLabel = lang === 'de' && project.roleDe ? project.roleDe : project.role;
            const dateLabel = lang === 'de' && project.dateLabelDe ? project.dateLabelDe : project.dateLabel;
            const yearLabel = dateLabel || (project.endYear
              ? `${project.startYear} — ${project.endYear}`
              : `${project.startYear || ''}`);

            return (
              <div
                key={project.id}
                className="group p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--color-editor-bg)',
                  border: '2px solid var(--color-border-brutalist)',
                  borderRadius: 'var(--radius-soft)',
                }}
              >
                {/* Status Badge */}
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    className="pill-badge"
                    onClick={() => toggleStatusFilter(project.status)}
                    style={{
                      backgroundColor: statusColor,
                      color: project.status === 'archived' ? 'var(--color-cream)' : '#111111',
                      borderColor: statusColor,
                    }}
                  >
                    {statusLabel}
                  </button>
                </div>

                {/* Year */}
                <p className="font-mono text-xs-custom mb-1" style={{ color: 'var(--color-ink-muted)' }}>
                  {yearLabel}
                </p>

                {/* Title */}
                <h3 className="font-grotesk text-xl-custom font-medium mb-2" style={{ color: 'var(--color-ink)' }}>
                  {title}
                </h3>

                {roleLabel && (
                  <p className="font-grotesk text-sm-custom mb-2" style={{ color: 'var(--color-accent-cyan)' }}>
                    {roleLabel}
                  </p>
                )}

                {/* Summary */}
                <p className="font-grotesk text-sm-custom mb-4" style={{ color: 'var(--color-ink-muted)' }}>
                  {summary}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.type && typeLabel && (
                    <button
                      type="button"
                      onClick={() => toggleTypeFilter(project.type as string)}
                      className="pill-badge"
                      style={{
                        fontSize: '9px',
                        padding: '2px 8px',
                        backgroundColor: typeFilter === project.type ? 'var(--color-accent-lime)' : 'transparent',
                        color: typeFilter === project.type ? 'var(--color-dark-void)' : 'var(--color-ink)',
                        borderColor: typeFilter === project.type ? 'var(--color-accent-lime)' : 'var(--color-border-brutalist)',
                      }}
                    >
                      {typeLabel}
                    </button>
                  )}
                  {topics.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTopicFilter(tag)}
                      className="pill-badge"
                      style={{
                        fontSize: '9px',
                        padding: '2px 8px',
                        backgroundColor: topicFilter === tag ? 'var(--color-accent-lime)' : 'transparent',
                        color: topicFilter === tag ? 'var(--color-dark-void)' : 'var(--color-ink)',
                        borderColor: topicFilter === tag ? 'var(--color-accent-lime)' : 'var(--color-border-brutalist)',
                      }}
                    >
                      {consolidatedTopicLabels[tag]?.[lang] || tag}
                    </button>
                  ))}
                </div>

                {/* Links */}
                {project.links && project.links.length > 0 && (
                  <div className="flex gap-3">
                    {project.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-grotesk text-xs-custom uppercase tracking-widest transition-colors hover:underline"
                        style={{ color: 'var(--color-accent-cyan)', textUnderlineOffset: '3px' }}
                      >
                        {link.label + ' \u2192'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center font-grotesk text-base-custom py-16" style={{ color: 'var(--color-ink-muted)' }}>
            No projects match these filters.
          </p>
        )}

        <p className="text-center font-mono text-xs-custom mt-12" style={{ color: 'var(--color-ink-muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
        </p>
      </section>
      <NewsletterSignup />
    </div>
  );
}
