import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import { useMediaQueue } from '@/hooks/useMediaQueue';

type FeedbackType = 'play' | 'pause' | 'muted' | 'unmuted' | null;
type Position = { x: number; y: number };
type DragStart = { pointerX: number; pointerY: number; x: number; y: number };
type MediaQueueState = ReturnType<typeof useMediaQueue>;
type ActiveItem = NonNullable<MediaQueueState['activeItem']>;

const DESKTOP_MEDIA_POSITION_KEY = 'desktop-media-overlay-position-v1';
const MEDIA_PLAYER_PLAYBACK_TIMES_KEY = 'media-player-playback-times-v1';
const LAUNCHER_VISUALIZER_SEGMENTS = 28;
const DRAG_VIEWPORT_MARGIN = 0;
const DEFAULT_DESKTOP_BOTTOM_GAP = 16;
const HOME_DESKTOP_LEFT_SHIFT = 64;
const HOME_DESKTOP_BOTTOM_GAP = 64;

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

function clampPosition(x: number, y: number, width: number, height: number, margin = DRAG_VIEWPORT_MARGIN) {
  return {
    x: Math.round(Math.min(Math.max(x, margin), Math.max(margin, window.innerWidth - width - margin))),
    y: Math.round(Math.min(Math.max(y, margin), Math.max(margin, window.innerHeight - height - margin))),
  };
}

function clampVisiblePosition(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = DRAG_VIEWPORT_MARGIN,
  topMargin = margin,
) {
  return {
    x: Math.round(Math.min(Math.max(x, margin), Math.max(margin, window.innerWidth - width - margin))),
    y: Math.round(Math.min(Math.max(y, topMargin), Math.max(topMargin, window.innerHeight - height - margin))),
  };
}

function getVisibleTransitionPlan(currentRect: DOMRectReadOnly, nextRect: DOMRectReadOnly) {
  const targetPosition = {
    x: currentRect.right - nextRect.width,
    y: currentRect.bottom - nextRect.height,
  };
  const clampedPosition = clampVisiblePosition(
    targetPosition.x,
    targetPosition.y,
    nextRect.width,
    nextRect.height,
    DRAG_VIEWPORT_MARGIN,
    DRAG_VIEWPORT_MARGIN,
  );

  return {
    targetPosition,
    clampedPosition,
  };
}

function createRect(left: number, top: number, right: number, bottom: number): DOMRectReadOnly {
  const width = right - left;
  const height = bottom - top;

  return {
    left,
    top,
    right,
    bottom,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({ left, top, right, bottom, width, height, x: left, y: top }),
  } satisfies DOMRectReadOnly;
}

function getElementRect(element: HTMLElement, useFinalRect = false): DOMRectReadOnly {
  if (!useFinalRect) {
    return element.getBoundingClientRect();
  }

  const rect = element.getBoundingClientRect();
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const left = rect.right - width;
  const top = rect.bottom - height;

  return createRect(left, top, rect.right, rect.bottom);
}

function getRectForOverlayState(overlay: HTMLElement, isDismissed: boolean, useFinalRect = false): DOMRectReadOnly {
  if (isDismissed) {
    const launcher = overlay.querySelector<HTMLElement>('.note-media-launcher');
    return launcher ? getElementRect(launcher, useFinalRect) : overlay.getBoundingClientRect();
  }

  const shell = overlay.querySelector<HTMLElement>('.note-media-shell:not(.is-parked)')
    ?? overlay.querySelector<HTMLElement>('.note-media-shell');

  if (!shell) {
    return overlay.getBoundingClientRect();
  }

  return getElementRect(shell, useFinalRect);
}

function getVisibleOverlayElement(overlay: HTMLElement, isDismissed: boolean) {
  return isDismissed
    ? overlay.querySelector<HTMLElement>('.note-media-launcher')
    : overlay.querySelector<HTMLElement>('.note-media-shell:not(.is-parked)')
      ?? overlay.querySelector<HTMLElement>('.note-media-shell');
}

function getVisibleOverlayMetrics(overlay: HTMLElement, isDismissed: boolean, useFinalRect = false) {
  const visibleElement = getVisibleOverlayElement(overlay, isDismissed);
  const visibleRect = getRectForOverlayState(overlay, isDismissed, useFinalRect);

  return {
    visibleRect,
    offsetX: visibleElement?.offsetLeft ?? 0,
    offsetY: visibleElement?.offsetTop ?? 0,
  };
}

function getDefaultDesktopPosition(width: number, height: number) {
  const x = Math.max(0, Math.min((window.innerWidth + 800) / 2 + 16, window.innerWidth - width));
  const y = window.innerHeight - height - DEFAULT_DESKTOP_BOTTOM_GAP;

  return clampPosition(x, y, width, height);
}

function getHomeDesktopPosition(width: number, height: number) {
  const defaultPosition = getDefaultDesktopPosition(width, height);

  return clampPosition(
    defaultPosition.x - HOME_DESKTOP_LEFT_SHIFT,
    window.innerHeight - height - HOME_DESKTOP_BOTTOM_GAP,
    width,
    height,
  );
}

function getWaveform(activeItem: ActiveItem) {
  return activeItem.waveform?.length
    ? activeItem.waveform
    : Array.from({ length: LAUNCHER_VISUALIZER_SEGMENTS }, () => 0.24);
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

function getWaveformSegmentState(
  index: number,
  level: number,
  progress: number,
  segmentCount: number,
  hoveredScrubSegment: number | null,
  isPlaying: boolean,
  isQueueComplete: boolean,
) {
  const segmentProgress = (index + 1) / segmentCount;
  const currentSegmentIndex = Math.min(Math.floor(progress * segmentCount), segmentCount - 1);
  const isHoverPreview = !isPlaying && hoveredScrubSegment !== null;
  const isActive = !isHoverPreview && progress >= segmentProgress;
  const isHoveredRange = isHoverPreview && index <= hoveredScrubSegment;
  const isHovered = !isPlaying && hoveredScrubSegment === index;
  const isHoveredNeighbor = !isPlaying && hoveredScrubSegment !== null && index === hoveredScrubSegment - 1;
  const isCurrentResting = hoveredScrubSegment === null && !isQueueComplete && index === currentSegmentIndex;
  const isCurrentPlaying = isPlaying && index === currentSegmentIndex;
  const shouldAnimate = isPlaying && !isCurrentPlaying && !isActive;
  const style: CSSProperties & Record<string, string> = shouldAnimate
    ? {
        '--segment-level': String(level),
        animationName: 'note-media-launcher-bar',
        animationDuration: `${720 + (index % 7) * 35}ms`,
        animationDelay: `${(index % 6) * 28}ms`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }
    : { '--segment-level': String(level) };

  const className = [
    isActive ? 'is-active' : '',
    isHoveredRange ? 'is-hovered-range' : '',
    isHoveredNeighbor ? ' is-hovered-neighbor' : '',
    isHovered ? ' is-hovered' : '',
    isCurrentResting ? ' is-current-resting' : '',
    isCurrentPlaying ? ' is-current-playing' : '',
  ].join('');

  return { className, style };
}

function LauncherVisualizer({
  waveform,
  progress,
  hoveredScrubSegment,
  isPlaying,
  isQueueComplete,
}: {
  waveform: number[];
  progress: number;
  hoveredScrubSegment: number | null;
  isPlaying: boolean;
  isQueueComplete: boolean;
}) {
  const segmentCount = waveform.length;

  return (
    <span className={`note-media-launcher-visualizer${isPlaying ? ' is-playing' : ''}`} aria-hidden="true">
      {waveform.map((level, index) => {
        const { className, style } = getWaveformSegmentState(
          index,
          level,
          progress,
          segmentCount,
          hoveredScrubSegment,
          isPlaying,
          isQueueComplete,
        );

        return <span key={index} style={style} className={className} />;
      })}
    </span>
  );
}

function useDesktopOverlayPosition({
  overlayRef,
  isDismissed,
  isMobile,
  pathname,
  queueLength,
  skipAutoClampForTransitionRef,
}: {
  overlayRef: RefObject<HTMLElement | null>;
  isDismissed: boolean;
  isMobile: boolean;
  pathname: string;
  queueLength: number;
  skipAutoClampForTransitionRef: MutableRefObject<boolean>;
}) {
  const previousPathnameRef = useRef(pathname);
  const [position, setPosition] = useState<Position | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLauncherReadMoreAbove, setIsLauncherReadMoreAbove] = useState(false);

  useEffect(() => {
    if (!queueLength || isMobile || position) {
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    const { visibleRect } = getVisibleOverlayMetrics(overlay, isDismissed, true);

    if (pathname.startsWith('/notes/')) {
      setPosition(getDefaultDesktopPosition(visibleRect.width, visibleRect.height));
      setIsReady(true);
      return;
    }

    try {
      const saved = window.localStorage.getItem(DESKTOP_MEDIA_POSITION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number' &&
          Number.isFinite(parsed.x) &&
          Number.isFinite(parsed.y)
        ) {
          setPosition(clampVisiblePosition(parsed.x, parsed.y, visibleRect.width, visibleRect.height));
          setIsReady(true);
          return;
        }
      }
    } catch {
      // Ignore storage errors
    }

    setPosition(
      pathname === '/'
        ? getHomeDesktopPosition(visibleRect.width, visibleRect.height)
        : getDefaultDesktopPosition(visibleRect.width, visibleRect.height),
    );
    setIsReady(true);
  }, [isDismissed, isMobile, overlayRef, pathname, position, queueLength]);

  useEffect(() => {
    if (isMobile || !isDismissed) {
      setIsLauncherReadMoreAbove(false);
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    const launcher = overlay.querySelector<HTMLElement>('.note-media-launcher');
    const readMore = overlay.querySelector<HTMLElement>('.note-media-launcher-readmore');
    if (!launcher || !readMore) {
      setIsLauncherReadMoreAbove(false);
      return;
    }

    const launcherRect = launcher.getBoundingClientRect();
    const readMoreRect = readMore.getBoundingClientRect();
    const spaceBelow = window.innerHeight - launcherRect.bottom;
    const requiredSpace = readMoreRect.height + 8;

    setIsLauncherReadMoreAbove(spaceBelow < requiredSpace);
  }, [isDismissed, isMobile, overlayRef, pathname, position, queueLength]);

  useEffect(() => {
    if (isMobile || !pathname.startsWith('/notes/') || !queueLength) {
      previousPathnameRef.current = pathname;
      return;
    }

    const didPathChange = previousPathnameRef.current !== pathname;
    previousPathnameRef.current = pathname;

    if (!didPathChange && position !== null) {
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    const { visibleRect } = getVisibleOverlayMetrics(overlay, isDismissed, true);
    setPosition(getDefaultDesktopPosition(visibleRect.width, visibleRect.height));
  }, [isDismissed, isMobile, overlayRef, pathname, position, queueLength]);

  useEffect(() => {
    if (!position) {
      return;
    }

    try {
      window.localStorage.setItem(DESKTOP_MEDIA_POSITION_KEY, JSON.stringify(position));
    } catch {
      // Ignore storage errors
    }
  }, [position]);

  useEffect(() => {
    if (!queueLength) {
      return;
    }

    const handleResize = () => {
      const overlay = overlayRef.current;
      if (!overlay) {
        return;
      }

      const { visibleRect } = getVisibleOverlayMetrics(overlay, isDismissed, true);
      setPosition((current) => {
        if (!current) {
          return current;
        }

        return clampVisiblePosition(current.x, current.y, visibleRect.width, visibleRect.height);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDismissed, overlayRef, queueLength]);

  useEffect(() => {
    if (!queueLength || !position) {
      return;
    }

    // Skip one steady-state clamp pass after expand/collapse so the stale
    // pre-transition visible position cannot override the transition target.
    if (skipAutoClampForTransitionRef.current) {
      skipAutoClampForTransitionRef.current = false;
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    const { visibleRect } = getVisibleOverlayMetrics(overlay, isDismissed, true);
    const clamped = clampVisiblePosition(position.x, position.y, visibleRect.width, visibleRect.height);

    if (clamped.x !== position.x || clamped.y !== position.y) {
      setPosition(clamped);
    }
  }, [isDismissed, overlayRef, position, queueLength, skipAutoClampForTransitionRef]);

  return {
    position,
    setPosition,
    isReady,
    isLauncherReadMoreAbove,
  };
}

function useDesktopMediaPlayback({
  activeItem,
  activeIndex,
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
  isMuted: boolean;
  isPlaying: boolean;
  playbackTimes: Record<string, number>;
  queueLength: number;
  setActiveIndex: MediaQueueState['setActiveIndex'];
  setIsPlaying: MediaQueueState['setIsPlaying'];
  setPlaybackTime: MediaQueueState['setPlaybackTime'];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shouldResumeOnReturnRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const livePlaybackTimesRef = useRef<Record<string, number>>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    livePlaybackTimesRef.current = playbackTimes;
  }, [playbackTimes]);

  useEffect(() => {
    const video = videoRef.current;
    const activeItemId = activeItem?.id;
    if (!video || !activeItemId) {
      return;
    }

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
  }, [activeIndex, activeItem?.id, isMuted, isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeItem) {
      return;
    }

    const restorePlaybackTime = () => {
      const savedTime = livePlaybackTimesRef.current[activeItem.id] || 0;
      if (!savedTime || !video.duration || Number.isNaN(video.duration)) {
        return;
      }

      video.currentTime = Math.min(savedTime, Math.max(video.duration - 0.05, 0));
      setProgress(Math.min(video.currentTime / video.duration, 1));
    };

    if (video.readyState >= 1) {
      restorePlaybackTime();
      return;
    }

    video.addEventListener('loadedmetadata', restorePlaybackTime, { once: true });
    return () => {
      video.removeEventListener('loadedmetadata', restorePlaybackTime);
    };
  }, [activeItem]);

  useEffect(() => {
    const video = videoRef.current;
    const activeItemId = activeItem?.id;
    if (!video || !activeItemId) {
      return;
    }

    const stopProgressLoop = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const updateProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) {
        setProgress(0);
      } else {
        livePlaybackTimesRef.current[activeItemId] = video.currentTime;
        setProgress(Math.min(video.currentTime / video.duration, 1));
      }

      if (!video.paused && !video.ended) {
        animationFrameRef.current = window.requestAnimationFrame(updateProgress);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePlaying = () => {
      stopProgressLoop();
      updateProgress();
    };
    const handlePause = () => {
      stopProgressLoop();
      livePlaybackTimesRef.current[activeItemId] = video.currentTime;
      setPlaybackTime(activeItemId, video.currentTime);
      setIsPlaying(false);
    };
    const handleLoadedMetadata = () => updateProgress();
    const handleEnded = () => {
      stopProgressLoop();
      livePlaybackTimesRef.current[activeItemId] = 0;
      setPlaybackTime(activeItemId, 0);
      setProgress(1);
      setActiveIndex((currentIndex) => {
        const nextIndex = currentIndex >= queueLength - 1 ? currentIndex : currentIndex + 1;
        const shouldStop = currentIndex >= queueLength - 1;

        if (shouldStop) {
          requestAnimationFrame(() => setIsPlaying(false));
        } else {
          requestAnimationFrame(() => setProgress(0));
        }

        return nextIndex;
      });
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      stopProgressLoop();
      livePlaybackTimesRef.current[activeItemId] = video.currentTime;
      setPlaybackTime(activeItemId, video.currentTime);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [activeItem?.id, queueLength, setActiveIndex, setIsPlaying, setPlaybackTime]);

  useEffect(() => {
    const persistBeforeUnload = () => {
      const video = videoRef.current;
      const activeItemId = activeItem?.id;
      if (!video || !activeItemId) {
        return;
      }

      const time = video.currentTime;
      livePlaybackTimesRef.current[activeItemId] = time;
      try {
        window.localStorage.setItem(
          MEDIA_PLAYER_PLAYBACK_TIMES_KEY,
          JSON.stringify({
            ...livePlaybackTimesRef.current,
            [activeItemId]: time,
          }),
        );
      } catch {
        // Ignore storage errors
      }
      setPlaybackTime(activeItemId, time);
    };

    window.addEventListener('beforeunload', persistBeforeUnload);
    return () => window.removeEventListener('beforeunload', persistBeforeUnload);
  }, [activeItem?.id, setPlaybackTime]);

  useEffect(() => {
    const pausePlayback = () => {
      const video = videoRef.current;
      if (!video || video.paused) {
        return;
      }

      shouldResumeOnReturnRef.current = true;
      video.pause();
    };

    const resumePlayback = () => {
      const video = videoRef.current;
      if (!shouldResumeOnReturnRef.current || !video || document.hidden) {
        return;
      }

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

      shouldResumeOnReturnRef.current = false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pausePlayback();
        return;
      }

      resumePlayback();
    };

    window.addEventListener('blur', pausePlayback);
    window.addEventListener('focus', resumePlayback);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', pausePlayback);
      window.removeEventListener('focus', resumePlayback);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setIsPlaying]);

  return {
    videoRef,
    progress,
    setProgress,
    livePlaybackTimesRef,
  };
}

function useOverlayDrag({
  overlayRef,
  isDismissed,
  position,
  setPosition,
}: {
  overlayRef: RefObject<HTMLElement | null>;
  isDismissed: boolean;
  position: Position | null;
  setPosition: React.Dispatch<React.SetStateAction<Position | null>>;
}) {
  const dragStartRef = useRef<DragStart | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const didDragRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  const consumeDragClick = () => {
    if (!didDragRef.current) {
      return false;
    }

    didDragRef.current = false;
    return true;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if ((isDismissed && target.closest('[data-no-drag="true"]')) || !position) {
      return;
    }

    dragCleanupRef.current?.();
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: position.x,
      y: position.y,
    };
    dragPointerIdRef.current = event.pointerId;
    didDragRef.current = false;

    const updateDragPosition = (clientX: number, clientY: number) => {
      if (!dragStartRef.current) {
        return;
      }

      const overlay = overlayRef.current;
      if (!overlay) {
        return;
      }

      const dx = clientX - dragStartRef.current.pointerX;
      const dy = clientY - dragStartRef.current.pointerY;
      if (!didDragRef.current && Math.abs(dx) + Math.abs(dy) < 6) {
        return;
      }

      didDragRef.current = true;
      setIsDragging(true);
      const { visibleRect } = getVisibleOverlayMetrics(overlay, isDismissed, true);
      setPosition(clampVisiblePosition(dragStartRef.current.x + dx, dragStartRef.current.y + dy, visibleRect.width, visibleRect.height));
    };

    const finishDrag = (pointerId?: number) => {
      if (pointerId !== undefined && pointerId !== dragPointerIdRef.current) {
        return;
      }

      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerCancel);
      dragCleanupRef.current = null;

      window.setTimeout(() => {
        dragStartRef.current = null;
        dragPointerIdRef.current = null;
        setIsDragging(false);
      }, 0);
    };

    const handleWindowPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== dragPointerIdRef.current) {
        return;
      }

      updateDragPosition(moveEvent.clientX, moveEvent.clientY);
    };

    const handleWindowPointerUp = (upEvent: PointerEvent) => {
      finishDrag(upEvent.pointerId);
    };

    const handleWindowPointerCancel = (cancelEvent: PointerEvent) => {
      finishDrag(cancelEvent.pointerId);
    };

    dragCleanupRef.current = () => finishDrag();
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerCancel);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerId !== dragPointerIdRef.current) {
      return;
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerId !== dragPointerIdRef.current) {
      return;
    }
  };

  const handleShellClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!didDragRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  };

  return {
    isDragging,
    consumeDragClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleShellClickCapture,
  };
}

function DesktopExpandedView({
  activeIndex,
  activeItem,
  centerHitAreaClassName,
  feedback,
  goToNext,
  goToPrevious,
  isDismissed,
  isMuted,
  isPlaying,
  isQueueComplete,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleShellClickCapture,
  onDismiss,
  progress,
  queue,
  replayQueue,
  t,
  toggleMuted,
  togglePlayback,
  videoRef,
}: {
  activeIndex: number;
  activeItem: ActiveItem;
  centerHitAreaClassName: string;
  feedback: FeedbackType;
  goToNext: () => void;
  goToPrevious: () => void;
  isDismissed: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  isQueueComplete: boolean;
  handlePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  handleShellClickCapture: (event: ReactMouseEvent<HTMLElement>) => void;
  onDismiss: () => void;
  progress: number;
  queue: MediaQueueState['queue'];
  replayQueue: () => void;
  t: ReturnType<typeof useLanguage>['t'];
  toggleMuted: () => void;
  togglePlayback: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  return (
    <div
      className={`note-media-shell${isDismissed ? ' is-parked' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleShellClickCapture}
    >
      <div className="note-media-video-wrap">
        <video
          key={activeItem.id}
          ref={videoRef}
          className="note-media-video"
          src={activeItem.src}
          poster={activeItem.poster}
          playsInline
          autoPlay
          muted={isMuted}
          preload="metadata"
          aria-label={activeItem.title}
        />

        <ProgressBars queue={queue} activeIndex={activeIndex} progress={progress} />

        {queue.length > 1 ? (
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

        {queue.length > 1 ? (
          <button
            type="button"
            className="note-media-hit-area note-media-hit-area-right"
            onClick={goToNext}
            disabled={activeIndex === queue.length - 1}
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

        {isQueueComplete ? (
          <button
            type="button"
            className="note-media-replay-overlay"
            onClick={replayQueue}
            aria-label={t.mediaPlayer.replay}
          >
            <span className="note-media-replay-overlay-icon">
              <RotateCcw className="note-media-icon-svg" aria-hidden="true" strokeWidth={1.75} />
            </span>
          </button>
        ) : null}
      </div>

      {!isDismissed ? (
        <div className="note-media-chrome">
          <div className="note-media-meta">
            <p className="note-media-kicker">{t.mediaPlayer.readMore}</p>
            {activeItem.sourceHref ? (
              <Link to={activeItem.sourceHref} className="note-media-caption-link" draggable={false}>
                {activeItem.sourceTitle}
              </Link>
            ) : (
              <p className="note-media-caption">{activeItem.sourceTitle}</p>
            )}
          </div>
        </div>
      ) : null}

      {!isDismissed ? (
        <button
          type="button"
          className="note-media-dismiss"
          onClick={onDismiss}
          aria-label={t.mediaPlayer.close}
        >
          <Minimize2 className="note-media-icon-svg" aria-hidden="true" strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}

function DesktopLauncherView({
  activeItem,
  handleLauncherRangeChange,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  hoveredScrubSegment,
  isLauncherReadMoreAbove,
  isPlaying,
  isQueueComplete,
  onOpen,
  playFromLauncher,
  progress,
  setHoveredScrubSegment,
  shouldShowLauncherReadMore,
  t,
  updateHoveredScrubSegment,
  waveform,
  isMuted,
}: {
  activeItem: ActiveItem;
  handleLauncherRangeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  hoveredScrubSegment: number | null;
  isLauncherReadMoreAbove: boolean;
  isPlaying: boolean;
  isQueueComplete: boolean;
  onOpen: () => void;
  playFromLauncher: () => void;
  progress: number;
  setHoveredScrubSegment: React.Dispatch<React.SetStateAction<number | null>>;
  shouldShowLauncherReadMore: boolean;
  t: ReturnType<typeof useLanguage>['t'];
  updateHoveredScrubSegment: (element: HTMLElement, clientX: number) => void;
  waveform: number[];
  isMuted: boolean;
}) {
  return (
    <div
      className="note-media-launcher"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <button
        type="button"
        className="note-media-launcher-play"
        onClick={playFromLauncher}
        aria-label={isMuted || !isPlaying ? t.mediaPlayer.playWithSound : t.mediaPlayer.pause}
      >
        {isPlaying ? <Pause aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.9} /> : <Play aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.9} />}
      </button>

      <div
        className="note-media-launcher-scrubber"
        onPointerMove={(event) => updateHoveredScrubSegment(event.currentTarget, event.clientX)}
        onPointerLeave={() => setHoveredScrubSegment(null)}
        data-no-drag="true"
      >
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(progress * 100)}
          onChange={handleLauncherRangeChange}
          className="note-media-launcher-range"
          aria-label={`${activeItem.title} ${t.mediaPlayer.playbackPosition}`}
          data-no-drag="true"
        />
        <span className="note-media-launcher-scrubber-content">
          <LauncherVisualizer
            waveform={waveform}
            progress={progress}
            hoveredScrubSegment={hoveredScrubSegment}
            isPlaying={isPlaying}
            isQueueComplete={isQueueComplete}
          />
        </span>
      </div>

      <button
        type="button"
        className="note-media-launcher-open"
        onClick={onOpen}
        aria-label={t.mediaPlayer.open}
      >
        <Maximize2 aria-hidden="true" className="note-media-icon-svg" strokeWidth={1.85} />
      </button>

      {shouldShowLauncherReadMore ? (
        <div className={`note-media-launcher-readmore${isLauncherReadMoreAbove ? ' is-above' : ''}`}>
          <p className="note-media-kicker">{t.mediaPlayer.readMore}</p>
          <Link to={activeItem.sourceHref!} className="note-media-caption-link" data-no-drag="true">
            {activeItem.sourceTitle}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function DesktopMediaOverlay() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const {
    queue,
    activeIndex,
    activeItem,
    playbackTimes,
    isMuted,
    isPlaying,
    isDismissed,
    setActiveIndex,
    setIsDismissed,
    setIsMuted,
    setIsPlaying,
    setPlaybackTime,
    resetPlaybackTimes,
  } = useMediaQueue();
  const overlayRef = useRef<HTMLElement | null>(null);
  const skipAutoClampForTransitionRef = useRef(false);
  const pendingDismissTransitionRef = useRef<{
    nextDismissed: boolean;
    currentRect: DOMRectReadOnly;
  } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [hoveredScrubSegment, setHoveredScrubSegment] = useState<number | null>(null);
  const [isLauncherHoverArmed, setIsLauncherHoverArmed] = useState(true);
  const [visibleOffset, setVisibleOffset] = useState<Position>({ x: 0, y: 0 });
  const {
    position,
    setPosition,
    isReady,
    isLauncherReadMoreAbove,
  } = useDesktopOverlayPosition({
    overlayRef,
    isDismissed,
    isMobile,
    pathname,
    queueLength: queue.length,
    skipAutoClampForTransitionRef,
  });
  const { videoRef, progress, setProgress, livePlaybackTimesRef } = useDesktopMediaPlayback({
    activeItem,
    activeIndex,
    isMuted,
    isPlaying,
    playbackTimes,
    queueLength: queue.length,
    setActiveIndex,
    setIsPlaying,
    setPlaybackTime,
  });
  const {
    isDragging,
    consumeDragClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleShellClickCapture,
  } = useOverlayDrag({
    overlayRef,
    isDismissed,
    position,
    setPosition,
  });
  const isQueueComplete = activeIndex === queue.length - 1 && !isPlaying && progress >= 1;

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    const { visibleRect, offsetX, offsetY } = getVisibleOverlayMetrics(overlay, isDismissed, true);
    setVisibleOffset((current) => {
      if (current.x === offsetX && current.y === offsetY) {
        return current;
      }

      return { x: offsetX, y: offsetY };
    });

    const pendingTransition = pendingDismissTransitionRef.current;
    if (!pendingTransition || pendingTransition.nextDismissed !== isDismissed) {
      return;
    }

    pendingDismissTransitionRef.current = null;
    skipAutoClampForTransitionRef.current = true;

    const transitionPlan = getVisibleTransitionPlan(pendingTransition.currentRect, visibleRect);

    setPosition(transitionPlan.clampedPosition);
  }, [isDismissed, setPosition, queue.length]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 560);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (isMobile && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isMobile]);

  if (isMobile || !activeItem || !queue.length) {
    return null;
  }

  const launcherWaveform = getWaveform(activeItem);
  const shouldShowLauncherReadMore = activeItem.sourceHref ? activeItem.sourceHref !== pathname : false;

  const flashFeedback = (nextFeedback: FeedbackType) => {
    setFeedback(null);
    requestAnimationFrame(() => {
      setFeedback(nextFeedback);
    });
  };

  const toggleDismissed = (nextDismissed: boolean) => {
    const overlay = overlayRef.current;

    if (overlay && position && nextDismissed !== isDismissed) {
      const currentRect = getRectForOverlayState(overlay, isDismissed, true);

      pendingDismissTransitionRef.current = {
        nextDismissed,
        currentRect,
      };
    }

    setIsLauncherHoverArmed(!nextDismissed);
    setIsDismissed(nextDismissed);
  };

  const handleOverlayPointerLeave = () => {
    if (isDismissed) {
      setIsLauncherHoverArmed(true);
    }
  };

  const resetCurrentItemAndPlay = () => {
    setPlaybackTime(activeItem.id, 0);
    setIsPlaying(true);
    setProgress(0);
  };

  const goToPrevious = () => {
    if (consumeDragClick() || activeIndex === 0) {
      return;
    }

    resetCurrentItemAndPlay();
    setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const goToNext = () => {
    if (consumeDragClick() || activeIndex === queue.length - 1) {
      return;
    }

    resetCurrentItemAndPlay();
    setActiveIndex((currentIndex) => Math.min(currentIndex + 1, queue.length - 1));
  };

  const replayQueue = () => {
    if (consumeDragClick()) {
      return;
    }

    resetPlaybackTimes();
    setActiveIndex(0);
    setProgress(0);
    setIsPlaying(true);
    setIsMuted(false);
    flashFeedback('play');
  };

  const playFromLauncher = () => {
    if (consumeDragClick()) {
      return;
    }

    if (isMuted || !isPlaying) {
      setIsMuted(false);
      setIsPlaying(true);
      flashFeedback('play');
      return;
    }

    setIsPlaying(false);
    flashFeedback('pause');
  };

  const openFromLauncher = () => {
    if (consumeDragClick()) {
      return;
    }

    toggleDismissed(false);
  };

  const seekLauncherProgress = (nextProgress: number) => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) {
      return;
    }

    const ratio = Math.min(Math.max(nextProgress, 0), 1);
    const nextTime = ratio >= 1 ? Math.max(video.duration - 0.05, 0) : video.duration * ratio;

    video.currentTime = nextTime;
    livePlaybackTimesRef.current[activeItem.id] = nextTime;
    setPlaybackTime(activeItem.id, nextTime);
    setProgress(ratio);

    if (!isPlaying || isMuted) {
      setIsMuted(false);
      setIsPlaying(true);
      flashFeedback('play');
    }
  };

  const handleLauncherRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (consumeDragClick()) {
      return;
    }

    seekLauncherProgress(Number(event.target.value) / 100);
  };

  const updateHoveredScrubSegment = (element: HTMLElement, clientX: number) => {
    const segmentCount = activeItem.waveform?.length || LAUNCHER_VISUALIZER_SEGMENTS;
    const rect = element.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 0.9999);
    setHoveredScrubSegment(Math.floor(ratio * segmentCount));
  };

  const togglePlayback = () => {
    if (consumeDragClick()) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.then(() => flashFeedback('play')).catch(() => setIsPlaying(false));
      }
      return;
    }

    video.pause();
    flashFeedback('pause');
  };

  const toggleMuted = () => {
    if (consumeDragClick()) {
      return;
    }

    setIsMuted((current) => {
      const nextValue = !current;
      requestAnimationFrame(() => flashFeedback(nextValue ? 'muted' : 'unmuted'));
      return nextValue;
    });
  };

  const desktopStyle = position
    ? {
        left: `${position.x - visibleOffset.x}px`,
        top: `${position.y - visibleOffset.y}px`,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  const centerHitAreaClassName = [
    'note-media-hit-area',
    'note-media-hit-area-center',
    activeIndex === 0 ? 'is-expanded-left' : '',
    activeIndex === queue.length - 1 ? 'is-expanded-right' : '',
    queue.length === 1 ? 'is-fully-expanded' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside
      ref={overlayRef}
      className={`note-media-player note-media-player-desktop${isDismissed ? ' is-dismissed' : ''}${isDragging ? ' is-dragging' : ''}${isLauncherHoverArmed ? ' is-hover-armed' : ''}`}
      style={desktopStyle}
      aria-label={`${activeItem.sourceTitle} ${t.mediaPlayer.media}`}
      data-ready={isReady ? 'true' : 'false'}
      onPointerLeave={handleOverlayPointerLeave}
    >
      <DesktopExpandedView
        activeIndex={activeIndex}
        activeItem={activeItem}
        centerHitAreaClassName={centerHitAreaClassName}
        feedback={feedback}
        goToNext={goToNext}
        goToPrevious={goToPrevious}
        handlePointerDown={handlePointerDown}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
        handleShellClickCapture={handleShellClickCapture}
        isDismissed={isDismissed}
        isMuted={isMuted}
        isPlaying={isPlaying}
        isQueueComplete={isQueueComplete}
        onDismiss={() => toggleDismissed(true)}
        progress={progress}
        queue={queue}
        replayQueue={replayQueue}
        t={t}
        toggleMuted={toggleMuted}
        togglePlayback={togglePlayback}
        videoRef={videoRef}
      />

      {isDismissed ? (
        <DesktopLauncherView
          activeItem={activeItem}
          handleLauncherRangeChange={handleLauncherRangeChange}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          hoveredScrubSegment={hoveredScrubSegment}
          isLauncherReadMoreAbove={isLauncherReadMoreAbove}
          isMuted={isMuted}
          isPlaying={isPlaying}
          isQueueComplete={isQueueComplete}
          onOpen={openFromLauncher}
          playFromLauncher={playFromLauncher}
          progress={progress}
          setHoveredScrubSegment={setHoveredScrubSegment}
          shouldShowLauncherReadMore={shouldShowLauncherReadMore}
          t={t}
          updateHoveredScrubSegment={updateHoveredScrubSegment}
          waveform={launcherWaveform}
        />
      ) : queue.length > 1 ? (
        <p className="note-media-count">{activeIndex + 1} {t.mediaPlayer.of} {queue.length}</p>
      ) : null}
    </aside>
  );
}
