import { useMemo } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { bioData, projects } from '@/data/content';
import { getPressEmail, getPressMailto } from '@/lib/utils';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function About() {
  const { lang, t } = useLanguage();
  const pressEmail = getPressEmail();
  const pressMailto = getPressMailto();
  const ccBySaUrl = lang === 'de'
    ? 'https://creativecommons.org/licenses/by-sa/4.0/deed.de'
    : 'https://creativecommons.org/licenses/by-sa/4.0/deed.en';

  const bio = bioData;
  const careItems = t.about.careItems;
  const pressTopics = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.topics)))
      .sort((a, b) => a.localeCompare(b)),
    []
  );

  return (
    <div className="pt-20">
      {/* Hero / Portrait Section */}
      <section className="px-6 py-12 md:py-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Portrait */}
          <div>
            <div
              className="aspect-square overflow-hidden"
              style={{
                border: '2px solid var(--color-border-brutalist)',
                borderRadius: 'var(--radius-sharp)',
              }}
            >
              <img
                src="/static/portrait.jpg"
                alt={t.about.press.portraitAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-mono text-xs-custom mt-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.about.press.portraitLabel} Lena Holzerbauer,{' '}
              <a
                href={ccBySaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                CC BY-SA 4.0
              </a>
            </p>
          </div>

          {/* Bio Header */}
          <div className="pt-4">
            <h1 className="font-serif text-3xl-custom mb-2" style={{ color: 'var(--color-ink)' }}>
              {t.about.whoIAm}
            </h1>
            <div className="w-16 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-page-accent)' }} />
            <p className="font-grotesk text-lg-custom mb-8" style={{ color: 'var(--color-ink-muted)' }}>
              {t.about.subtitle}
            </p>

            {/* Bio Narrative */}
            <div className="max-w-[700px]">
              <p className="font-grotesk text-base-custom leading-relaxed mb-6" style={{ color: 'var(--color-ink)' }}>
                {t.about.bio}
              </p>
              <p className="font-grotesk text-base-custom leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                {t.about.dayjob}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What I Care About */}
      <section className="px-6 py-16 md:py-24" style={{ borderTop: '1px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-serif text-3xl-custom mb-12" style={{ color: 'var(--color-ink)' }}>
            {t.about.whatICareAbout}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careItems.map((item, i) => (
              <div
                key={i}
                className="p-6 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--color-editor-bg)',
                  border: '2px solid var(--color-border-brutalist)',
                  borderRadius: 'var(--radius-soft)',
                }}
              >
                <h3 className="font-grotesk text-xl-custom font-medium mb-2" style={{ color: 'var(--color-ink)' }}>
                  {item.title}
                </h3>
                <p className="font-grotesk text-sm-custom" style={{ color: 'var(--color-ink-muted)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press / Speaking */}
      <section className="px-6 py-16 md:py-24" style={{ borderTop: '1px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-serif text-2xl-custom mb-8" style={{ color: 'var(--color-ink)' }}>
            {t.about.press.title}
          </h2>

          {/* Short Bio */}
          <div className="mb-8">
            <h3 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.about.press.shortBio}
            </h3>
            <div
              className="p-5"
              style={{
                backgroundColor: 'var(--color-editor-bg)',
                borderRadius: 'var(--radius-soft)',
                border: '1px solid var(--color-border-brutalist)',
              }}
            >
              <p className="font-grotesk text-sm-custom" style={{ color: 'var(--color-ink)' }}>
                {lang === 'de' ? bio.shortDe : bio.short}
              </p>
            </div>
          </div>

          {/* Medium Bio */}
          <div className="mb-8">
            <h3 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.about.press.mediumBio}
            </h3>
            <div
              className="p-5"
              style={{
                backgroundColor: 'var(--color-editor-bg)',
                borderRadius: 'var(--radius-soft)',
                border: '1px solid var(--color-border-brutalist)',
              }}
            >
              <p className="font-grotesk text-sm-custom whitespace-pre-line" style={{ color: 'var(--color-ink)' }}>
                {lang === 'de' ? bio.mediumDe : bio.medium}
              </p>
            </div>
          </div>

          {/* Topics */}
          <div className="mb-8">
            <h3 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.about.press.topics}
            </h3>
            <div className="flex flex-wrap gap-2">
              {pressTopics.map((topic) => (
                <Link
                  key={topic}
                  to={`/work?topic=${encodeURIComponent(topic)}`}
                  className="pill-badge pill-badge-contextual"
                  style={{
                    ['--badge-hover-bg' as string]: 'var(--color-page-accent)',
                  }}
                >
                  {topic}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="font-grotesk text-sm-custom mb-2" style={{ color: 'var(--color-ink)' }}>
              <a
                href="/static/portrait.jpg"
                download="bernhard-hayden-portrait.jpg"
                className="transition-colors hover:underline"
                style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '3px' }}
              >
                {t.about.press.downloadPortrait}
              </a>
            </p>
            <p className="font-mono text-xs-custom mb-4" style={{ color: 'var(--color-ink-muted)' }}>
              {t.about.press.copyrightLabel} Lena Holzerbauer,{' '}
              <a
                href={ccBySaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                CC BY-SA 4.0
              </a>
            </p>
            <p className="font-grotesk text-sm-custom" style={{ color: 'var(--color-ink)' }}>
              {t.about.press.contact}{' '}
              <a
                href={pressMailto}
                className="transition-colors hover:underline"
                style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '3px' }}
              >
                {pressEmail}
              </a>
            </p>
          </div>
        </div>
      </section>
      <NewsletterSignup />
    </div>
  );
}
