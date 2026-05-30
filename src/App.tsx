import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import { ThemeProvider } from '@/hooks/useTheme';
import { LanguageProvider } from '@/hooks/useLanguage';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Home = lazy(() => import('@/pages/Home'));
const Work = lazy(() => import('@/pages/Work'));
const Archive = lazy(() => import('@/pages/Archive'));
const Notes = lazy(() => import('@/pages/Notes'));
const NoteDetail = lazy(() => import('@/pages/NoteDetail'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Imprint = lazy(() => import('@/pages/Imprint'));

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
  }, [pathname, hash]);

  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const pageAccent = pathname.startsWith('/notes')
    ? 'var(--color-accent-coral)'
    : pathname.startsWith('/work')
      ? 'var(--color-accent-lime)'
      : pathname.startsWith('/about') || pathname.startsWith('/imprint') || pathname.startsWith('/contact')
        ? 'var(--color-accent-cyan)'
      : 'var(--color-accent-lime)';
  const isLimeAccent = pageAccent === 'var(--color-accent-lime)';

  return (
    <ThemeProvider>
      <LanguageProvider>
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
            ['--highlight-invert-hover-fg' as string]: isLimeAccent ? 'var(--color-accent-lime)' : 'var(--accent-highlight-fg)',
          }}
        >
          <ScrollToTop />
          <Navigation />
          <main>
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
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
