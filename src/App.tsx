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
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-ink)' }}>
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
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
