import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const buildRoot = join(process.cwd(), 'build');
const targetSuffixes = [
  join('views', 'main-ui', 'index.js'),
  join('views', 'main-ui', 'index.css'),
];

interface BundleEntry {
  filePath: string;
  bytes: number;
  gzipBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function collectBundleFiles(root: string): string[] {
  const matches: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (targetSuffixes.some((suffix) => fullPath.endsWith(suffix))) {
        matches.push(fullPath);
      }
    }
  }

  return matches;
}

if (!existsSync(buildRoot)) {
  console.log('Bundle size report: build directory not found. Run a build first.');
  process.exit(0);
}

const files = collectBundleFiles(buildRoot);
if (files.length === 0) {
  console.log('Bundle size report: no view bundles found under build/.');
  process.exit(0);
}

const entries: BundleEntry[] = files.map((filePath) => {
  const contents = readFileSync(filePath);
  return {
    filePath,
    bytes: contents.byteLength,
    gzipBytes: gzipSync(contents).byteLength,
  };
});

entries.sort((a, b) => a.filePath.localeCompare(b.filePath));

console.log('Bundle size report:');
for (const entry of entries) {
  const relPath = relative(process.cwd(), entry.filePath);
  console.log(
    `- ${relPath}: ${formatBytes(entry.bytes)} (gzip ${formatBytes(entry.gzipBytes)})`
  );
}
