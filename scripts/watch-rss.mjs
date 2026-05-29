import { watch } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const NOTES_DIR = path.resolve('src/content/notes');

let timer = null;

function runGenerate() {
  const child = spawn(process.execPath, [path.resolve('scripts/generate-rss.mjs')], {
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error('RSS watcher failed to run generator:', error);
  });
}

function scheduleGenerate() {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    runGenerate();
  }, 150);
}

watch(NOTES_DIR, { recursive: true }, (_eventType, fileName) => {
  if (!fileName) return;
  if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) return;
  scheduleGenerate();
});

console.log('Watching notes for RSS updates...');
