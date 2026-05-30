import { useLanguage } from '@/hooks/useLanguage';
import { getContactEmail, getContactMailto } from '@/lib/utils';

export default function Imprint() {
  const { lang, t } = useLanguage();
  const email = getContactEmail();
  const mailto = getContactMailto();
  const ccBySaUrl = lang === 'de'
    ? 'https://creativecommons.org/licenses/by-sa/4.0/deed.de'
    : 'https://creativecommons.org/licenses/by-sa/4.0/deed.en';

  return (
    <div className="pt-20 px-6 py-12 md:py-20">
      <section className="max-w-[760px] mx-auto">
        <h1 className="font-serif text-4xl-custom mb-3" style={{ color: 'var(--color-ink)' }}>
          {t.imprint.title}
        </h1>
        <div className="w-16 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-page-accent)' }} />
        <p className="font-grotesk text-base-custom mb-10" style={{ color: 'var(--color-ink-muted)' }}>
          {t.imprint.subtitle}
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.imprint.provider}
            </h2>
            <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink)' }}>
              Bernhard Hayden
              <br />
              Kulturverein Semmelweisklinik c/o GTB – Zentrum der künstlerischen und wissenschaftlichen Emanzipation
              <br />
              Hockegasse 37
              <br />
              1180 Wien
              <br />
              {t.imprint.country}
            </p>
          </section>

          <section>
            <h2 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.imprint.contact}
            </h2>
            <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink)' }}>
              {t.imprint.emailLabel}{' '}
              <a
                href={mailto}
                className="transition-colors hover:underline"
                style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '3px' }}
              >
                {email}
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.imprint.editorialLine}
            </h2>
            <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink)' }}>
              Bernhard Hayden
            </p>
          </section>

          <section>
            <h2 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.imprint.purpose}
            </h2>
            <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink)' }}>
              {t.imprint.purposeText}
            </p>
          </section>

          <section>
            <h2 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.imprint.liability}
            </h2>
            <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink)' }}>
              {t.imprint.liabilityText}
            </p>
          </section>

          <section>
            <h2 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.imprint.links}
            </h2>
            <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink)' }}>
              {t.imprint.linksText}
            </p>
          </section>

          <section>
            <h2 className="font-grotesk text-sm-custom uppercase tracking-widest mb-3" style={{ color: 'var(--color-ink-muted)' }}>
              {t.imprint.copyright}
            </h2>
            <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink)' }}>
              {t.imprint.copyrightTextPrefix}{' '}
              <a
                href={ccBySaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:underline"
                style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '3px' }}
              >
                CC BY-SA 4.0
              </a>
              {t.imprint.copyrightTextSuffix}
            </p>
          </section>

        </div>
      </section>
    </div>
  );
}
