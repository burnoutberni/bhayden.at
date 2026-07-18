import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const NOTE_MEDIA_FILE = path.resolve('src/data/noteMedia.ts');
const OUTPUT_FILE = path.resolve('src/generated/mediaWaveforms.ts');
const PUBLIC_DIR = path.resolve('public');
const SEGMENT_COUNT = 40;

function extractMediaSources(fileContents) {
  const sources = new Set();
  const srcPattern = /src:\s*['"]([^'"]+\.(?:mp4|mov|m4v|webm))['"]/g;

  for (const match of fileContents.matchAll(srcPattern)) {
    if (match[1]) {
      sources.add(match[1]);
    }
  }

  return Array.from(sources);
}

function runFfmpeg(filePath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', filePath,
      '-ac', '1',
      '-ar', '8000',
      '-f', 'f32le',
      '-',
    ], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const chunks = [];
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(
          'ffmpeg executable not found. Please install ffmpeg:\n' +
          '  - macOS: brew install ffmpeg\n' +
          '  - Ubuntu/Debian: apt-get install ffmpeg\n' +
          '  - Windows: Download from https://ffmpeg.org/download.html'
        ));
        return;
      }
      reject(error);
    });
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg failed for ${filePath} with exit code ${code}`));
        return;
      }

      resolve(Buffer.concat(chunks));
    });
  });
}

function normalizeWaveform(buffer) {
  const sampleCount = Math.floor(buffer.length / 4);
  const samples = new Float32Array(buffer.buffer, buffer.byteOffset, sampleCount);
  const samplesPerSegment = Math.max(1, Math.floor(samples.length / SEGMENT_COUNT));
  const values = [];

  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    const start = index * samplesPerSegment;
    const end = index === SEGMENT_COUNT - 1
      ? samples.length
      : Math.min((index + 1) * samplesPerSegment, samples.length);

    let sum = 0;
    let count = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      const sample = samples[sampleIndex] || 0;
      sum += sample * sample;
      count += 1;
    }

    values.push(Math.sqrt(sum / Math.max(count, 1)));
  }

  const max = Math.max(...values, 1e-6);
  return values.map((value) => Number((value / max).toFixed(4)));
}

function renderModule(waveforms) {
  return [
    'export const mediaWaveforms: Record<string, number[]> = {',
    ...Object.entries(waveforms).map(([src, waveform]) => `  ${JSON.stringify(src)}: ${JSON.stringify(waveform)},`),
    '};',
    '',
  ].join('\n');
}

async function main() {
  const noteMediaContents = await fs.readFile(NOTE_MEDIA_FILE, 'utf8');
  const mediaSources = extractMediaSources(noteMediaContents);
  const waveforms = {};

  for (const source of mediaSources) {
    const relativePath = source.startsWith('/') ? source.slice(1) : source;
    const absolutePath = path.join(PUBLIC_DIR, relativePath);
    const audioBuffer = await runFfmpeg(absolutePath);
    waveforms[source] = normalizeWaveform(audioBuffer);
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, renderModule(waveforms), 'utf8');
  console.log(`Generated ${OUTPUT_FILE} with ${mediaSources.length} media waveform${mediaSources.length === 1 ? '' : 's'}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
