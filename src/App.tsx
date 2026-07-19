import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { ThemeProvider } from '@/hooks/useTheme';
import { LanguageProvider } from '@/hooks/useLanguage';
import { MediaQueueProvider } from '@/hooks/useMediaQueue';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import DesktopMediaOverlay from '@/components/DesktopMediaOverlay';
import MobileMediaOverlay from '@/components/MobileMediaOverlay';
import Home from '@/pages/Home';

const Work = lazy(() => import('@/pages/Work'));
const Archive = lazy(() => import('@/pages/Archive'));
const Notes = lazy(() => import('@/pages/Notes'));
const NoteDetail = lazy(() => import('@/pages/NoteDetail'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Imprint = lazy(() => import('@/pages/Imprint'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const ACCENT = {
  coral: 'var(--color-accent-coral)',
  lime: 'var(--color-accent-lime)',
  cyan: 'var(--color-accent-cyan)',
} as const;

function getPageAccent(pathname: string) {
  if (pathname.startsWith('/notes')) return ACCENT.coral;
  if (pathname === '/archive' || pathname === '/about' || pathname === '/contact' || pathname === '/imprint') return ACCENT.cyan;
  return ACCENT.lime;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = decodeURIComponent(hash.replace('#', ''));
      requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (target) {
          const header = document.querySelector('header');
          const stickyFilters = document.querySelector('[data-sticky-filters="true"]');
          const headerHeight = header ? header.getBoundingClientRect().height : 0;
          const filtersHeight = stickyFilters ? stickyFilters.getBoundingClientRect().height : 0;
          const offset = headerHeight + filtersHeight + 16;
          const targetTop = target.getBoundingClientRect().top + window.scrollY;

          window.scrollTo({
            top: Math.max(targetTop - offset, 0),
            behavior: 'auto',
          });
        }
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });

    requestAnimationFrame(() => {
      const main = document.getElementById('main-content');
      if (main) {
        main.focus();
      }
    });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const pageAccent = getPageAccent(pathname);
  const isLimeAccent = pageAccent === ACCENT.lime;

  return (
    <ThemeProvider>
      <LanguageProvider>
        <MediaQueueProvider>
          <div
            className="min-h-screen"
            style={{
              backgroundColor: 'var(--color-cream)',
              color: 'var(--color-ink)',
              ['--color-page-accent' as string]: pageAccent,
              ['--accent-highlight-fg' as string]: isLimeAccent ? 'var(--color-dark-void)' : 'var(--color-page-accent)',
              ['--accent-highlight-bg' as string]: isLimeAccent ? 'var(--color-page-accent)' : 'transparent',
              ['--accent-highlight-padding' as string]: '0',
              ['--accent-highlight-icon-padding' as string]: '0',
              ['--highlight-invert-hover-bg' as string]: isLimeAccent ? 'var(--color-dark-void)' : 'transparent',
              ['--highlight-invert-hover-fg' as string]: isLimeAccent ? ACCENT.lime : 'var(--accent-highlight-fg)',
              ['--note-media-launcher-played-segment' as string]: isLimeAccent ? 'color-mix(in srgb, var(--color-dark-void) 68%, var(--color-page-accent) 32%)' : '#ffffff',
            }}
          >
            <ScrollToTop />
            <a
              href="#main-content"
              className="skip-link"
            >
              Skip to main content
            </a>
            <Navigation />
            <main id="main-content" tabIndex={-1}>
              <Suspense
                fallback={
                  <div className="px-6 py-16">
                    <div className="max-w-[800px] mx-auto font-grotesk text-sm-custom" style={{ color: 'var(--color-ink-muted)' }}>
                      Loading...
                    </div>
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/work" element={<Work />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/notes/:slug" element={<NoteDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/imprint" element={<Imprint />} />
                  <Route path="/404.html" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <DesktopMediaOverlay />
            <MobileMediaOverlay />
          </div>
        </MediaQueueProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
