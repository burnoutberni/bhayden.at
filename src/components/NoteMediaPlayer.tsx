import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import { useVideoLoadState } from '@/hooks/useVideoLoadState';
import type { NoteMediaItem } from '@/data/noteMedia';
import VideoStatusOverlay from '@/components/VideoStatusOverlay';

interface NoteMediaPlayerProps {
  mediaItems: NoteMediaItem[];
  noteTitle: string;
}

type FeedbackType = 'play' | 'pause' | 'muted' | 'unmuted' | null;

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="note-media-icon-svg">
      <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="note-media-icon-svg">
      <path d="M8 6h3v12H8zM13 6h3v12h-3z" fill="currentColor" />
    </svg>
  );
}

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="note-media-icon-svg">
      <path d="M5 14h3.5L13 18V6L8.5 10H5z" fill="currentColor" />
      <path d="M16 9.25a4.25 4.25 0 0 1 0 5.5M18 7a7.25 7.25 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="note-media-icon-svg">
      <path d="M5 14h3.5L13 18V6L8.5 10H5z" fill="currentColor" />
      <path d="m16 9 5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="note-media-hit-icon-svg">
      <path d="m14.5 6-5 6 5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="note-media-hit-icon-svg">
      <path d="m9.5 6 5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function NoteMediaPlayer({ mediaItems, noteTitle }: NoteMediaPlayerProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shouldResumeOnVisibleRef = useRef(false);
  const shouldResumeOnReturnRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>(null);

  const activeMediaItem = mediaItems[activeIndex];
  const hasMultipleMediaItems = mediaItems.length > 1;
  const { isVideoLoading, hasVideoError, retryVideo } = useVideoLoadState({
    videoRef,
    mediaKey: activeMediaItem?.src ?? '',
    isPlaybackActive: isPlaying,
  });

  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(true);
    setProgress(0);
  }, [mediaItems]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (!isPlaying) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setIsPlaying(false);
      });
    }
  }, [activeIndex, isMuted, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) {
        setProgress(0);
        return;
      }

      setProgress(Math.min(video.currentTime / video.duration, 1));

      if (!video.paused && !video.ended) {
        animationFrameRef.current = window.requestAnimationFrame(updateProgress);
      }
    };

    const stopProgressLoop = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePlaying = () => {
      stopProgressLoop();
      updateProgress();
    };
    const handlePause = () => {
      stopProgressLoop();
      setIsPlaying(false);
    };
    const handleLoadedMetadata = () => updateProgress();
    const handleError = () => {
      stopProgressLoop();
      setIsPlaying(false);
    };
    const handleEnded = () => {
      stopProgressLoop();
      setProgress(1);
      setActiveIndex((currentIndex) => {
        const nextIndex = currentIndex >= mediaItems.length - 1 ? currentIndex : currentIndex + 1;
        const shouldStop = currentIndex >= mediaItems.length - 1;

        if (shouldStop) {
          requestAnimationFrame(() => setIsPlaying(false));
        } else {
          requestAnimationFrame(() => {
            setProgress(0);
            setIsPlaying(true);
          });
        }

        return nextIndex;
      });
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      stopProgressLoop();
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [activeMediaItem.src, mediaItems.length]);

  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          if (shouldResumeOnVisibleRef.current) {
            const playPromise = video.play();
            if (playPromise) {
              playPromise.catch(() => {
                setIsPlaying(false);
              });
            }
          }
          shouldResumeOnVisibleRef.current = false;
          return;
        }

        shouldResumeOnVisibleRef.current = !video.paused;
        video.pause();
      },
      { threshold: 0.6 },
    );

    observer.observe(container);
    return () => {
      if (video && !video.paused) {
        video.pause();
      }
      observer.disconnect();
    };
  }, [activeIndex, isMobile]);

  useEffect(() => {
    const pausePlayback = () => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      shouldResumeOnReturnRef.current = true;
      video.pause();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pausePlayback();
        return;
      }

      const video = videoRef.current;
      if (shouldResumeOnReturnRef.current && video) {
        const playPromise = video.play();
        if (playPromise) {
          playPromise
            .then(() => {
              shouldResumeOnReturnRef.current = false;
            })
            .catch(() => {
              setIsPlaying(false);
            });
          return;
        }
      }

      shouldResumeOnReturnRef.current = false;
    };

    const handleFocus = () => {
      const video = videoRef.current;
      if (shouldResumeOnReturnRef.current && video && !document.hidden) {
        const playPromise = video.play();
        if (playPromise) {
          playPromise
            .then(() => {
              shouldResumeOnReturnRef.current = false;
            })
            .catch(() => {
              setIsPlaying(false);
            });
          return;
        }
      }

      shouldResumeOnReturnRef.current = false;
    };

    window.addEventListener('blur', pausePlayback);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', pausePlayback);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => setFeedback(null), 560);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  if (!activeMediaItem) {
    return null;
  }

  if (!isMobile) {
    return null;
  }

  const flashFeedback = (nextFeedback: FeedbackType) => {
    setFeedback(null);
    requestAnimationFrame(() => {
      setFeedback(nextFeedback);
    });
  };

  const goToPrevious = () => {
    if (activeIndex === 0) return;
    setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
    setIsPlaying(true);
    setProgress(0);
  };

  const goToNext = () => {
    if (activeIndex === mediaItems.length - 1) return;
    setActiveIndex((currentIndex) => Math.min(currentIndex + 1, mediaItems.length - 1));
    setIsPlaying(true);
    setProgress(0);
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isPlaying) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then(() => {
            flashFeedback('play');
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
      return;
    }

    video.pause();
    flashFeedback('pause');
  };

  const toggleMuted = () => {
    setIsMuted((current) => {
      const nextValue = !current;
      requestAnimationFrame(() => flashFeedback(nextValue ? 'muted' : 'unmuted'));
      return nextValue;
    });
  };

  const containerClassName = 'note-media-player note-media-player-mobile';

  const centerHitAreaClassName = [
    'note-media-hit-area',
    'note-media-hit-area-center',
    activeIndex === 0 ? 'is-expanded-left' : '',
    activeIndex === mediaItems.length - 1 ? 'is-expanded-right' : '',
    !hasMultipleMediaItems ? 'is-fully-expanded' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside ref={containerRef} className={containerClassName} aria-label={`${noteTitle} ${t.mediaPlayer.media}`}>
      <>
        <div className="note-media-shell">
          <div className="note-media-video-wrap">
            <video
              key={activeMediaItem.src}
              ref={videoRef}
              className="note-media-video"
              src={activeMediaItem.src}
              poster={activeMediaItem.poster}
              playsInline
              autoPlay
              muted={isMuted}
              preload="metadata"
              aria-label={noteTitle}
            />

            <VideoStatusOverlay
              hasError={hasVideoError}
              isLoading={isVideoLoading}
              loadingLabel={t.mediaPlayer.loading}
              onRetry={retryVideo}
              retryLabel={t.mediaPlayer.retry}
            />

            <div className="note-media-progress" aria-hidden="true">
              {mediaItems.map((mediaItem, index) => {
                const fill = index < activeIndex ? 1 : index === activeIndex ? progress : 0;

                return (
                  <span key={mediaItem.src} className="note-media-progress-bar">
                    <span className="note-media-progress-fill" style={{ transform: `scaleX(${fill})` }} />
                  </span>
                );
              })}
            </div>

            {hasMultipleMediaItems ? (
              <button
                type="button"
                className="note-media-hit-area note-media-hit-area-left"
                onClick={goToPrevious}
                disabled={activeIndex === 0}
                aria-label={t.mediaPlayer.previous}
              >
                <ChevronLeftIcon />
              </button>
            ) : null}

            <button
              type="button"
              className={centerHitAreaClassName}
              onClick={togglePlayback}
              aria-label={isPlaying ? t.mediaPlayer.pause : t.mediaPlayer.play}
            />

            {hasMultipleMediaItems ? (
              <button
                type="button"
                className="note-media-hit-area note-media-hit-area-right"
                onClick={goToNext}
                disabled={activeIndex === mediaItems.length - 1}
                aria-label={t.mediaPlayer.next}
              >
                <ChevronRightIcon />
              </button>
            ) : null}

            <button
              type="button"
              className="note-media-mute-toggle"
              onClick={toggleMuted}
              aria-label={isMuted ? t.mediaPlayer.unmute : t.mediaPlayer.mute}
            >
              {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
            </button>

            <div className={`note-media-feedback${feedback ? ' is-visible' : ''}`} aria-hidden="true">
              {feedback === 'play' ? <PlayIcon /> : null}
              {feedback === 'pause' ? <PauseIcon /> : null}
              {feedback === 'muted' ? <VolumeOffIcon /> : null}
              {feedback === 'unmuted' ? <VolumeOnIcon /> : null}
            </div>
          </div>

          <div className="note-media-chrome">
            <div className="note-media-meta">
              <p className="note-media-kicker is-source-note">{t.mediaPlayer.fromThisNote}</p>
              <p className="note-media-caption">{noteTitle}</p>
            </div>
          </div>
        </div>

        {hasMultipleMediaItems ? (
          <p className="note-media-count">{activeIndex + 1} {t.mediaPlayer.of} {mediaItems.length}</p>
        ) : null}
      </>
    </aside>
  );
}
