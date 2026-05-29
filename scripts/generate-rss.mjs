import { promises as fs } from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://bhayden.at';
const NOTES_DIR = path.resolve('src/content/notes');
const OUTPUT_FILE = path.resolve('public/rss.xml');

function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(raw, fileName) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`Note file is missing frontmatter: ${fileName}`);
  }

  const frontmatter = {};
  const frontmatterBlock = match[1];

  for (const line of frontmatterBlock.split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) {
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function loadNotes() {
  const entries = await fs.readdir(NOTES_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')))
    .map((entry) => entry.name);

  const notes = [];

  for (const fileName of files) {
    const filePath = path.join(NOTES_DIR, fileName);
    const raw = await fs.readFile(filePath, 'utf8');
    const frontmatter = parseFrontmatter(raw, fileName);

    const title = stripWrappingQuotes(frontmatter.title || '');
    const date = stripWrappingQuotes(frontmatter.date || '');
    const summary = stripWrappingQuotes(frontmatter.summary || '');
    const slug = stripWrappingQuotes(frontmatter.slug || '');

    if (!title || !date || !summary || !slug) {
      throw new Error(`Missing required RSS frontmatter in ${fileName}`);
    }

    notes.push({ title, date, summary, slug });
  }

  notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return notes;
}

function renderRss(notes) {
  const lastBuildDate = notes[0] ? new Date(notes[0].date).toUTCString() : new Date().toUTCString();
  const items = notes
    .map((note) => {
      const link = `${SITE_URL}/notes/${note.slug}`;
      return [
        '    <item>',
        `      <title>${escapeXml(note.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid>${link}</guid>`,
        `      <pubDate>${new Date(note.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(note.summary)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    '    <title>bhayden.at notes</title>',
    `    <link>${SITE_URL}/notes</link>`,
    '    <description>Essays, project updates, campaign reflections, and reading notes.</description>',
    '    <language>en</language>',
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    '',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

async function main() {
  const notes = await loadNotes();
  const rss = renderRss(notes);
  await fs.writeFile(OUTPUT_FILE, rss, 'utf8');
  console.log(`Generated ${OUTPUT_FILE} with ${notes.length} notes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
