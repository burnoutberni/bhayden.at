import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { projects } from '@/data/content';
import { notes } from '@/data/notes';
import NewsletterSignup from '@/components/NewsletterSignup';
import ProjectCard from '@/components/ProjectCard';
import ExternalLinkGlyph from '@/components/ExternalLinkGlyph';
import { getProjectCardColors } from '@/lib/projectCardColors';

type EverycalEvent = {
  id: string;
  slug: string;
  title: string;
  start_date: string;
  end_date: string | null;
  start_at_utc?: string;
  end_at_utc?: string | null;
  location_name: string | null;
  location_address: string | null;
  location_url: string | null;
  image_url: string | null;
  tags: string | null;
  repost_username: string | null;
  account_username: string;
};

type EverycalResponse = {
  events: EverycalEvent[];
};

const typeLabels: Record<string, { en: string; de: string }> = {
  project: { en: 'Project', de: 'Projekt' },
  campaign: { en: 'Campaign', de: 'Kampagne' },
  organisation: { en: 'Organisation', de: 'Organisation' },
  tool: { en: 'Tool', de: 'Tool' },
  website: { en: 'Website', de: 'Website' },
  community: { en: 'Community', de: 'Community' },
  education: { en: 'Education', de: 'Bildung' },
};

const statusPriority: Record<string, number> = {
  work_in_progress: 0,
  current: 1,
  archived: 2,
};

export default function Home() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  const isPrerenderCrawl = userAgent.includes('ReactSnap') || navigator.webdriver;
  const ccBySaUrl = lang === 'de'
    ? 'https://creativecommons.org/licenses/by-sa/4.0/deed.de'
    : 'https://creativecommons.org/licenses/by-sa/4.0/deed.en';
  const [events, setEvents] = useState<EverycalEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const navigateToWork = (query: string) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(`/work?${query}`);
  };

  const navigateToNotes = (query: string) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(`/notes?${query}`);
  };

  const currentProjects = projects
    .filter((p) => p.status === 'current' || p.status === 'work_in_progress')
    .sort((a, b) => {
      const statusDiff = (statusPriority[a.status] ?? Number.MAX_SAFE_INTEGER)
        - (statusPriority[b.status] ?? Number.MAX_SAFE_INTEGER);
      if (statusDiff !== 0) return statusDiff;

      const aYear = a.endYear ?? a.startYear ?? 0;
      const bYear = b.endYear ?? b.startYear ?? 0;
      if (aYear !== bYear) return bYear - aYear;

      const aStart = a.startYear ?? 0;
      const bStart = b.startYear ?? 0;
      if (aStart !== bStart) return bStart - aStart;

      return a.title.localeCompare(b.title);
    });

  const latestNotes = notes.slice(0, 3);

  const getArchiveEndYear = (startYear?: number, endYear?: number) => {
    if (endYear) return endYear;
    if (startYear) return startYear;
    return 0;
  };

  const archiveHighlights = projects
    .filter((project) => project.status === 'archived')
    .sort((a, b) => getArchiveEndYear(b.startYear, b.endYear) - getArchiveEndYear(a.startYear, a.endYear))
    .slice(0, 5);

  const getProjectColors = (project: (typeof projects)[number]) => {
    return getProjectCardColors(project.type);
  };

  useEffect(() => {
    if (isPrerenderCrawl) {
      setEventsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);

        const response = await fetch('https://events.bhayden.at/api/v1/feeds/nini.json');
        if (!response.ok) {
          throw new Error(`Failed to load events (${response.status})`);
        }

        const data = (await response.json()) as EverycalResponse;
        if (!isMounted) return;

        const sorted = (data.events || []).slice().sort((a, b) => {
          const dateA = new Date(a.start_at_utc || a.start_date).getTime();
          const dateB = new Date(b.start_at_utc || b.start_date).getTime();
          return dateA - dateB;
        });

        setEvents(sorted);
      } catch {
        if (!isMounted) return;
        setEventsError(lang === 'de' ? 'Events konnten gerade nicht geladen werden.' : 'Unable to load events right now.');
      } finally {
        if (isMounted) setEventsLoading(false);
      }
    };

    fetchEvents();
    const intervalId = window.setInterval(fetchEvents, 1000 * 60 * 5);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isPrerenderCrawl, lang]);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    updateCurrentTime();

    const intervalId = window.setInterval(updateCurrentTime, 1000 * 60);
    return () => window.clearInterval(intervalId);
  }, []);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => {
        const endValue = event.end_at_utc || event.end_date || event.start_at_utc || event.start_date;
        return new Date(endValue).getTime() >= currentTime;
      })
      .slice(0, 6);
  }, [currentTime, events]);

  const formatEventDate = (event: EverycalEvent) => {
    const startDate = new Date(event.start_at_utc || event.start_date);
    const endDate = event.end_at_utc || event.end_date ? new Date(event.end_at_utc || event.end_date || event.start_date) : null;
    const locale = lang === 'de' ? 'de-AT' : 'en-US';

    const dateText = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(startDate);

    const timeFormat = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

    const startTime = timeFormat.format(startDate);
    const endTime = endDate ? timeFormat.format(endDate) : null;

    return endTime ? `${dateText} - ${startTime} - ${endTime}` : `${dateText} - ${startTime}`;
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{
          borderBottom: '2px solid var(--color-border-brutalist)',
          backgroundImage:
            'linear-gradient(to bottom, rgba(11, 15, 18, 0.62), rgba(11, 15, 18, 0.72)), url("/wmeu-prague-ga-2026-29.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 26%',
        }}
      >
        <h1
          className="font-serif text-4xl-custom leading-tight mb-3"
          style={{ color: '#F5F1E8' }}
        >
          Bernhard Hayden
        </h1>
        <p className="font-mono text-xs-custom mb-1" style={{ color: 'rgba(245, 241, 232, 0.82)' }}>
          {lang === 'en' ? 'also known as:' : 'auch bekannt als:'}
          {' '}
          <span className="font-mono" style={{ color: 'var(--color-accent-lime)' }}>nini</span>
        </p>
        <p
          className="font-grotesk text-base-custom uppercase tracking-widest mb-10"
          style={{ color: 'rgba(245, 241, 232, 0.82)' }}
        >
          {t.hero.tagline}
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/work"
            className="pill-button pill-button-filled"
            style={{
              borderColor: 'var(--color-accent-lime)',
              backgroundColor: 'var(--color-accent-lime)',
              color: '#111111',
            }}
          >
            {t.hero.ctaPrimary}
          </Link>
          <Link
            to="/contact"
            className="pill-button"
            style={{
              borderColor: 'rgba(245, 241, 232, 0.82)',
              color: '#F5F1E8',
              backgroundColor: 'rgba(17, 17, 17, 0.26)',
            }}
          >
            {t.hero.ctaSecondary}
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(245, 241, 232, 0.82)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <p className="absolute bottom-4 right-4 font-mono text-[10px] md:text-xs max-w-[70vw] text-right" style={{ color: 'rgba(245, 241, 232, 0.86)' }}>
          {lang === 'de' ? 'Foto' : 'Photo'}: Richard Sekerak (WMCZ),
          {' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:WMEU_Prague_GA_2026_29.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
            style={{ color: '#F5F1E8' }}
          >
            Wikimedia Commons
          </a>
          ,
          {' '}
          <a
            href={ccBySaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
            style={{ color: '#F5F1E8' }}
          >
            CC BY-SA 4.0
          </a>
        </p>
      </section>

      {/* Manifesto / Statement */}
      <section className="relative py-24 md:py-36 px-6" style={{ borderBottom: '1px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[800px] mx-auto">
          <p
            className="font-grotesk text-2xl-custom leading-relaxed"
            style={{ color: 'var(--color-ink)' }}
          >
            {t.manifesto}
          </p>
        </div>
      </section>

      {/* Current Work */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: 'var(--color-dark-void)', borderBottom: '2px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="font-grotesk font-bold text-3xl-custom mb-2"
            style={{ color: '#F5F1E8' }}
          >
            {t.currentWork.title}
          </h2>
          <div className="w-16 h-0.5 mb-12" style={{ backgroundColor: 'var(--color-accent-lime)' }} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProjects.map((project) => {
              const colors = getProjectColors(project);
              const isWip = project.status === 'work_in_progress';
              const title = lang === 'de' && project.titleDe ? project.titleDe : project.title;
              const summary = lang === 'de' && project.summaryDe ? project.summaryDe : project.summary;
              const roleLabel = lang === 'de' && project.roleDe ? project.roleDe : project.role;
              const displayTags = project.topics.slice(0, 3);
              const statusLabel = isWip
                ? (lang === 'de' ? 'In Entwicklung' : 'Currently building')
                : (lang === 'de' ? 'Aktiv' : 'Current');
              const hasSingleYearRange = Boolean(project.startYear && project.endYear && project.startYear === project.endYear);
              const yearLabel = hasSingleYearRange
                ? `${project.startYear ?? ''}`
                : project.endYear
                  ? `${project.startYear} — ${project.endYear}`
                  : project.startYear
                    ? `${project.startYear} — ${lang === 'de' ? 'heute' : 'now'}`
                    : '';

              return (
                <ProjectCard
                  key={project.id}
                  projectId={project.id}
                  title={title}
                  summary={summary}
                  role={roleLabel}
                  yearLabel={yearLabel}
                  statusLabel={statusLabel}
                  statusKey={project.status}
                  typeLabel={typeLabels[project.type]?.[lang] || project.type.replace('_', ' ')}
                  topicLabels={displayTags}
                  links={project.links}
                  colors={colors}
                  variant="dark"
                  onStatusClick={(status) => navigateToWork(`status=${encodeURIComponent(status)}`)}
                  onTypeClick={() => navigateToWork(`type=${encodeURIComponent(project.type)}`)}
                  onTopicClick={(index) => {
                    const topic = project.topics[index] || project.topics[0];
                    if (topic) navigateToWork(`topic=${encodeURIComponent(topic)}`);
                  }}
                />
              );
            })}
          </div>

          <Link
            to="/work"
            className="font-grotesk text-sm-custom inline-flex items-center gap-1 mt-8 transition-colors link-with-arrow"
            style={{ color: 'var(--color-accent-lime)', textUnderlineOffset: '4px' }}
          >
            <span className="link-label">{lang === 'de' ? 'Alle Projekte' : 'Browse all work'}</span>
            <span className="link-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Events */}
      <section
        className="relative py-20 md:py-28 px-6 overflow-hidden"
        style={{
          ['--color-page-accent' as string]: 'var(--color-accent-cyan)',
          borderBottom: '2px solid var(--color-border-brutalist)',
          background: 'var(--events-section-bg)',
        }}
      >
        <div className="events-glow events-glow-left" aria-hidden="true" />
        <div className="events-glow events-glow-right" aria-hidden="true" />
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="mb-12">
            <h2 className="font-grotesk font-bold text-3xl-custom mb-2" style={{ color: 'var(--color-ink)' }}>
              {lang === 'de' ? 'Triff mich hier' : 'Meet me here'}
            </h2>
            <div className="w-16 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent-cyan)' }} />
            <p
              className="font-grotesk text-sm-custom max-w-[700px]"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              {lang === 'de'
                ? 'Hier findest du kommende Termine, Lesekreise und Veranstaltungen. Alles wird automatisch von EveryCal synchronisiert - immer aktuell, ohne manuelle Pflege.'
                : 'Find upcoming events, reading circles, and gatherings here. This section syncs automatically from EveryCal, so it always stays up to date.'}
            </p>
          </div>

          <div className="events-frame-wrap">
            {eventsLoading && (
              <div className="events-loading-grid" aria-live="polite">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`event-skeleton-${index}`} className="events-card events-card-skeleton" />
                ))}
              </div>
            )}

            {!eventsLoading && eventsError && (
              <div className="events-error-state">
                <p className="font-grotesk text-sm-custom" style={{ color: '#F5F1E8' }}>{eventsError}</p>
              </div>
            )}

            {!eventsLoading && !eventsError && upcomingEvents.length === 0 && (
              <div className="events-error-state">
                <p className="font-grotesk text-sm-custom" style={{ color: '#F5F1E8' }}>
                  {lang === 'de' ? 'Derzeit sind keine kommenden Events gelistet.' : 'No upcoming events listed right now.'}
                </p>
              </div>
            )}

            {!eventsLoading && !eventsError && upcomingEvents.length > 0 && (
              <div className="events-grid">
                {upcomingEvents.map((event) => {
                  const eventHref = `https://events.bhayden.at/@${event.account_username}/${event.slug}`;

                  return (
                    <article
                      key={event.id}
                      className="events-card"
                    >
                      {event.image_url && (
                        <div className="events-card-image-wrap">
                          <img src={event.image_url} alt={event.title} className="events-card-image" loading="lazy" />
                        </div>
                      )}
                      <div className="events-card-body">
                        <p className="events-card-date">{formatEventDate(event)}</p>
                        <a
                          href={eventHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="events-card-title events-card-title-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.title}
                        </a>
                        {(event.location_name || event.location_address || event.location_url) && (
                          <div className="events-card-location-wrap">
                            {event.location_name && <p className="events-card-location">{event.location_name}</p>}
                            {event.location_address && <p className="events-card-location-detail">{event.location_address}</p>}
                            {event.location_url && (
                              <a
                                href={event.location_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="events-card-location-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {lang === 'de' ? 'Ort ansehen' : 'View venue'}
                              </a>
                            )}
                          </div>
                        )}
                        <div className="events-card-meta-row">
                          <a
                            href={eventHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-card-link project-card-secondary-link font-grotesk text-xs-custom uppercase tracking-widest hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              color: 'var(--color-accent-cyan)',
                              textUnderlineOffset: '3px',
                            }}
                          >
                            {lang === 'de' ? 'In EveryCal öffnen' : 'Open in EveryCal'}
                            <ExternalLinkGlyph />
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <a
            href="https://events.bhayden.at/@nini"
            target="_blank"
            rel="noopener noreferrer"
            className="events-follow-link font-grotesk text-sm-custom inline-flex items-center gap-1 mt-6 transition-colors"
            style={{ color: 'var(--color-accent-cyan)', textUnderlineOffset: '4px' }}
          >
            <span className="events-follow-link-label">{lang === 'de' ? 'Folge mir auf EveryCal' : 'Follow me on EveryCal'}</span>
            <span className="events-follow-link-arrow">{' \u2197'}</span>
          </a>
        </div>
      </section>

      {/* Archive Preview */}
      <section className="py-20 md:py-28 px-6">
        <div
          className="max-w-[700px] mx-auto p-8 md:p-12 transition-all duration-300 hover:-translate-y-0.5"
          style={{
            ['--color-page-accent' as string]: 'var(--color-accent-cyan)',
            border: '2px solid var(--color-border-brutalist)',
            borderRadius: 'var(--radius-sharp)',
            boxShadow: 'var(--shadow-brutal)',
            backgroundColor: 'var(--color-cream)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-grotesk font-bold text-3xl-custom" style={{ color: 'var(--color-ink)' }}>
              {t.archive.title}
            </h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink)' }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <ul className="space-y-0">
            {archiveHighlights.map((entry, i) => {
              const title = lang === 'de' && entry.titleDe ? entry.titleDe : entry.title;
              const role = lang === 'de' && entry.roleDe ? entry.roleDe : entry.role;
              const hasSingleYearRange = Boolean(entry.startYear && entry.endYear && entry.startYear === entry.endYear);
              const hasArchivedSingleStartYear = Boolean(entry.status === 'archived' && entry.startYear && !entry.endYear);
              const period = hasSingleYearRange || hasArchivedSingleStartYear
                ? `${entry.startYear ?? ''}`
                : entry.endYear
                  ? `${entry.startYear} - ${entry.endYear}`
                  : entry.startYear
                    ? `${entry.startYear} - ${lang === 'de' ? 'heute' : 'now'}`
                    : '';

              return (
              <li
                key={entry.id}
                className="font-grotesk text-base-custom py-4"
                style={{
                  color: 'var(--color-ink)',
                  borderBottom: i < archiveHighlights.length - 1 ? '1px solid var(--color-border-brutalist)' : 'none',
                }}
              >
                <Link
                  to={`/archive#${entry.id}`}
                  className="archive-preview-link inline-block"
                  style={{ textUnderlineOffset: '3px' }}
                >
                  <span className="archive-preview-link-year font-mono text-xs-custom mr-2">{period}</span>
                  <span className="font-serif">{title}</span>
                  <span style={{ color: 'var(--color-ink-muted)' }}> - {role}</span>
                </Link>
              </li>
              );
            })}
          </ul>
          <Link
            to="/archive"
            className="font-grotesk text-sm-custom inline-flex items-center gap-1 mt-6 transition-colors link-with-arrow"
            style={{ color: 'var(--color-accent-cyan)', textUnderlineOffset: '4px' }}
          >
            <span className="link-label">{lang === 'de' ? 'Gesamtes Archiv' : 'Browse full archive'}</span>
            <span className="link-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Notes Preview */}
      <section
        className="py-16 md:py-24 px-6"
        style={{
          ['--color-page-accent' as string]: 'var(--color-accent-coral)',
          borderTop: '1px solid var(--color-border-brutalist)',
        }}
      >
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-grotesk font-bold text-3xl-custom mb-2" style={{ color: 'var(--color-ink)' }}>
            {t.notes.title}
          </h2>
          <div className="w-16 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent-coral)' }} />
          <p className="font-grotesk text-sm-custom mb-10" style={{ color: 'var(--color-ink-muted)' }}>
            {t.notes.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {latestNotes.map((note) => {
              return (
                <Link
                  key={note.id}
                  to={`/notes/${note.slug}`}
                  className="block p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--color-editor-bg)',
                    border: '2px solid var(--color-accent-coral)',
                    borderRadius: 'var(--radius-soft)',
                  }}
                >
                  <p className="font-mono text-xs-custom mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                    {note.date}
                  </p>
                  <h3 className="font-serif text-xl-custom mb-2 leading-tight" style={{ color: 'var(--color-ink)' }}>
                    {note.title}
                  </h3>
                  <p className="font-grotesk text-sm-custom line-clamp-2 mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                    {note.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {note.topics.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="pill-badge pill-badge-contextual home-notes-topic-pill"
                        role="button"
                        tabIndex={0}
                        aria-label={`${lang === 'de' ? 'Nach Thema filtern' : 'Filter by topic'}: ${tag}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToNotes(`topic=${encodeURIComponent(tag)}`);
                        }}
                        onKeyDown={(eventKey) => {
                          if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                            eventKey.preventDefault();
                            navigateToNotes(`topic=${encodeURIComponent(tag)}`);
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          ['--badge-base-border' as string]: 'var(--color-accent-coral)',
                          ['--badge-base-fg' as string]: 'var(--color-accent-coral)',
                          ['--badge-hover-bg' as string]: 'var(--color-accent-coral)',
                          ['--badge-hover-fg' as string]: '#111111',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>

          <Link
            to="/notes"
            className="font-grotesk text-sm-custom inline-flex items-center gap-1 transition-colors link-with-arrow"
            style={{ color: 'var(--color-accent-coral)', textUnderlineOffset: '4px' }}
          >
            <span className="link-label">{t.notes.allNotes}</span>
            <span className="link-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <NewsletterSignup />
    </div>
  );
}
