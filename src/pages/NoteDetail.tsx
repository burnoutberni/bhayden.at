import { useEffect, useMemo, useState } from 'react';
import type {
  AnchorHTMLAttributes,
  ComponentType,
  HTMLAttributes,
  LiHTMLAttributes,
  OlHTMLAttributes,
} from 'react';
import { Link, useParams } from 'react-router';
import { getNoteBySlug } from '@/data/notes';
import { getNoteMedia } from '@/data/noteMedia';
import NewsletterSignup from '@/components/NewsletterSignup';
import NoteMediaPlayer from '@/components/NoteMediaPlayer';
import { useLanguage } from '@/hooks/useLanguage';
import { useMediaQueue } from '@/hooks/useMediaQueue';

const mdxComponents = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => <h1 className="font-serif text-3xl-custom mb-4 mt-8" style={{ color: 'var(--color-ink)' }} {...props} />,
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => <h2 className="font-serif text-2xl-custom mb-3 mt-8" style={{ color: 'var(--color-ink)' }} {...props} />,
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => <h3 className="font-grotesk text-xl-custom mb-3 mt-6" style={{ color: 'var(--color-ink)' }} {...props} />,
  p: (props: HTMLAttributes<HTMLParagraphElement>) => <p className="font-grotesk text-base-custom leading-relaxed mb-5" style={{ color: 'var(--color-ink)' }} {...props} />,
  ul: (props: HTMLAttributes<HTMLUListElement>) => <ul className="list-disc pl-6 mb-5 space-y-2" {...props} />,
  ol: (props: OlHTMLAttributes<HTMLOListElement>) => <ol className="list-decimal pl-6 mb-5 space-y-2" {...props} />,
  li: (props: LiHTMLAttributes<HTMLLIElement>) => <li className="font-grotesk text-base-custom leading-relaxed" style={{ color: 'var(--color-ink)' }} {...props} />,
  a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="underline hover:no-underline" style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '3px' }} {...props} />,
  blockquote: (props: HTMLAttributes<HTMLElement>) => <blockquote className="border-l-2 pl-4 italic my-5" style={{ borderColor: 'var(--color-border-brutalist)', color: 'var(--color-ink-muted)' }} {...props} />,
  code: (props: HTMLAttributes<HTMLElement>) => <code className="font-mono text-xs-custom px-1 py-0.5" style={{ backgroundColor: 'var(--color-editor-bg)', borderRadius: '4px' }} {...props} />,
  pre: (props: HTMLAttributes<HTMLPreElement>) => <pre className="p-4 mb-5 overflow-x-auto" style={{ backgroundColor: 'var(--color-editor-bg)', border: '1px solid var(--color-border-brutalist)', borderRadius: 'var(--radius-soft)' }} {...props} />,
  img: (props: HTMLAttributes<HTMLImageElement>) => <img className="note-img" {...props} />,
  figure: (props: HTMLAttributes<HTMLElement>) => <figure className="note-figure" {...props} />,
  figcaption: (props: HTMLAttributes<HTMLElement>) => <figcaption className="note-figcaption" {...props} />,
};

export default function NoteDetail() {
  const { t, lang } = useLanguage();
  const { enqueueSource } = useMediaQueue();
  const { slug } = useParams();
  const note = slug ? getNoteBySlug(slug) : undefined;
  const mediaItems = useMemo(() => (slug ? getNoteMedia(slug) : []), [slug]);
  const [MdxContent, setMdxContent] = useState<ComponentType<{ components?: typeof mdxComponents }> | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const content = useMemo(() => note?.body || '', [note?.body]);

  useEffect(() => {
    if (!slug || !note || !mediaItems.length) return;
    enqueueSource(slug, note.title, mediaItems, `/notes/${slug}`);
  }, [enqueueSource, note, mediaItems, slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadMdx() {
      if (!note) {
        setMdxContent(null);
        setRenderError(null);
        return;
      }

      try {
        const [{ evaluate }, jsxRuntime] = await Promise.all([
          import('@mdx-js/mdx'),
          import('react/jsx-runtime'),
        ]);

        const evaluated = await evaluate(content, {
          ...jsxRuntime,
          development: false,
        });

        if (!cancelled) {
          setMdxContent(() => evaluated.default as ComponentType<{ components?: typeof mdxComponents }>);
          setRenderError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : 'Failed to render note content.');
          setMdxContent(null);
        }
      }
    }

    void loadMdx();
    return () => {
      cancelled = true;
    };
  }, [content, note]);

  if (!note) {
    return (
      <div className="pt-20 px-6 py-16">
        <div className="max-w-[800px] mx-auto">
          <h1 className="font-serif text-3xl-custom mb-4" style={{ color: 'var(--color-ink)' }}>{t.noteDetail.notFound}</h1>
          <Link to="/notes" className="font-grotesk text-sm-custom inline-flex items-center link-with-arrow" style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '4px' }}>
            <span className="link-arrow link-arrow-left" aria-hidden="true">←</span>
            <span className="link-label">{t.noteDetail.backToAll}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <section className="px-6 py-12 md:py-16" style={{ borderBottom: '2px solid var(--color-border-brutalist)' }}>
        <div className="max-w-[800px] mx-auto">
          <Link to="/notes" className="font-mono text-xs-custom uppercase inline-flex items-center link-with-arrow" style={{ color: 'var(--color-page-accent)', textUnderlineOffset: '4px' }}>
            <span className="link-arrow link-arrow-left" aria-hidden="true">←</span>
            <span className="link-label">{t.noteDetail.backToAll}</span>
          </Link>
          <p className="font-mono text-xs-custom mt-4 mb-2" style={{ color: 'var(--color-ink-muted)' }}>{note.date}</p>
          <h1 className="font-serif text-2xl-custom mb-3" style={{ color: 'var(--color-ink)' }}>{note.title}</h1>
          <p className="font-grotesk text-base-custom" style={{ color: 'var(--color-ink-muted)' }}>
            {lang === 'de' && note.summaryDe ? note.summaryDe : note.summary}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {note.topics.map((topic) => (
              <Link
                key={topic}
                to={`/notes?topic=${encodeURIComponent(topic)}`}
                className="pill-badge pill-badge-underline-hover"
                style={{ borderColor: 'var(--color-page-accent)', color: 'var(--color-page-accent)' }}
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <article className="max-w-[800px] mx-auto">
          {mediaItems.length ? <NoteMediaPlayer mediaItems={mediaItems} noteTitle={note.title} /> : null}
          {renderError ? (
            <p className="font-grotesk text-sm-custom" style={{ color: 'var(--color-ink-muted)' }}>
              {renderError}
            </p>
          ) : MdxContent ? (
            <MdxContent components={mdxComponents} />
          ) : (
            <p className="font-grotesk text-sm-custom" style={{ color: 'var(--color-ink-muted)' }}>
              {t.noteDetail.loading}
            </p>
          )}
        </article>
      </section>
      <NewsletterSignup />
    </div>
  );
}
