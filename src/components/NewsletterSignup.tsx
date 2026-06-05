import { useLanguage } from '@/hooks/useLanguage';

type NewsletterSignupProps = {
  borderedTop?: boolean;
};

export default function NewsletterSignup({ borderedTop = true }: NewsletterSignupProps) {
  const { t } = useLanguage();

  return (
    <section
      className="px-6 py-12"
      style={{ borderTop: borderedTop ? '1px solid var(--color-border-brutalist)' : undefined }}
    >
      <div className="max-w-[600px] mx-auto text-center">
        <p className="font-grotesk text-sm-custom mb-4" style={{ color: 'var(--color-ink-muted)' }}>
          {t.notesPage.newsletter}
        </p>

        <form className="flex flex-wrap gap-2 justify-center" onSubmit={(event) => event.preventDefault()}>
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            className="px-4 py-2 font-mono text-xs-custom outline-hidden"
            style={{
              border: '2px solid var(--color-border-brutalist)',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-cream)',
              color: 'var(--color-ink-muted)',
              minWidth: '240px',
              opacity: 0.65,
              cursor: 'not-allowed',
            }}
            disabled
          />
          <button
            type="submit"
            className="pill-button pill-button-filled"
            style={{
              backgroundColor: 'var(--color-page-accent)',
              borderColor: 'var(--color-page-accent)',
              color: '#111111',
            }}
            disabled
          >
            {t.notesPage.subscribe}
          </button>
        </form>

        <p className="font-mono text-xs-custom mt-2" style={{ color: 'var(--color-ink-muted)' }}>
          {t.notesPage.disabled}
        </p>

        <p className="font-mono text-xs-custom mt-3" style={{ color: 'var(--color-ink-muted)' }}>
          {t.notesPage.privacy}
        </p>

        <div className="highlight-invert-group flex items-center justify-center gap-2 mt-6">
          <svg className="accent-highlight-icon highlight-invert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          <a
            href="/rss.xml"
            className="accent-highlight font-grotesk text-sm-custom transition-colors hover:underline"
            style={{ textUnderlineOffset: '3px', textDecorationColor: 'currentColor' }}
          >
            {t.notesPage.rss}
          </a>
        </div>
      </div>
    </section>
  );
}
