import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { notes, noteTopics } from '@/data/notes';
import FilterToolbar from '@/components/FilterToolbar';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function Notes() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const filtersRef = useRef<HTMLElement | null>(null);
  const [topicFilter, setTopicFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'de'>('all');

  useEffect(() => {
    const topicParam = searchParams.get('topic') || searchParams.get('tag');
    const languageParam = searchParams.get('language') || searchParams.get('lang');
    const nextTopic = topicParam && noteTopics.includes(topicParam) ? topicParam : 'all';
    const nextLanguage = languageParam === 'en' || languageParam === 'de' ? languageParam : 'all';
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
          <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink-muted)' }}>
            {t.notesPage.subtitle}
          </p>
        </div>
      </section>

      {/* Topic Filters */}
      <FilterToolbar
        filtersRef={filtersRef}
        containerClassName="max-w-[800px] mx-auto"
        groups={[
          {
            activeKey: topicFilter,
            onSelect: setTopicFilter,
            options: noteTopics.map((topic) => ({ key: topic, label: topic })),
          },
          {
            activeKey: languageFilter,
            onSelect: (key) => setLanguageFilter(key as 'all' | 'en' | 'de'),
            options: [
              { key: 'all', label: 'all languages' },
              { key: 'en', label: 'en' },
              { key: 'de', label: 'de' },
            ],
          },
        ]}
      />

      {/* Notes List */}
      <section className="px-6 py-12">
        <div className="max-w-[800px] mx-auto">
          {filteredByLanguage.map((note) => {
            return (
              <article
                key={note.id}
                className="group py-8 transition-all duration-200 hover:translate-x-1"
                style={{ borderBottom: '1px solid var(--color-border-brutalist)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-mono text-xs-custom" style={{ color: 'var(--color-ink-muted)' }}>
                    {note.date}
                  </p>
                  <span
                    className="pill-badge"
                    style={{ fontSize: '9px', padding: '2px 6px' }}
                  >
                    {note.language.toUpperCase()}
                  </span>
                </div>
                <Link to={`/notes/${note.slug}`}>
                  <h3
                    className="font-grotesk text-xl-custom font-medium mb-2 transition-colors group-hover:text-[var(--color-accent-cyan)]"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {note.title}
                  </h3>
                </Link>
                <p className="font-grotesk text-sm-custom line-clamp-3 mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                  {note.summary}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {note.topics.map((topic) => (
                    <span
                      key={topic}
                      className="pill-badge"
                      onClick={() => setTopicFilter((prev) => (prev === topic ? 'all' : topic))}
                      style={{ fontSize: '9px', padding: '2px 8px', cursor: 'pointer' }}
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
              No notes match this topic.
            </p>
          )}
        </div>
      </section>

      <NewsletterSignup />
    </div>
  );
}
