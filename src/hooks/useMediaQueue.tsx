import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { NoteMediaItem } from '@/data/noteMedia';

const MEDIA_PLAYER_DISMISSED_KEY = 'media-player-dismissed-v1';
const MEDIA_PLAYER_PLAYING_KEY = 'media-player-playing-v1';
const MEDIA_PLAYER_MUTED_KEY = 'media-player-muted-v1';
const MEDIA_PLAYER_ACTIVE_INDEX_KEY = 'media-player-active-index-v1';
const MEDIA_PLAYER_PLAYBACK_TIMES_KEY = 'media-player-playback-times-v1';

export interface MediaQueueItem extends NoteMediaItem {
  id: string;
  sourceKey: string;
  sourceTitle: string;
  sourceHref?: string;
}

interface MediaQueueContextValue {
  queue: MediaQueueItem[];
  activeIndex: number;
  activeItem: MediaQueueItem | null;
  playbackTimes: Record<string, number>;
  isMuted: boolean;
  isPlaying: boolean;
  isDismissed: boolean;
  enqueueSource: (sourceKey: string, sourceTitle: string, mediaItems: NoteMediaItem[], sourceHref?: string) => void;
  setIsMuted: (value: boolean | ((current: boolean) => boolean)) => void;
  setIsPlaying: (value: boolean | ((current: boolean) => boolean)) => void;
  setIsDismissed: (value: boolean | ((current: boolean) => boolean)) => void;
  setActiveIndex: (value: number | ((current: number) => number)) => void;
  setPlaybackTime: (id: string, time: number) => void;
  resetPlaybackTimes: () => void;
}

const MediaQueueContext = createContext<MediaQueueContextValue | null>(null);

export function MediaQueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<MediaQueueItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    const stored = window.localStorage.getItem(MEDIA_PLAYER_ACTIVE_INDEX_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
  const [playbackTimes, setPlaybackTimes] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    const stored = window.localStorage.getItem(MEDIA_PLAYER_PLAYBACK_TIMES_KEY);
    if (!stored) {
      return {};
    }

    try {
      return JSON.parse(stored) as Record<string, number>;
    } catch {
      return {};
    }
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.localStorage.getItem(MEDIA_PLAYER_MUTED_KEY) === 'false' ? false : true;
  });
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const storedPlaying = window.localStorage.getItem(MEDIA_PLAYER_PLAYING_KEY);

    return storedPlaying === 'false' ? false : true;
  });
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(MEDIA_PLAYER_DISMISSED_KEY) === 'true';
  });
  const activeIndexRef = useRef(activeIndex);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    window.localStorage.setItem(MEDIA_PLAYER_DISMISSED_KEY, String(isDismissed));
  }, [isDismissed]);

  useEffect(() => {
    window.localStorage.setItem(MEDIA_PLAYER_PLAYING_KEY, String(isPlaying));
  }, [isPlaying]);

  useEffect(() => {
    window.localStorage.setItem(MEDIA_PLAYER_MUTED_KEY, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    window.localStorage.setItem(MEDIA_PLAYER_ACTIVE_INDEX_KEY, String(activeIndex));
  }, [activeIndex]);

  useEffect(() => {
    window.localStorage.setItem(MEDIA_PLAYER_PLAYBACK_TIMES_KEY, JSON.stringify(playbackTimes));
  }, [playbackTimes]);

  useEffect(() => {
    if (!queue.length) {
      return;
    }

    setActiveIndex((current) => Math.min(current, queue.length - 1));
  }, [queue.length]);

  const enqueueSource = useCallback((sourceKey: string, sourceTitle: string, mediaItems: NoteMediaItem[], sourceHref?: string) => {
    if (!mediaItems.length) return;

    setQueue((currentQueue) => {
      const seenIds = new Set(currentQueue.map((item) => item.id));
      const nextItems = mediaItems
        .map((mediaItem) => ({
          ...mediaItem,
          id: `${sourceKey}:${mediaItem.src}`,
          sourceKey,
          sourceTitle,
          sourceHref,
        }))
        .filter((item) => !seenIds.has(item.id));

      if (!nextItems.length) {
        return currentQueue;
      }

      if (
        currentQueue.length > 0 &&
        activeIndexRef.current >= currentQueue.length - 1 &&
        !isPlayingRef.current
      ) {
        setActiveIndex(currentQueue.length);
        setIsPlaying(true);
      }

      return [...currentQueue, ...nextItems];
    });
  }, []);

  const setPlaybackTime = useCallback((id: string, time: number) => {
    setPlaybackTimes((current) => {
      if (current[id] === time) {
        return current;
      }

      return {
        ...current,
        [id]: time,
      };
    });
  }, []);

  const resetPlaybackTimes = useCallback(() => {
    setPlaybackTimes({});
  }, []);

  const value = useMemo<MediaQueueContextValue>(() => ({
    queue,
    activeIndex,
    activeItem: queue[activeIndex] || null,
    playbackTimes,
    isMuted,
    isPlaying,
    isDismissed,
    enqueueSource,
    setIsMuted,
    setIsPlaying,
    setIsDismissed,
    setActiveIndex,
    setPlaybackTime,
    resetPlaybackTimes,
  }), [activeIndex, enqueueSource, isDismissed, isMuted, isPlaying, playbackTimes, queue, resetPlaybackTimes, setPlaybackTime]);

  return <MediaQueueContext.Provider value={value}>{children}</MediaQueueContext.Provider>;
}

export function useMediaQueue() {
  const context = useContext(MediaQueueContext);

  if (!context) {
    throw new Error('useMediaQueue must be used within a MediaQueueProvider');
  }

  return context;
}
