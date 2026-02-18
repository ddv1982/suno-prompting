import { spawnSync } from 'node:child_process';

type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'unknown';

interface Advisory {
  severity?: string;
}

function stripAnsi(input: string): string {
  return input.replace(/\u001B\[[0-9;]*m/g, '');
}

function extractJsonObject(input: string): string | null {
  const start = input.indexOf('{');
  const end = input.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return input.slice(start, end + 1);
}

function normalizeSeverity(value: string | undefined): Severity {
  if (value === 'critical' || value === 'high' || value === 'moderate' || value === 'low') {
    return value;
  }
  return 'unknown';
}

function parseAuditPayload(stdout: string): Record<string, unknown> | null {
  const cleanStdout = stripAnsi(stdout).trim();
  if (cleanStdout.length === 0) {
    return null;
  }

  try {
    const directParse = JSON.parse(cleanStdout) as unknown;
    if (directParse && typeof directParse === 'object' && !Array.isArray(directParse)) {
      return directParse as Record<string, unknown>;
    }
  } catch {
    // fall through to slice extraction
  }

  const jsonSlice = extractJsonObject(cleanStdout);
  if (!jsonSlice) {
    return null;
  }

  try {
    const slicedParse = JSON.parse(jsonSlice) as unknown;
    if (slicedParse && typeof slicedParse === 'object' && !Array.isArray(slicedParse)) {
      return slicedParse as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function countSeverities(payload: Record<string, unknown>): {
  counts: Record<Severity, number>;
  schemaErrors: string[];
} {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    unknown: 0,
  };
  const schemaErrors: string[] = [];

  for (const [packageName, advisories] of Object.entries(payload)) {
    if (!Array.isArray(advisories)) {
      counts.unknown += 1;
      schemaErrors.push(`Package "${packageName}" advisories payload is not an array.`);
      continue;
    }

    for (const [index, advisory] of advisories.entries()) {
      if (!advisory || typeof advisory !== 'object' || Array.isArray(advisory)) {
        counts.unknown += 1;
        schemaErrors.push(`Package "${packageName}" advisory[${index}] is not an object.`);
        continue;
      }

      const parsedAdvisory = advisory as Advisory;
      const severity = normalizeSeverity(parsedAdvisory.severity);
      counts[severity] += 1;
      if (severity === 'unknown') {
        schemaErrors.push(
          `Package "${packageName}" advisory[${index}] has unsupported severity "${String(parsedAdvisory.severity)}".`
        );
      }
    }
  }

  return { counts, schemaErrors };
}

const run = spawnSync('bun', ['audit', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (run.error) {
  console.error('Failed to execute `bun audit --json`.');
  console.error(run.error.message);
  process.exit(1);
}

const stdout = run.stdout ?? '';
const stderr = stripAnsi(run.stderr ?? '').trim();

let parsed: Record<string, unknown> | null = null;
try {
  parsed = parseAuditPayload(stdout);
} catch (error) {
  console.error('Failed to parse audit JSON payload.');
  console.error(error);
}

if (!parsed) {
  console.error('Unable to parse `bun audit --json` output from stdout.');
  const cleanStdout = stripAnsi(stdout).trim();
  if (cleanStdout.length > 0) {
    console.error(cleanStdout);
  }
  if (stderr.length > 0) {
    console.error(stderr);
  }
  process.exit(run.status ?? 1);
}

const { counts, schemaErrors } = countSeverities(parsed);

console.log(
  [
    'Audit policy summary:',
    `critical=${counts.critical}`,
    `high=${counts.high}`,
    `moderate=${counts.moderate}`,
    `low=${counts.low}`,
    `unknown=${counts.unknown}`,
  ].join(' ')
);

if (counts.high > 0 || counts.critical > 0) {
  console.error('Audit policy failed: high/critical vulnerabilities are not allowed.');
  process.exit(1);
}

if (schemaErrors.length > 0 || counts.unknown > 0) {
  console.error(
    'Audit policy failed: unexpected `bun audit --json` payload shape detected (fail-closed policy).'
  );
  for (const failure of schemaErrors) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

if (counts.moderate > 0) {
  console.warn(
    'Audit policy note: moderate vulnerabilities are tracked but do not block CI by policy.'
  );
}

console.log('Audit policy passed.');
