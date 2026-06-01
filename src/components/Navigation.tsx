import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';

export default function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: t.nav.work, path: '/work', accent: 'var(--color-accent-lime)' },
    { label: t.nav.notes, path: '/notes', accent: 'var(--color-accent-coral)' },
    { label: t.nav.about, path: '/about', accent: 'var(--color-accent-cyan)' },
    { label: t.nav.contact, path: '/contact', accent: 'var(--color-accent-cyan)' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const onHero = location.pathname === '/' && !scrolled && !mobileOpen;
  const navTextColor = onHero ? '#F5F1E8' : 'var(--color-ink)';
  const navMutedColor = onHero ? 'rgba(245, 241, 232, 0.78)' : 'var(--color-ink-muted)';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'var(--color-cream)' : 'transparent',
        borderBottom: scrolled ? '2px solid var(--color-border-brutalist)' : '2px solid transparent',
      }}
    >
      <nav className="flex items-center justify-between px-6 py-3 max-w-[1400px] mx-auto" aria-label="Primary">
        {/* Logo */}
        <Link
          to="/"
          className="font-grotesk text-sm-custom uppercase tracking-widest font-medium hover:opacity-70 transition-opacity"
          style={{ color: navTextColor }}
        >
          Bernhard Hayden
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              aria-current={isActive(link.path) ? 'page' : undefined}
              className="footer-page-link-trigger px-3 py-1.5 font-grotesk text-xs-custom uppercase tracking-widest transition-all duration-200"
              style={{
                ['--footer-link-base-color' as string]: isActive(link.path) ? navTextColor : navMutedColor,
                ['--footer-link-accent' as string]: link.accent,
                ['--footer-link-hover-bg' as string]: link.accent === 'var(--color-accent-lime)' ? 'var(--color-accent-lime)' : 'transparent',
                ['--footer-link-hover-fg' as string]: link.accent === 'var(--color-accent-lime)' ? 'var(--color-dark-void)' : link.accent,
                fontWeight: isActive(link.path) ? 600 : 400,
              }}
            >
              <span className="footer-page-link">{link.label}</span>
            </Link>
          ))}

          {/* Language Toggle */}
          <div
            className="flex items-center ml-4 px-2 py-1 rounded-full font-mono text-xs-custom"
            style={{
              backgroundColor: onHero ? 'rgba(245, 241, 232, 0.92)' : 'var(--color-page-accent)',
              color: '#111111',
              border: '1px solid rgba(17, 17, 17, 0.24)',
            }}
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              className="px-2 py-0.5 transition-opacity hover:underline focus-visible:underline"
              aria-pressed={lang === 'en'}
              style={{ fontWeight: lang === 'en' ? 700 : 400, opacity: lang === 'en' ? 1 : 0.6 }}
            >
              EN
            </button>
            <span className="opacity-50">|</span>
            <button
              type="button"
              onClick={() => setLang('de')}
              className="px-2 py-0.5 transition-opacity hover:underline focus-visible:underline"
              aria-pressed={lang === 'de'}
              style={{ fontWeight: lang === 'de' ? 700 : 400, opacity: lang === 'de' ? 1 : 0.6 }}
            >
              DE
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="ml-3 p-2 rounded-full transition-all duration-200 hover:opacity-70"
            aria-label={lang === 'de' ? 'Theme umschalten' : 'Toggle theme'}
            style={{ color: navTextColor }}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={lang === 'de' ? 'Menü umschalten' : 'Toggle menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <div className="w-5 h-0.5 mb-1.5 transition-all" style={{ backgroundColor: navTextColor }} aria-hidden="true" />
          <div className="w-5 h-0.5 mb-1.5 transition-all" style={{ backgroundColor: navTextColor }} aria-hidden="true" />
          <div className="w-5 h-0.5 transition-all" style={{ backgroundColor: navTextColor }} aria-hidden="true" />
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden absolute top-full left-0 right-0 border-b-2 px-6 py-4 flex flex-col gap-2"
          style={{
            backgroundColor: 'var(--color-cream)',
            borderColor: 'var(--color-border-brutalist)',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              aria-current={isActive(link.path) ? 'page' : undefined}
              className="footer-page-link-trigger py-2 font-grotesk text-sm uppercase tracking-widest"
              style={{
                ['--footer-link-base-color' as string]: 'var(--color-ink)',
                ['--footer-link-accent' as string]: link.accent,
                ['--footer-link-hover-bg' as string]: link.accent === 'var(--color-accent-lime)' ? 'var(--color-accent-lime)' : 'transparent',
                ['--footer-link-hover-fg' as string]: link.accent === 'var(--color-accent-lime)' ? 'var(--color-dark-void)' : link.accent,
              }}
            >
              <span className="footer-page-link">{link.label}</span>
            </Link>
          ))}
          <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: 'var(--color-border-brutalist)' }}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLang('en')} className="font-mono text-xs hover:underline focus-visible:underline" aria-pressed={lang === 'en'} style={{ fontWeight: lang === 'en' ? 700 : 400, color: 'var(--color-ink)' }}>EN</button>
              <span className="font-mono text-xs opacity-50">|</span>
              <button type="button" onClick={() => setLang('de')} className="font-mono text-xs hover:underline focus-visible:underline" aria-pressed={lang === 'de'} style={{ fontWeight: lang === 'de' ? 700 : 400, color: 'var(--color-ink)' }}>DE</button>
            </div>
            <button type="button" onClick={toggleTheme} className="font-mono text-xs uppercase" style={{ color: 'var(--color-ink)' }}>{theme === 'dark' ? t.common.light : t.common.dark}</button>
          </div>
        </div>
      )}
    </header>
  );
}
