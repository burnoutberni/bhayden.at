import { Link } from 'react-router';
import { useLocation } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { getContactEmail, getContactMailto } from '@/lib/utils';

export default function Footer() {
  const { lang, t } = useLanguage();
  const { pathname } = useLocation();
  const isContactPage = pathname === '/contact';
  const email = getContactEmail();
  const mailto = getContactMailto();
  const ccBySaUrl = lang === 'de'
    ? 'https://creativecommons.org/licenses/by-sa/4.0/deed.de'
    : 'https://creativecommons.org/licenses/by-sa/4.0/deed.en';

  const socialLinks = [
    { label: 'GitHub', url: 'https://github.com/burnoutberni', color: 'var(--color-accent-lime)' },
    { label: 'Mastodon', url: 'https://ohai.social/@nini', color: 'var(--color-accent-cyan)' },
    { label: 'Instagram', url: 'https://instagram.com/burnoutberni', color: 'var(--color-accent-coral)' },
  ];

  const navLinks = [
    { label: t.nav.work, path: '/work' },
    { label: t.nav.notes, path: '/notes' },
    { label: t.nav.about, path: '/about' },
    { label: t.nav.archive, path: '/archive' },
    { label: t.nav.contact, path: '/contact' },
  ];

  return (
    <footer
      className="w-full"
      style={{
        borderTop: '2px solid var(--color-border-brutalist)',
        backgroundColor: 'var(--color-cream)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 text-center">
        {!isContactPage && (
          <div className="mb-12">
            <p className="font-serif text-3xl-custom mb-3" style={{ color: 'var(--color-ink)' }}>
              {t.footer.cta}
            </p>
            <a
              href={mailto}
              className="accent-highlight font-mono text-xl-custom md:text-2xl-custom inline-block mb-6 transition-all duration-200 hover:underline"
              style={{
                textUnderlineOffset: '6px',
                textDecorationThickness: '2px',
                textDecorationColor: 'currentColor',
              }}
            >
              {email}
            </a>

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
                    padding: '0.85rem 1.6rem',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {!isContactPage && (
          <div className="flex flex-wrap justify-center gap-1 mb-5">
            {navLinks.map((link, i) => (
              <span key={link.path} className="flex items-center">
                <Link
                  to={link.path}
                  className="font-grotesk text-xs-custom uppercase tracking-widest transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-ink)' }}
                >
                  {link.label}
                </Link>
                {i < navLinks.length - 1 && (
                  <span className="mx-2 opacity-40" style={{ color: 'var(--color-ink-muted)' }}>/</span>
                )}
              </span>
            ))}
          </div>
        )}

        <p className={`font-mono text-xs-custom ${isContactPage ? 'mb-2' : 'mb-3'}`} style={{ color: 'var(--color-ink-muted)' }}>
          {t.footer.finePrint}
        </p>
        <p className="font-mono text-xs-custom" style={{ color: 'var(--color-ink-muted)' }}>
          {t.footer.copyrightName}.{' '}
          <Link
            to="/imprint"
            className="text-[10px] tracking-wide transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            {t.footer.imprint}
          </Link>
          . {t.footer.copyrightLicensePrefix}{' '}
          <a
            href={ccBySaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            CC BY-SA 4.0
          </a>{' '}
          {t.footer.copyrightLicenseSuffix}
        </p>
      </div>
    </footer>
  );
}
