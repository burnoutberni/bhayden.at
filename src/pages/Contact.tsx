import { useLanguage } from '@/hooks/useLanguage';
import { getContactEmail, getContactMailto } from '@/lib/utils';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function Contact() {
  const { t } = useLanguage();
  const email = getContactEmail();
  const mailto = getContactMailto();

  const socialLinks = [
    { label: 'GitHub', url: 'https://github.com/burnoutberni', color: 'var(--color-accent-lime)' },
    { label: 'Mastodon', url: 'https://ohai.social/@nini', color: 'var(--color-accent-cyan)' },
    { label: 'Instagram', url: 'https://instagram.com/burnoutberni', color: 'var(--color-accent-coral)' },
  ];

  return (
    <div className="pt-20">
      <section className="px-6 py-16 md:py-24 text-center">
        <div className="max-w-[640px] mx-auto">
          <h1 className="font-serif text-4xl-custom mb-6" style={{ color: 'var(--color-ink)' }}>
            {t.contact.title}
          </h1>
          <p className="font-grotesk text-base-custom mb-8" style={{ color: 'var(--color-ink-muted)' }}>
            {t.contact.subtitle}
          </p>
          <a
            href={mailto}
            className="accent-highlight font-mono text-2xl-custom inline-block transition-all duration-200 hover:underline"
            style={{
              textUnderlineOffset: '6px',
              textDecorationThickness: '2px',
            }}
          >
            {email}
          </a>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="flex flex-wrap justify-center gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-button transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: link.color,
                padding: '1rem 2rem',
                fontSize: 'var(--text-sm)',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
      <NewsletterSignup borderedTop={false} />
    </div>
  );
}
