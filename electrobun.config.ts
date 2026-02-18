import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import type { ElectrobunConfig } from 'electrobun';

const projectRoot = process.cwd();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createPathAliasPlugin(): {
  name: string;
  setup: (
    build: {
      onResolve: (
        opts: { filter: RegExp },
        cb: (args: { path: string }) => { path: string }
      ) => void;
    }
  ) => void;
} {
  const aliasMappings = [
    { prefix: '@bun/', targetRoot: join(projectRoot, 'src/bun') },
    { prefix: '@shared/', targetRoot: join(projectRoot, 'src/shared') },
    { prefix: '@/', targetRoot: join(projectRoot, 'src/main-ui') },
  ];

  const resolveCandidate = (basePath: string): string => {
    const directCandidates = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.tsx`,
      `${basePath}.js`,
      `${basePath}.jsx`,
      `${basePath}.json`,
    ];

    for (const candidate of directCandidates) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return candidate;
      }
    }

    if (existsSync(basePath) && statSync(basePath).isDirectory()) {
      const indexCandidates = [
        join(basePath, 'index.ts'),
        join(basePath, 'index.tsx'),
        join(basePath, 'index.js'),
        join(basePath, 'index.jsx'),
      ];
      for (const candidate of indexCandidates) {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
          return candidate;
        }
      }
    }

    return basePath;
  };

  return {
    name: 'local-path-aliases',
    setup(build) {
      for (const mapping of aliasMappings) {
        build.onResolve(
          { filter: new RegExp(`^${escapeRegex(mapping.prefix)}`) },
          (args: { path: string }) => ({
            path: resolveCandidate(join(mapping.targetRoot, args.path.slice(mapping.prefix.length))),
          })
        );
      }
    },
  };
}

const pathAliasPlugin = createPathAliasPlugin();

export default {
  app: {
    name: 'Suno Prompting App',
    identifier: 'com.factory.suno-prompting-app',
    version: '0.1.0',
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts',
      tsconfig: 'tsconfig.json',
      plugins: [pathAliasPlugin],
    },
    views: {
      'main-ui': {
        entrypoint: 'src/main-ui/index.tsx',
        tsconfig: 'tsconfig.json',
        plugins: [pathAliasPlugin],
      },
    },
    mac: {
      icons: 'icon.iconset',
    },
    copy: {
      'src/main-ui/index.html': 'views/main-ui/index.html',
      'src/main-ui/dist.css': 'views/main-ui/index.css',
    },
  },
} satisfies ElectrobunConfig;
