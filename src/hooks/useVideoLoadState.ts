import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

type UseVideoLoadStateOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  mediaKey: string;
  isActiveSurface?: boolean;
  isPlaybackActive: boolean;
};

export function useVideoLoadState({
  videoRef,
  mediaKey,
  isActiveSurface = true,
  isPlaybackActive,
}: UseVideoLoadStateOptions) {
  const isActiveSurfaceRef = useRef(isActiveSurface);
  const isPlaybackActiveRef = useRef(isPlaybackActive);
  const hasStartedPlaybackRef = useRef(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    isActiveSurfaceRef.current = isActiveSurface;
  }, [isActiveSurface]);

  useEffect(() => {
    isPlaybackActiveRef.current = isPlaybackActive;
  }, [isPlaybackActive]);

  const syncFromVideoElement = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return false;
    }

    if (video.error) {
      setHasVideoError(true);
      setIsVideoLoading(false);
      return true;
    }

    if (!isActiveSurfaceRef.current || !isPlaybackActiveRef.current) {
      setIsVideoLoading(false);
      return true;
    }

    if (!video.paused && !video.ended) {
      hasStartedPlaybackRef.current = true;
      setHasVideoError(false);
      setIsVideoLoading(false);
      return true;
    }

    return false;
  }, [videoRef]);

  useEffect(() => {
    setHasVideoError(false);
    hasStartedPlaybackRef.current = false;
    if (!syncFromVideoElement()) {
      setIsVideoLoading(isActiveSurface && isPlaybackActive);
    }
  }, [isActiveSurface, isPlaybackActive, mediaKey, syncFromVideoElement]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateFromVideo = () => {
      if (syncFromVideoElement()) {
        return;
      }

      setIsVideoLoading(!hasStartedPlaybackRef.current);
    };

    const handleLoadStart = () => {
      setHasVideoError(false);
      hasStartedPlaybackRef.current = false;
      if (isActiveSurfaceRef.current && isPlaybackActiveRef.current) {
        setIsVideoLoading(true);
      }
    };

    const handleCanPlay = () => {
      setHasVideoError(false);
      if (!isPlaybackActiveRef.current || hasStartedPlaybackRef.current) {
        setIsVideoLoading(false);
      }
    };

    const handlePlaying = () => {
      hasStartedPlaybackRef.current = true;
      setHasVideoError(false);
      setIsVideoLoading(false);
    };

    const handlePause = () => {
      setIsVideoLoading(false);
    };

    const handleError = () => {
      setHasVideoError(true);
      setIsVideoLoading(false);
    };

    updateFromVideo();

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', updateFromVideo);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('seeked', updateFromVideo);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', updateFromVideo);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('seeked', updateFromVideo);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [mediaKey, syncFromVideoElement, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || video.error) return;

    if (syncFromVideoElement()) {
      return;
    }

    setIsVideoLoading(!hasStartedPlaybackRef.current);
  }, [isActiveSurface, isPlaybackActive, mediaKey, syncFromVideoElement, videoRef]);

  const retryVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    setHasVideoError(false);
    hasStartedPlaybackRef.current = false;
    setIsVideoLoading(isActiveSurfaceRef.current);
    video.load();

    if (!isActiveSurfaceRef.current || !isPlaybackActiveRef.current) return;

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setIsVideoLoading(false);
      });
    }
  };

  return {
    isVideoLoading,
    hasVideoError,
    retryVideo,
  };
}
