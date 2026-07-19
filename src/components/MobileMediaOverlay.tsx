import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import { useMediaQueue } from '@/hooks/useMediaQueue';
import { useVideoLoadState } from '@/hooks/useVideoLoadState';
import { useOverlayMediaPlayback } from '@/hooks/useOverlayMediaPlayback';
import VideoStatusOverlay from '@/components/VideoStatusOverlay';

type MediaQueueState = ReturnType<typeof useMediaQueue>;
type ActiveItem = NonNullable<MediaQueueState['activeItem']>;
type FeedbackType = 'play' | 'pause' | 'muted' | 'unmuted' | 'previous' | 'next' | null;

const MOBILE_SHEET_CLOSE_THRESHOLD = 120;

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

function ProgressBars({ queue, activeIndex, progress }: { queue: MediaQueueState['queue']; activeIndex: number; progress: number }) {
  return (
    <div className="note-media-progress" aria-hidden="true">
      {queue.map((mediaItem, index) => {
        const fill = index < activeIndex ? 1 : index === activeIndex ? progress : 0;

        return (
          <span key={mediaItem.id} className="note-media-progress-bar">
            <span className="note-media-progress-fill" style={{ transform: `scaleX(${fill})` }} />
          </span>
        );
      })}
    </div>
  );
}

function useMobileMediaPlayback({
  activeItem,
  activeIndex,
  isActiveSurface,
  isMuted,
  isPlaying,
  playbackTimes,
  queueLength,
  setActiveIndex,
  setIsPlaying,
  setPlaybackTime,
}: {
  activeItem: ActiveItem | null;
  activeIndex: number;
  isActiveSurface: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  playbackTimes: Record<string, number>;
  queueLength: number;
  setActiveIndex: MediaQueueState['setActiveIndex'];
  setIsPlaying: MediaQueueState['setIsPlaying'];
  setPlaybackTime: MediaQueueState['setPlaybackTime'];
}) {
  return useOverlayMediaPlayback({
    activeItem,
    activeIndex,
    isActiveSurface,
    isMuted,
    isPlaying,
    playbackTimes,
    queueLength,
    setActiveIndex,
    setIsPlaying,
    setPlaybackTime,
  });
}

export default function MobileMediaOverlay() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const {
    queue,
    activeIndex,
    activeItem,
    playbackTimes,
    isDismissed,
    isMuted,
    isPlaying,
    setActiveIndex,
    setIsDismissed,
    setIsMuted,
    setIsPlaying,
    setPlaybackTime,
    resetPlaybackTimes,
  } = useMediaQueue();
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const sheetDragOffsetRef = useRef(0);
  const sheetPointerIdRef = useRef<number | null>(null);
  const sheetDragStartYRef = useRef<number | null>(null);
  const { isMediaPlaying, videoRef, progress, setProgress } = useMobileMediaPlayback({
    activeItem,
    activeIndex,
    isActiveSurface: isMobile,
    isMuted,
    isPlaying,
    playbackTimes,
    queueLength: queue.length,
    setActiveIndex,
    setIsPlaying,
    setPlaybackTime,
  });
  const { isVideoLoading, hasVideoError, retryVideo } = useVideoLoadState({
    videoRef,
    mediaKey: activeItem?.id ?? '',
    isActiveSurface: isMobile,
    isPlaybackActive: isPlaying,
  });
  const isQueueComplete = activeItem ? activeIndex === queue.length - 1 && !isMediaPlaying && progress >= 0.999 : false;
  const isExpanded = !isDismissed;

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    setIsDismissed(true);
    setSheetDragOffset(0);
    sheetDragOffsetRef.current = 0;
  }, [isMobile, pathname, setIsDismissed]);

  useEffect(() => {
    if (!isMobile || !queue.length) {
      document.body.classList.remove('has-mobile-media-player');
      return;
    }

    document.body.classList.add('has-mobile-media-player');
    return () => document.body.classList.remove('has-mobile-media-player');
  }, [isMobile, queue.length]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 560);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  if (!isMobile || !activeItem || !queue.length) {
    return null;
  }

  const showPrevious = activeIndex > 0;
  const showNext = activeIndex < queue.length - 1;
  const shouldShowSourceLink = activeItem.sourceHref ? activeItem.sourceHref !== pathname : false;
  const summaryKicker = shouldShowSourceLink ? t.mediaPlayer.readMore : t.mediaPlayer.fromThisNote;
  const centerHitAreaClassName = [
    'note-media-hit-area',
    'note-media-hit-area-center',
    !showPrevious ? 'is-expanded-left' : '',
    !showNext ? 'is-expanded-right' : '',
    !showPrevious && !showNext ? 'is-fully-expanded' : '',
  ].filter(Boolean).join(' ');

  const openSheet = () => {
    sheetDragOffsetRef.current = 0;
    setSheetDragOffset(0);
    setIsDismissed(false);
  };

  const closeSheet = () => {
    sheetDragOffsetRef.current = 0;
    setSheetDragOffset(0);
    setIsDismissed(true);
  };

  const flashFeedback = (nextFeedback: FeedbackType) => {
    setFeedback(null);
    requestAnimationFrame(() => {
      setFeedback(nextFeedback);
    });
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!isMediaPlaying) {
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

  const resetCurrentItemAndPlay = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
    setPlaybackTime(activeItem.id, 0);
    setIsPlaying(true);
    setProgress(0);
  };

  const goToPrevious = () => {
    if (!showPrevious) {
      return;
    }

    resetCurrentItemAndPlay();
    setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
    flashFeedback('previous');
  };

  const goToNext = () => {
    if (!showNext) {
      return;
    }

    resetCurrentItemAndPlay();
    setActiveIndex((currentIndex) => Math.min(currentIndex + 1, queue.length - 1));
    flashFeedback('next');
  };

  const replayQueue = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
    resetPlaybackTimes();
    setActiveIndex(0);
    setProgress(0);
    setIsPlaying(true);
    setIsMuted(false);
    flashFeedback('play');
  };

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isExpanded) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('button:not(:disabled), a, input, [data-no-sheet-drag="true"]')) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    sheetPointerIdRef.current = event.pointerId;
    sheetDragStartYRef.current = event.clientY;
  };

  const handleSheetPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerId !== sheetPointerIdRef.current || sheetDragStartYRef.current === null) {
      return;
    }

    const nextOffset = Math.max(event.clientY - sheetDragStartYRef.current, 0);
    sheetDragOffsetRef.current = nextOffset;
    setSheetDragOffset(nextOffset);
  };

  const finishSheetDrag = (pointerId: number) => {
    if (pointerId !== sheetPointerIdRef.current) {
      return;
    }

    const shouldClose = sheetDragOffsetRef.current >= MOBILE_SHEET_CLOSE_THRESHOLD;
    sheetPointerIdRef.current = null;
    sheetDragStartYRef.current = null;

    if (shouldClose) {
      closeSheet();
      return;
    }

    sheetDragOffsetRef.current = 0;
    setSheetDragOffset(0);
  };

  const handleSheetPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    finishSheetDrag(event.pointerId);
  };

  const handleSheetPointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    finishSheetDrag(event.pointerId);
  };

  return (
    <div className={`mobile-media-overlay${isExpanded ? ' is-expanded' : ''}`} aria-live="polite">
      {isExpanded ? <button type="button" className="mobile-media-backdrop" onClick={closeSheet} aria-label={t.mediaPlayer.close} /> : null}

      <section
        className={`mobile-media-sheet${isExpanded ? ' is-expanded' : ''}`}
        style={isExpanded ? { transform: `translateY(${sheetDragOffset}px)` } : undefined}
        aria-label={`${activeItem.sourceTitle} ${t.mediaPlayer.media}`}
        onPointerDown={handleSheetPointerDown}
        onPointerMove={handleSheetPointerMove}
        onPointerUp={handleSheetPointerUp}
        onPointerCancel={handleSheetPointerCancel}
      >
        <div
          className="mobile-media-handle"
        >
          <span className="mobile-media-handle-bar" aria-hidden="true" />
        </div>

        <div className="mobile-media-video-button">
          <div className="mobile-media-video-frame">
            <video
              key={activeItem.id}
              ref={videoRef}
              className="mobile-media-video"
              src={activeItem.src}
              poster={activeItem.poster}
              playsInline
              autoPlay
              muted={isMuted}
              preload="metadata"
              aria-label={activeItem.sourceTitle}
            />

            <VideoStatusOverlay
              hasError={hasVideoError}
              isLoading={isVideoLoading}
              loadingLabel={t.mediaPlayer.loading}
              onRetry={retryVideo}
              retryLabel={t.mediaPlayer.retry}
            />
            {isExpanded ? <ProgressBars queue={queue} activeIndex={activeIndex} progress={progress} /> : null}

            {isQueueComplete && !hasVideoError ? (
              <button
                type="button"
                className="note-media-replay-overlay"
                onClick={replayQueue}
                aria-label={t.mediaPlayer.replay}
              >
                <span className="note-media-replay-overlay-icon">
                  <RotateCcw aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.75} />
                </span>
              </button>
            ) : null}

            {isExpanded ? (
              <>
                {showPrevious ? (
                  <button type="button" className="note-media-hit-area note-media-hit-area-left" onClick={goToPrevious} aria-label={t.mediaPlayer.previous}>
                    <ChevronLeft aria-hidden="true" className="note-media-hit-icon-svg" strokeWidth={1.85} />
                  </button>
                ) : null}

                <button
                  type="button"
                  className={centerHitAreaClassName}
                  onClick={isQueueComplete ? replayQueue : togglePlayback}
                  aria-label={isQueueComplete ? t.mediaPlayer.replay : isMediaPlaying ? t.mediaPlayer.pause : t.mediaPlayer.play}
                />

                {showNext ? (
                  <button type="button" className="note-media-hit-area note-media-hit-area-right" onClick={goToNext} aria-label={t.mediaPlayer.next}>
                    <ChevronRight aria-hidden="true" className="note-media-hit-icon-svg" strokeWidth={1.85} />
                  </button>
                ) : null}

                <button type="button" className="note-media-mute-toggle" onClick={toggleMuted} aria-label={isMuted ? t.mediaPlayer.unmute : t.mediaPlayer.mute}>
                  {isMuted ? <VolumeX aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} /> : <Volume2 aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} />}
                </button>

                <div className={`note-media-feedback${feedback ? ' is-visible' : ''}`} aria-hidden="true">
                  {feedback === 'play' ? <PlayIcon /> : null}
                  {feedback === 'pause' ? <PauseIcon /> : null}
                  {feedback === 'muted' ? <VolumeOffIcon /> : null}
                  {feedback === 'unmuted' ? <VolumeOnIcon /> : null}
                  {feedback === 'previous' ? <ChevronLeft aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} /> : null}
                  {feedback === 'next' ? <ChevronRight aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} /> : null}
                </div>
              </>
            ) : (
              <button
                type="button"
                className="mobile-media-video-open"
                onClick={openSheet}
                aria-label={t.mediaPlayer.open}
              />
            )}
          </div>
        </div>

        <div className="mobile-media-summary">
          <div className="mobile-media-meta">
            <p className={`note-media-kicker${!shouldShowSourceLink ? ' is-source-note' : ''}`}>{summaryKicker}</p>
            {shouldShowSourceLink && activeItem.sourceHref ? (
              <Link to={activeItem.sourceHref} className="note-media-caption-link">
                {activeItem.sourceTitle}
              </Link>
            ) : (
              <p className="note-media-caption">{activeItem.sourceTitle}</p>
            )}
            {queue.length > 1 ? <p className="note-media-count">{activeIndex + 1} {t.mediaPlayer.of} {queue.length}</p> : null}
          </div>

          {isExpanded ? (
            <button type="button" className="note-media-corner-control note-media-dismiss mobile-media-summary-dismiss" onClick={closeSheet} aria-label={t.mediaPlayer.close}>
              <Minimize2 aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} />
            </button>
          ) : null}

          <div className="mobile-media-control-row">
            {showPrevious ? (
              <button type="button" className="mobile-media-control" onClick={goToPrevious} aria-label={t.mediaPlayer.previous}>
                <ChevronLeft aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} />
              </button>
            ) : null}

            <button type="button" className="mobile-media-control mobile-media-control-primary" onClick={togglePlayback} aria-label={isMediaPlaying ? t.mediaPlayer.pause : t.mediaPlayer.playWithSound}>
              {isMediaPlaying ? <Pause aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.9} /> : <Play aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.9} />}
            </button>

            {showNext ? (
              <button type="button" className="mobile-media-control" onClick={goToNext} aria-label={t.mediaPlayer.next}>
                <ChevronRight aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} />
              </button>
            ) : null}

            <button type="button" className="mobile-media-control" onClick={isExpanded ? closeSheet : openSheet} aria-label={isExpanded ? t.mediaPlayer.close : t.mediaPlayer.open}>
              {isExpanded ? <Minimize2 aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} /> : <Maximize2 aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} />}
            </button>
          </div>

        </div>

      </section>
    </div>
  );
}
