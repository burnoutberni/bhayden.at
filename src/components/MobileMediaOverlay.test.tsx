import { useState } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MobileMediaOverlay from './MobileMediaOverlay';

/**
 * These tests target the mobile "collapse on pathname/mobile change" effect
 * in MobileMediaOverlay. The PR removed a `didPathChange` guard that
 * previously skipped collapsing the sheet whenever the pathname had not
 * changed (which, notably, is always true on the very first render, since
 * the ref tracking the "previous" pathname is initialized to the current
 * pathname). The effect must now always collapse the sheet - and reset any
 * in-progress drag offset - whenever it runs while on mobile.
 */

type QueueItem = {
  id: string;
  src: string;
  poster?: string;
  sourceKey: string;
  sourceTitle: string;
  sourceHref?: string;
};

const mockState = vi.hoisted(() => ({
  isMobile: true,
  pathname: '/notes/one',
  initialIsDismissed: false,
  queueItems: [] as QueueItem[],
  setIsDismissedSpy: null as unknown as ReturnType<typeof vi.fn>,
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockState.isMobile,
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useLocation: () => ({ pathname: mockState.pathname, search: '', hash: '', state: null, key: 'test' }),
  };
});

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    lang: 'en',
    setLang: vi.fn(),
    t: {
      mediaPlayer: {
        readMore: 'Read more',
        fromThisNote: 'From this note',
        close: 'Close',
        media: 'media',
        loading: 'Loading',
        retry: 'Retry',
        replay: 'Replay',
        previous: 'Previous',
        next: 'Next',
        mute: 'Mute',
        unmute: 'Unmute',
        play: 'Play',
        pause: 'Pause',
        playWithSound: 'Play with sound',
        open: 'Open',
        of: 'of',
      },
    },
  }),
}));

vi.mock('@/hooks/useVideoLoadState', () => ({
  useVideoLoadState: () => ({ isVideoLoading: false, hasVideoError: false, retryVideo: vi.fn() }),
}));

vi.mock('@/hooks/useOverlayMediaPlayback', () => ({
  useOverlayMediaPlayback: () => ({
    isMediaPlaying: false,
    videoRef: { current: null },
    progress: 0,
    setProgress: vi.fn(),
  }),
}));

// This mock intentionally uses real React state so that calling
// `setIsDismissed` (as the component does) is reflected back into the
// rendered output, letting us assert on real collapse/expand behavior
// rather than merely on whether a spy was invoked.
vi.mock('@/hooks/useMediaQueue', () => ({
  useMediaQueue: () => {
    const [isDismissed, setIsDismissedState] = useState(mockState.initialIsDismissed);
    const [setIsDismissed] = useState(() =>
      vi.fn((value: boolean | ((current: boolean) => boolean)) => {
        setIsDismissedState(value);
      }),
    );
    mockState.setIsDismissedSpy = setIsDismissed;

    return {
      queue: mockState.queueItems,
      activeIndex: 0,
      activeItem: mockState.queueItems[0] ?? null,
      playbackTimes: {},
      isDismissed,
      isMuted: true,
      isPlaying: true,
      setActiveIndex: vi.fn(),
      setIsDismissed,
      setIsMuted: vi.fn(),
      setIsPlaying: vi.fn(),
      setPlaybackTime: vi.fn(),
      resetPlaybackTimes: vi.fn(),
    };
  },
}));

beforeEach(() => {
  mockState.isMobile = true;
  mockState.pathname = '/notes/one';
  mockState.initialIsDismissed = false;
  mockState.setIsDismissedSpy = null as unknown as ReturnType<typeof vi.fn>;
  mockState.queueItems = [
    {
      id: 'note-1:video.mp4',
      src: 'video.mp4',
      sourceKey: 'note-1',
      sourceTitle: 'Test video',
      sourceHref: undefined,
    },
  ];

  // jsdom does not implement the Pointer Capture API used by the sheet's
  // drag handlers.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MobileMediaOverlay mobile collapse effect', () => {
  it('collapses the sheet on initial mount even though the pathname has not changed', () => {
    // Sanity check: the sheet would start out expanded if the collapse
    // effect never ran, since the mocked queue's initial isDismissed is
    // false.
    const { container } = render(<MobileMediaOverlay />);

    const overlay = container.querySelector('.mobile-media-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay).not.toHaveClass('is-expanded');
    expect(mockState.setIsDismissedSpy).toHaveBeenCalledWith(true);
  });

  it('still collapses the sheet when the pathname changes while on mobile', () => {
    const { container, rerender } = render(<MobileMediaOverlay />);
    mockState.setIsDismissedSpy.mockClear();

    mockState.pathname = '/notes/two';
    rerender(<MobileMediaOverlay />);

    const overlay = container.querySelector('.mobile-media-overlay');
    expect(overlay).not.toHaveClass('is-expanded');
    expect(mockState.setIsDismissedSpy).toHaveBeenCalledWith(true);
  });

  it('does not force-collapse (or render anything) when not on mobile', () => {
    mockState.isMobile = false;

    const { container } = render(<MobileMediaOverlay />);

    expect(container.firstChild).toBeNull();
    expect(mockState.setIsDismissedSpy).not.toHaveBeenCalled();
  });

  it('resets any in-progress drag offset whenever the collapse effect runs again', () => {
    const { container, rerender } = render(<MobileMediaOverlay />);

    // The initial mount already collapsed the sheet; reopen it so we can
    // drag it and observe the transform offset.
    const openButtons = container.querySelectorAll('[aria-label="Open"]');
    expect(openButtons.length).toBeGreaterThan(0);
    fireEvent.click(openButtons[0]);

    const sheet = container.querySelector('.mobile-media-sheet.is-expanded') as HTMLElement;
    expect(sheet).not.toBeNull();

    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(sheet, { pointerId: 1, clientY: 220 });

    expect(sheet.style.transform).toBe('translateY(120px)');

    // Triggering the collapse effect again (via a pathname change) should
    // reset the drag offset back to zero, in addition to collapsing.
    mockState.pathname = '/notes/three';
    rerender(<MobileMediaOverlay />);

    const reopenButtons = container.querySelectorAll('[aria-label="Open"]');
    fireEvent.click(reopenButtons[0]);

    const reopenedSheet = container.querySelector('.mobile-media-sheet.is-expanded') as HTMLElement;
    expect(reopenedSheet.style.transform).toBe('translateY(0px)');
  });
});