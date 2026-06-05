import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { notes, noteTopics } from '@/data/notes';
import FilterToolbar from '@/components/FilterToolbar';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function Notes() {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const filtersRef = useRef<HTMLElement | null>(null);
  const [topicFilter, setTopicFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'de' | 'sv'>('all');

  useEffect(() => {
    const topicParam = searchParams.get('topic') || searchParams.get('tag');
    const languageParam = searchParams.get('language') || searchParams.get('lang');
    const nextTopic = topicParam && noteTopics.includes(topicParam) ? topicParam : 'all';
    const nextLanguage = languageParam === 'en' || languageParam === 'de' || languageParam === 'sv' ? languageParam : 'all';
    setTopicFilter(nextTopic);
    setLanguageFilter(nextLanguage);

    if (topicParam && filtersRef.current) {
      const navOffset = 72;
      const top = filtersRef.current.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top, behavior: 'auto' });
    }
  }, [searchParams]);

  const filtered = topicFilter === 'all'
    ? notes
    : notes.filter((n) => n.topics.includes(topicFilter));

  const filteredByLanguage = languageFilter === 'all'
    ? filtered
    : filtered.filter((n) => n.language === languageFilter);

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="px-6 py-12 md:py-16" style={{ borderBottom: '2px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[800px] mx-auto">
          <h1 className="font-serif text-4xl-custom mb-3" style={{ color: 'var(--color-ink)' }}>
            {t.notesPage.title}
          </h1>
          <div className="w-16 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-page-accent)' }} />
          <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink-muted)' }}>
            {t.notesPage.subtitle}
          </p>
        </div>
      </section>

      {/* Topic Filters */}
      <FilterToolbar
        filtersRef={filtersRef}
        containerClassName="max-w-[800px] mx-auto"
        accentColor="var(--color-page-accent)"
        groups={[
          {
            activeKey: topicFilter,
            onSelect: setTopicFilter,
            options: noteTopics.map((topic) => ({ key: topic, label: topic })),
          },
          {
            activeKey: languageFilter,
            onSelect: (key) => setLanguageFilter(key as 'all' | 'en' | 'de' | 'sv'),
            options: [
              { key: 'all', label: t.notesPage.allLanguages },
              { key: 'en', label: 'en' },
              { key: 'de', label: 'de' },
              { key: 'sv', label: 'sv' },
            ],
          },
        ]}
      />

      {/* Notes List */}
      <section className="px-6 py-12">
        <div className="max-w-[800px] mx-auto">
          {filteredByLanguage.map((note) => {
            const isLanguageActive = languageFilter !== 'all' && languageFilter === note.language;
            return (
              <article
                key={note.id}
                className="group py-8 transition-all duration-200 hover:translate-x-1"
                style={{
                  borderBottom: '1px solid var(--color-border-brutalist)',
                  borderLeft: '2px solid var(--color-page-accent)',
                  paddingLeft: '1rem',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-mono text-xs-custom" style={{ color: 'var(--color-ink-muted)' }}>
                    {note.date}
                  </p>
                  <button
                    type="button"
                    className="pill-badge pill-badge-contextual"
                    onClick={() => setLanguageFilter((prev) => (prev === note.language ? 'all' : note.language))}
                    style={{
                      ['--badge-base-border' as string]: 'var(--color-page-accent)',
                      ['--badge-base-fg' as string]: 'var(--color-page-accent)',
                      ['--badge-hover-bg' as string]: 'var(--color-page-accent)',
                      ['--badge-hover-fg' as string]: '#111111',
                      backgroundColor: isLanguageActive ? 'var(--color-page-accent)' : 'transparent',
                      color: isLanguageActive ? '#111111' : 'var(--color-page-accent)',
                      borderColor: isLanguageActive ? 'var(--color-page-accent)' : 'var(--color-page-accent)',
                    }}
                  >
                    {note.language.toUpperCase()}
                  </button>
                </div>
                <Link to={`/notes/${note.slug}`} style={{ color: 'var(--color-page-accent)' }}>
                  <h3
                    className="font-serif text-xl-custom mb-2 underline-offset-4 hover:underline"
                    style={{ color: 'var(--color-page-accent)' }}
                  >
                    {note.title}
                  </h3>
                </Link>
                  <p className="font-grotesk text-sm-custom line-clamp-3 mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                    {lang === 'de' && note.summaryDe ? note.summaryDe : note.summary}
                  </p>
                <div className="flex flex-wrap gap-1.5">
                  {note.topics.map((topic) => (
                    <span
                      key={topic}
                      className="pill-badge pill-badge-contextual"
                      onClick={() => setTopicFilter((prev) => (prev === topic ? 'all' : topic))}
                      style={{
                        cursor: 'pointer',
                        ['--badge-base-border' as string]: 'var(--color-page-accent)',
                        ['--badge-base-fg' as string]: 'var(--color-page-accent)',
                        ['--badge-hover-bg' as string]: 'var(--color-page-accent)',
                        ['--badge-hover-fg' as string]: '#111111',
                        backgroundColor: topicFilter !== 'all' && topicFilter === topic ? 'var(--color-page-accent)' : 'transparent',
                        color: topicFilter !== 'all' && topicFilter === topic ? '#111111' : 'var(--color-page-accent)',
                        borderColor: 'var(--color-page-accent)',
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}

          {filteredByLanguage.length === 0 && (
            <p className="text-center font-grotesk text-base-custom py-16" style={{ color: 'var(--color-ink-muted)' }}>
              {t.notesPage.noMatches}
            </p>
          )}
        </div>
      </section>

      <NewsletterSignup />
    </div>
  );
}
