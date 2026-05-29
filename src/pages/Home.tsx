import { Link, useNavigate } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { projects } from '@/data/content';
import { notes } from '@/data/notes';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function Home() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

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
      const priorityA = a.homepagePriority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.homepagePriority ?? Number.MAX_SAFE_INTEGER;

      if (priorityA !== priorityB) return priorityA - priorityB;
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

  const projectColors = {
    lime: { border: 'var(--color-accent-lime)', badge: 'var(--color-accent-lime)' },
    coral: { border: 'var(--color-accent-coral)', badge: 'var(--color-accent-coral)' },
    cyan: { border: 'var(--color-accent-cyan)', badge: 'var(--color-accent-cyan)' },
  };

  const campaignTopics = new Set([
    'urban mobility',
    'activism',
    'politics',
    'organising',
    'streets',
    'vienna',
    'elections',
    'transport',
    'cities',
  ]);

  const getProjectColors = (project: (typeof projects)[number]) => {
    if (project.status === 'work_in_progress') return projectColors.coral;

    const hasCampaignTopic = project.topics.some((topic) =>
      campaignTopics.has(topic.toLowerCase())
    );

    if (hasCampaignTopic) return projectColors.lime;
    return projectColors.cyan;
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
          <span className="font-mono" style={{ color: 'var(--color-accent-cyan)' }}>nini</span>
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
          Photo: Richard Sekerak (WMCZ),
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
            href="https://creativecommons.org/licenses/by-sa/4.0/"
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
            className="font-serif text-3xl-custom mb-2"
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
              const displayTags = project.topics.slice(0, 3);

              return (
                <a
                  key={project.id}
                  href={project.links?.[0]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-6 transition-all duration-300"
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: `2px solid ${colors.border}`,
                    borderRadius: 'var(--radius-soft)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateToWork(`status=${encodeURIComponent(project.status)}`);
                      }}
                      className="pill-badge"
                      style={{
                        backgroundColor: colors.badge,
                        color: '#111111',
                        borderColor: colors.badge,
                        cursor: 'pointer',
                      }}
                    >
                      {isWip ? (lang === 'de' ? 'In Entwicklung' : 'Currently building') : (lang === 'de' ? 'Aktiv' : 'Current')}
                    </button>
                  </div>
                  <h3 className="font-serif text-2xl-custom mb-2" style={{ color: '#F5F1E8' }}>
                    {title}
                  </h3>
                  <p className="font-grotesk text-sm-custom mb-4" style={{ color: 'rgba(245, 241, 232, 0.82)' }}>
                    {summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className="pill-badge pill-badge-contextual"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToWork(`type=${encodeURIComponent(project.type)}`);
                      }}
                      style={{
                        cursor: 'pointer',
                        ['--badge-base-border' as string]: colors.border,
                        ['--badge-base-fg' as string]: colors.border,
                        ['--badge-hover-bg' as string]: colors.border,
                        ['--badge-hover-fg' as string]: '#111111',
                      }}
                    >
                      {project.type.replace('_', ' ')}
                    </span>
                    {displayTags.map((tag, tagIndex) => (
                      <span
                        key={`${project.id}-${tag}`}
                        className="pill-badge pill-badge-contextual"
                        onClick={(e) => {
                          e.preventDefault();
                          const topic = project.topics[tagIndex] || project.topics[0] || tag;
                          navigateToWork(`topic=${encodeURIComponent(topic)}`);
                        }}
                        style={{
                          cursor: 'pointer',
                          ['--badge-base-border' as string]: colors.border,
                          ['--badge-base-fg' as string]: colors.border,
                          ['--badge-hover-bg' as string]: colors.border,
                          ['--badge-hover-fg' as string]: '#111111',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Archive Preview */}
      <section className="py-20 md:py-28 px-6">
        <div
          className="max-w-[700px] mx-auto p-8 md:p-12 transition-all duration-300 hover:-translate-y-0.5"
          style={{
            border: '2px solid var(--color-border-brutalist)',
            borderRadius: 'var(--radius-sharp)',
            boxShadow: 'var(--shadow-brutal)',
            backgroundColor: 'var(--color-cream)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-grotesk text-3xl-custom uppercase font-bold" style={{ color: 'var(--color-ink)' }}>
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
              const period = lang === 'de' && entry.dateLabelDe
                ? entry.dateLabelDe
                : (entry.dateLabel || (entry.endYear ? `${entry.startYear} - ${entry.endYear}` : `${entry.startYear ?? ''}`));

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
                  className="inline-block transition-colors hover:underline"
                  style={{ color: 'inherit', textUnderlineOffset: '3px' }}
                >
                  <span className="font-mono text-xs-custom mr-2" style={{ color: 'var(--color-ink-muted)' }}>{period}</span>
                  {title}
                  <span style={{ color: 'var(--color-ink-muted)' }}> - {role}</span>
                </Link>
              </li>
              );
            })}
          </ul>
          <Link
            to="/archive"
            className="font-grotesk text-sm-custom inline-flex items-center gap-1 mt-6 transition-colors hover:underline"
            style={{ color: 'var(--color-accent-cyan)', textUnderlineOffset: '4px' }}
          >
            {lang === 'de' ? 'Gesamtes Archiv' : 'Browse full archive'}
            <span>{' \u2192'}</span>
          </Link>
        </div>
      </section>

      {/* Notes Preview */}
      <section className="py-16 md:py-24 px-6" style={{ borderTop: '1px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-serif text-3xl-custom mb-2" style={{ color: 'var(--color-ink)' }}>
            {t.notes.title}
          </h2>
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
                    border: '2px solid var(--color-border-brutalist)',
                    borderRadius: 'var(--radius-soft)',
                  }}
                >
                  <p className="font-mono text-xs-custom mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                    {note.date}
                  </p>
                  <h3 className="font-grotesk text-xl-custom mb-2 leading-tight" style={{ color: 'var(--color-ink)' }}>
                    {note.title}
                  </h3>
                  <p className="font-grotesk text-sm-custom line-clamp-2 mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                    {note.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {note.topics.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="pill-badge"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToNotes(`topic=${encodeURIComponent(tag)}`);
                        }}
                        style={{ fontSize: '9px', padding: '2px 8px', cursor: 'pointer' }}
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
            className="font-grotesk text-sm-custom inline-flex items-center gap-1 transition-colors hover:underline"
            style={{ color: 'var(--color-accent-cyan)', textUnderlineOffset: '4px' }}
          >
            {t.notes.allNotes}
            <span>{' \u2192'}</span>
          </Link>
        </div>
      </section>
      <NewsletterSignup />
    </div>
  );
}
