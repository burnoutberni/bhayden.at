import { getNoteBySlug } from '@/data/notes';
import { mediaWaveforms } from '@/generated/mediaWaveforms';

export interface NoteMediaItem {
  src: string;
  poster?: string;
  title: string;
  caption?: string;
  waveform?: number[];
}

export interface NoteMediaSource {
  sourceKey: string;
  sourceTitle: string;
  sourceHref: string;
  mediaItems: NoteMediaItem[];
  includeInDefaultQueue?: boolean;
}

const noteMedia: Record<string, { mediaItems: NoteMediaItem[]; includeInDefaultQueue?: boolean }> = {
  'taborstrasse-jetzt-mitreden': {
    includeInDefaultQueue: true,
    mediaItems: [
      {
        src: '/static/taborstrasse/reel.mp4',
        title: 'Taborstrasse media clip',
        caption: 'Taborstrasse',
        waveform: mediaWaveforms['/static/taborstrasse/reel.mp4'],
      },
    ],
  },
};

export function getNoteMedia(slug: string): NoteMediaItem[] {
  return noteMedia[slug]?.mediaItems || [];
}

export function getAllNoteMediaSources(options?: {
  includeInDefaultQueueOnly?: boolean;
  filter?: (source: NoteMediaSource) => boolean;
}): NoteMediaSource[] {
  const sources = Object.entries(noteMedia)
    .map(([slug, entry]) => {
      const note = getNoteBySlug(slug);

      return {
        sourceKey: slug,
        sourceTitle: note?.title || slug,
        sourceHref: `/notes/${slug}`,
        mediaItems: entry.mediaItems,
        includeInDefaultQueue: entry.includeInDefaultQueue ?? true,
      } satisfies NoteMediaSource;
    })
    .filter((source) => source.mediaItems.length > 0);

  const filteredByDefaultQueue = options?.includeInDefaultQueueOnly
    ? sources.filter((source) => source.includeInDefaultQueue)
    : sources;

  return options?.filter ? filteredByDefaultQueue.filter(options.filter) : filteredByDefaultQueue;
}
