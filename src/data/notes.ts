export interface Note {
  id: string;
  title: string;
  date: string;
  summary: string;
  topics: string[];
  language: 'en' | 'de' | 'sv';
  slug: string;
  body: string;
}

const noteFiles = import.meta.glob('../content/notes/*.{md,mdx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseArray(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return [];
  }

  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];

  return inner.split(',').map((item) => stripWrappingQuotes(item.trim())).filter(Boolean);
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Note file is missing frontmatter.');
  }

  const [, frontmatterBlock, body] = match;
  const frontmatter: Record<string, string> = {};

  for (const line of frontmatterBlock.split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key) continue;
    frontmatter[key] = value;
  }

  return { frontmatter, body: body.trim() };
}

function toNote(filePath: string, raw: string): Note {
  const { frontmatter, body } = parseFrontmatter(raw);
  const id = stripWrappingQuotes(frontmatter.id || '');
  const title = stripWrappingQuotes(frontmatter.title || '');
  const date = stripWrappingQuotes(frontmatter.date || '');
  const summary = stripWrappingQuotes(frontmatter.summary || '');
  const slug = stripWrappingQuotes(frontmatter.slug || '');
  const language = stripWrappingQuotes(frontmatter.language || '') as Note['language'];

  if (!id || !title || !date || !summary || !slug || !language) {
    throw new Error(`Missing required note frontmatter in ${filePath}`);
  }

  return {
    id,
    title,
    date,
    summary,
    topics: parseArray(frontmatter.topics || '[]'),
    language,
    slug,
    body,
  };
}

export const notes: Note[] = Object.entries(noteFiles)
  .map(([filePath, raw]) => toNote(filePath, raw))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const noteTopics = ['all', ...Array.from(new Set(notes.flatMap((note) => note.topics)))];

export function getNoteBySlug(slug: string): Note | undefined {
  return notes.find((note) => note.slug === slug);
}
