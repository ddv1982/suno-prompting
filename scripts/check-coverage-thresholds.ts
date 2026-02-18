import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

interface FileThreshold {
  lines: number;
  functions: number;
}

interface ThresholdConfig {
  global: FileThreshold;
  files: Record<string, FileThreshold>;
}

interface CoverageRecord {
  file: string;
  linesFound: number;
  linesHit: number;
  functionsFound: number;
  functionsHit: number;
}

function normalizePath(filePath: string): string {
  const relPath = filePath.startsWith(process.cwd()) ? relative(process.cwd(), filePath) : filePath;
  return relPath.replaceAll('\\', '/');
}

function parseLcov(content: string): CoverageRecord[] {
  const records: CoverageRecord[] = [];

  let current: CoverageRecord | null = null;
  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('SF:')) {
      current = {
        file: normalizePath(line.slice(3)),
        linesFound: 0,
        linesHit: 0,
        functionsFound: 0,
        functionsHit: 0,
      };
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith('FNF:')) {
      current.functionsFound = Number.parseInt(line.slice(4), 10) || 0;
      continue;
    }

    if (line.startsWith('FNH:')) {
      current.functionsHit = Number.parseInt(line.slice(4), 10) || 0;
      continue;
    }

    if (line.startsWith('LF:')) {
      current.linesFound = Number.parseInt(line.slice(3), 10) || 0;
      continue;
    }

    if (line.startsWith('LH:')) {
      current.linesHit = Number.parseInt(line.slice(3), 10) || 0;
      continue;
    }

    if (line === 'end_of_record') {
      records.push(current);
      current = null;
    }
  }

  return records;
}

function percentage(hit: number, found: number): number {
  if (found === 0) {
    return 100;
  }
  return (hit / found) * 100;
}

function parseThresholdValue(label: string, value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid coverage threshold "${label}": value must be a finite number.`);
  }
  if (value < 0 || value > 100) {
    throw new Error(`Invalid coverage threshold "${label}": value must be between 0 and 100.`);
  }
  return value;
}

function parseFileThreshold(label: string, value: unknown): FileThreshold {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid coverage threshold "${label}": expected an object.`);
  }

  const threshold = value as { lines?: unknown; functions?: unknown };
  return {
    lines: parseThresholdValue(`${label}.lines`, threshold.lines),
    functions: parseThresholdValue(`${label}.functions`, threshold.functions),
  };
}

function parseThresholdConfig(value: unknown): ThresholdConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid coverage threshold config: expected an object root.');
  }

  const root = value as { global?: unknown; files?: unknown };
  if (!root.files || typeof root.files !== 'object' || Array.isArray(root.files)) {
    throw new Error('Invalid coverage threshold config: "files" must be an object.');
  }

  const filesRoot = root.files as Record<string, unknown>;
  const files: Record<string, FileThreshold> = {};
  for (const [filePath, threshold] of Object.entries(filesRoot)) {
    files[filePath] = parseFileThreshold(`files.${filePath}`, threshold);
  }

  return {
    global: parseFileThreshold('global', root.global),
    files,
  };
}

function readThresholdConfig(): ThresholdConfig {
  const configPath = resolve(process.cwd(), 'scripts/coverage-thresholds.json');
  if (!existsSync(configPath)) {
    throw new Error(`Missing threshold config at ${configPath}`);
  }

  const rawConfig = readFileSync(configPath, 'utf8');
  return parseThresholdConfig(JSON.parse(rawConfig) as unknown);
}

const lcovPath = resolve(process.cwd(), 'coverage/lcov.info');
if (!existsSync(lcovPath)) {
  console.error(`Coverage report not found at ${lcovPath}. Run \`bun run test:coverage\` first.`);
  process.exit(1);
}

const records = parseLcov(readFileSync(lcovPath, 'utf8'));
if (records.length === 0) {
  console.error('No records were found in coverage/lcov.info.');
  process.exit(1);
}

const thresholds = readThresholdConfig();

const totals = records.reduce(
  (acc, record) => {
    acc.linesFound += record.linesFound;
    acc.linesHit += record.linesHit;
    acc.functionsFound += record.functionsFound;
    acc.functionsHit += record.functionsHit;
    return acc;
  },
  {
    linesFound: 0,
    linesHit: 0,
    functionsFound: 0,
    functionsHit: 0,
  }
);

const globalLinePct = percentage(totals.linesHit, totals.linesFound);
const globalFunctionPct = percentage(totals.functionsHit, totals.functionsFound);

const failures: string[] = [];

if (globalLinePct < thresholds.global.lines) {
  failures.push(
    `Global line coverage ${globalLinePct.toFixed(2)}% is below ${thresholds.global.lines.toFixed(2)}%.`
  );
}

if (globalFunctionPct < thresholds.global.functions) {
  failures.push(
    `Global function coverage ${globalFunctionPct.toFixed(2)}% is below ${thresholds.global.functions.toFixed(2)}%.`
  );
}

for (const [filePath, fileThreshold] of Object.entries(thresholds.files)) {
  const record = records.find((entry) => entry.file === filePath);
  if (!record) {
    failures.push(`Coverage report is missing tracked file: ${filePath}.`);
    continue;
  }

  if (record.linesFound === 0 && fileThreshold.lines > 0) {
    failures.push(
      `${filePath} is missing line counters in lcov.info (LF=0) while threshold requires ${fileThreshold.lines.toFixed(2)}%.`
    );
  } else {
    const fileLinePct = percentage(record.linesHit, record.linesFound);
    if (fileLinePct < fileThreshold.lines) {
      failures.push(
        `${filePath} line coverage ${fileLinePct.toFixed(2)}% is below ${fileThreshold.lines.toFixed(2)}%.`
      );
    }
  }

  if (record.functionsFound === 0 && fileThreshold.functions > 0) {
    failures.push(
      `${filePath} is missing function counters in lcov.info (FNF=0) while threshold requires ${fileThreshold.functions.toFixed(2)}%.`
    );
  } else {
    const fileFunctionPct = percentage(record.functionsHit, record.functionsFound);
    if (fileFunctionPct < fileThreshold.functions) {
      failures.push(
        `${filePath} function coverage ${fileFunctionPct.toFixed(2)}% is below ${fileThreshold.functions.toFixed(2)}%.`
      );
    }
  }
}

console.log(
  [
    'Coverage summary:',
    `lines=${globalLinePct.toFixed(2)}% (${totals.linesHit}/${totals.linesFound})`,
    `functions=${globalFunctionPct.toFixed(2)}% (${totals.functionsHit}/${totals.functionsFound})`,
  ].join(' ')
);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Coverage thresholds passed.');
