import { useEffect } from 'react';
import { Link } from 'react-router';

const defaultTitle = 'Bernhard Hayden - Activism, civic tech, open knowledge & digital rights';

export default function NotFound() {
  useEffect(() => {
    document.title = '404 - Page not found | Bernhard Hayden';

    return () => {
      document.title = defaultTitle;
    };
  }, []);

  return (
    <div
      className="pt-20 px-6 py-16"
      style={{ ['--color-page-accent' as string]: 'var(--color-accent-coral)' }}
    >
      <div className="max-w-[800px] mx-auto">
        <p className="font-mono text-xs-custom mb-2" style={{ color: 'var(--color-ink-muted)' }}>404</p>
        <h1 className="font-serif text-3xl-custom mb-4" style={{ color: 'var(--color-ink)' }}>Page not found</h1>
        <p className="font-grotesk text-base-custom mb-6" style={{ color: 'var(--color-ink-muted)' }}>
          The page you requested does not exist or has moved.
        </p>
        <Link
          to="/"
          className="font-grotesk text-sm-custom inline-flex items-center link-with-arrow"
          style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '4px' }}
        >
          <span className="link-arrow link-arrow-left" aria-hidden="true">←</span>
          <span className="link-label">Back to home</span>
        </Link>
      </div>
    </div>
  );
}
