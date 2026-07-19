import { useEffect, useRef, useState } from 'react';

type ActiveMediaItem = {
  id: string;
};

type UseOverlayMediaPlaybackOptions = {
  activeItem: ActiveMediaItem | null;
  activeIndex: number;
  isActiveSurface: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  playbackTimes: Record<string, number>;
  queueLength: number;
  setActiveIndex: (value: number | ((current: number) => number)) => void;
  setIsPlaying: (value: boolean | ((current: boolean) => boolean)) => void;
  setPlaybackTime: (id: string, time: number) => void;
};

const MEDIA_PLAYER_PLAYBACK_TIMES_KEY = 'media-player-playback-times-v1';

export function useOverlayMediaPlayback({
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
}: UseOverlayMediaPlaybackOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shouldResumeOnReturnRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const livePlaybackTimesRef = useRef<Record<string, number>>({});
  const isActiveSurfaceRef = useRef(isActiveSurface);
  const [progress, setProgress] = useState(0);

  isActiveSurfaceRef.current = isActiveSurface;

  useEffect(() => {
    livePlaybackTimesRef.current = playbackTimes;
  }, [playbackTimes]);

  useEffect(() => {
    const video = videoRef.current;
    const activeItemId = activeItem?.id;
    if (!video || !activeItemId || !isActiveSurface) {
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
        if (isActiveSurfaceRef.current) {
          setIsPlaying(false);
        }
      });
    }
  }, [activeIndex, activeItem?.id, isActiveSurface, isMuted, isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeItem || !isActiveSurface) {
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
  }, [activeItem, isActiveSurface]);

  useEffect(() => {
    const video = videoRef.current;
    const activeItemId = activeItem?.id;
    if (!video || !activeItemId || !isActiveSurface) {
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

    const handlePlay = () => {
      if (isActiveSurfaceRef.current) {
        setIsPlaying(true);
      }
    };
    const handlePlaying = () => {
      stopProgressLoop();
      updateProgress();
    };
    const handlePause = () => {
      stopProgressLoop();
      livePlaybackTimesRef.current[activeItemId] = video.currentTime;
      setPlaybackTime(activeItemId, video.currentTime);

      if (isActiveSurfaceRef.current) {
        setIsPlaying(false);
      }
    };
    const handleLoadedMetadata = () => updateProgress();
    const handleError = () => {
      stopProgressLoop();
      if (isActiveSurfaceRef.current) {
        setIsPlaying(false);
      }
    };
    const handleEnded = () => {
      stopProgressLoop();
      video.currentTime = 0;
      livePlaybackTimesRef.current[activeItemId] = 0;
      setPlaybackTime(activeItemId, 0);
      setProgress(1);

      if (!isActiveSurfaceRef.current) {
        return;
      }

      setActiveIndex((currentIndex) => {
        const nextIndex = currentIndex >= queueLength - 1 ? currentIndex : currentIndex + 1;
        const shouldStop = currentIndex >= queueLength - 1;

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
      livePlaybackTimesRef.current[activeItemId] = video.currentTime;
      setPlaybackTime(activeItemId, video.currentTime);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [activeItem?.id, isActiveSurface, queueLength, setActiveIndex, setIsPlaying, setPlaybackTime]);

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
    if (!isActiveSurface) {
      return;
    }

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
            if (isActiveSurfaceRef.current) {
              setIsPlaying(false);
            }
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
  }, [isActiveSurface, setIsPlaying]);

  return {
    videoRef,
    progress,
    setProgress,
    livePlaybackTimesRef,
  };
}
