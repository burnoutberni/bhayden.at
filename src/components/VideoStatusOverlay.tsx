import { RotateCcw } from 'lucide-react';

interface VideoStatusOverlayProps {
  hasError: boolean;
  isLoading: boolean;
  loadingLabel: string;
  onRetry: () => void;
  retryLabel: string;
}

export default function VideoStatusOverlay({
  hasError,
  isLoading,
  loadingLabel,
  onRetry,
  retryLabel,
}: VideoStatusOverlayProps) {
  if (hasError) {
    return (
      <button
        type="button"
        className="note-media-replay-overlay"
        onClick={onRetry}
        aria-label={retryLabel}
      >
        <span className="note-media-replay-overlay-icon">
          <RotateCcw className="note-media-icon-svg" aria-hidden="true" strokeWidth={1.75} />
        </span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="note-media-loading-overlay" role="status" aria-label={loadingLabel}>
        <span className="note-media-loading-spinner" aria-hidden="true" />
      </div>
    );
  }

  return null;
}
