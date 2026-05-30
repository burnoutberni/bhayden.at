import type { Project } from '@/data/content';

type ProjectCardColor = {
  border: string;
  badge: string;
  text: string;
};

const palette = {
  lime: { border: 'var(--color-accent-lime)', badge: 'var(--color-accent-lime)', text: 'var(--color-dark-void)' },
  coral: { border: 'var(--color-accent-coral)', badge: 'var(--color-accent-coral)', text: 'var(--color-accent-coral)' },
  cyan: { border: 'var(--color-accent-cyan)', badge: 'var(--color-accent-cyan)', text: 'var(--color-accent-cyan)' },
} satisfies Record<string, ProjectCardColor>;

const typeColorMap: Partial<Record<Project['type'], ProjectCardColor>> = {
  education: palette.lime,

  campaign: palette.cyan,
  community: palette.cyan,
  organisation: palette.cyan,

  tool: palette.coral,
};

export function getProjectCardColors(type?: Project['type'] | string): ProjectCardColor {
  if (!type) return palette.cyan;
  return typeColorMap[type as Project['type']] || palette.cyan;
}

export const projectCardPalette = palette;
