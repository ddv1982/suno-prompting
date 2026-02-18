import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Violation {
  file: string;
  line: number;
  message: string;
}

interface PackageJsonShape {
  scripts?: Record<string, string>;
}

const CORE_DOC_FILES = [
  'README.md',
  'docs/prompt-generation-guide.md',
  'CHANGELOG.md',
  '.github/pull_request_template.md',
] as const;

const VOLATILE_METRIC_FILES = [
  'README.md',
  'docs/prompt-generation-guide.md',
  '.github/pull_request_template.md',
] as const;

const VOLATILE_METRIC_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: 'hardcoded test-count metric',
    pattern: /\b\d[\d,]*\s+tests\b/i,
  },
  {
    label: 'fixed pass-rate metric',
    pattern: /\b100%\s+pass rate\b/i,
  },
  {
    label: 'fixed micro-latency metric',
    pattern: /\b0\.\d+\s*(?:-\s*0\.\d+)?ms\b/i,
  },
];

function readRequiredFile(filePath: string): string {
  const absolutePath = resolve(process.cwd(), filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Required file is missing: ${filePath}`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function collectPatternViolations(
  file: string,
  content: string,
  label: string,
  pattern: RegExp
): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');

  for (const [index, line] of lines.entries()) {
    if (pattern.test(line)) {
      violations.push({
        file,
        line: index + 1,
        message: `${label}: ${line.trim()}`,
      });
    }
  }

  return violations;
}

function loadScriptNames(): Set<string> {
  const rawPackageJson = readRequiredFile('package.json');
  const parsed = JSON.parse(rawPackageJson) as PackageJsonShape;

  if (!parsed.scripts || typeof parsed.scripts !== 'object' || Array.isArray(parsed.scripts)) {
    throw new Error('Invalid package.json: expected a scripts object.');
  }

  return new Set(Object.keys(parsed.scripts));
}

function collectUnknownScriptViolations(
  file: string,
  content: string,
  scriptNames: Set<string>
): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');
  const commandPattern = /\bbun run ([a-zA-Z0-9:_-]+)/g;

  for (const [index, line] of lines.entries()) {
    let match = commandPattern.exec(line);

    while (match) {
      const scriptName = match[1];
      if (!scriptName) {
        break;
      }

      if (!scriptNames.has(scriptName)) {
        violations.push({
          file,
          line: index + 1,
          message: `unknown script in docs: bun run ${scriptName}`,
        });
      }

      match = commandPattern.exec(line);
    }

    commandPattern.lastIndex = 0;
  }

  return violations;
}

function collectMoodConsistencyViolations(readmeContent: string): Violation[] {
  const violations: Violation[] = [];
  const readmeLines = readmeContent.split('\n');

  for (const [index, line] of readmeLines.entries()) {
    if (/~150\s+moods/i.test(line)) {
      violations.push({
        file: 'README.md',
        line: index + 1,
        message: `outdated mood-count language: ${line.trim()}`,
      });
    }
  }

  if (
    !/(~200 unique moods|approximately 200 unique moods|about 200 unique moods)/i.test(
      readmeContent
    )
  ) {
    violations.push({
      file: 'README.md',
      line: 1,
      message: 'expected canonical mood-count wording (~200 unique moods) was not found.',
    });
  }

  return violations;
}

const docContents = new Map<string, string>();
for (const file of CORE_DOC_FILES) {
  docContents.set(file, readRequiredFile(file));
}

const scriptNames = loadScriptNames();
const failures: Violation[] = [];

for (const file of VOLATILE_METRIC_FILES) {
  const content = docContents.get(file);
  if (!content) {
    continue;
  }

  for (const { label, pattern } of VOLATILE_METRIC_PATTERNS) {
    failures.push(...collectPatternViolations(file, content, label, pattern));
  }
}

const readmeContent = docContents.get('README.md');
if (readmeContent) {
  failures.push(...collectMoodConsistencyViolations(readmeContent));
}

for (const [file, content] of docContents.entries()) {
  failures.push(...collectUnknownScriptViolations(file, content, scriptNames));
}

if (failures.length > 0) {
  console.error('Documentation consistency checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} ${failure.message}`);
  }
  process.exit(1);
}

console.log('Documentation consistency checks passed.');
