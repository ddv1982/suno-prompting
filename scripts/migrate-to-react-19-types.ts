#!/usr/bin/env bun

/**
 * Migrates React.JSX.Element to ReactElement (React 19)
 *
 * Changes:
 * - React.JSX.Element → ReactElement
 * - Ensures 'import { ReactElement } from "react"' or 'import type { ReactElement } from "react"'
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface FileChange {
  path: string;
  oldContent: string;
  newContent: string;
  changed: boolean;
}

const SRC_DIR = join(import.meta.dir, '..', 'src');

async function getAllTsxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

function migrateFileContent(content: string): { content: string; changed: boolean } {
  let newContent = content;
  let changed = false;

  // Check if file uses React.JSX.Element
  if (!newContent.includes('React.JSX.Element')) {
    return { content: newContent, changed: false };
  }

  changed = true;

  // Replace React.JSX.Element with ReactElement
  newContent = newContent.replace(/React\.JSX\.Element/g, 'ReactElement');

  // Check if ReactElement is already imported
  const hasReactElementImport =
    /import\s+(?:type\s+)?\{[^}]*\bReactElement\b[^}]*\}\s+from\s+['"]react['"]/.test(newContent);

  if (!hasReactElementImport) {
    // Find existing React type imports and add ReactElement
    const reactTypeImportRegex = /import\s+type\s+\{([^}]+)\}\s+from\s+['"]react['"]/;
    const typeMatch = reactTypeImportRegex.exec(newContent);

    if (typeMatch?.[1]) {
      // Add ReactElement to existing type import
      const imports = typeMatch[1].trim();
      const newImports = imports + ', ReactElement';
      newContent = newContent.replace(
        reactTypeImportRegex,
        `import type { ${newImports} } from "react"`
      );
    } else {
      // Check if there's a regular import from react (for hooks, etc.)
      const reactImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react['"]/;
      const regularMatch = reactImportRegex.exec(newContent);

      if (regularMatch) {
        // Don't modify the regular import, add a separate type import after it
        newContent = newContent.replace(
          reactImportRegex,
          regularMatch[0] + '\nimport type { ReactElement } from "react";'
        );
      } else {
        // Add new type import at the top (after any existing imports)
        const firstImportMatch = /^import\s+/m.exec(newContent);
        if (firstImportMatch?.index !== undefined) {
          const insertPos = firstImportMatch.index;
          newContent =
            newContent.slice(0, insertPos) +
            'import type { ReactElement } from "react";\n' +
            newContent.slice(insertPos);
        } else {
          // No imports found, add at the very top
          newContent = 'import type { ReactElement } from "react";\n\n' + newContent;
        }
      }
    }
  }

  return { content: newContent, changed };
}

async function migrateFile(filePath: string): Promise<FileChange> {
  const oldContent = await readFile(filePath, 'utf-8');
  const { content: newContent, changed } = migrateFileContent(oldContent);

  if (changed) {
    await writeFile(filePath, newContent, 'utf-8');
  }

  return {
    path: filePath,
    oldContent,
    newContent,
    changed,
  };
}

async function main(): Promise<void> {
  console.log('🔍 Finding all TypeScript files...\n');
  const allFiles = await getAllTsxFiles(SRC_DIR);

  console.log(`📄 Found ${allFiles.length} TypeScript files\n`);
  console.log('🔄 Migrating React.JSX.Element → ReactElement...\n');

  const results: FileChange[] = [];
  let migratedCount = 0;

  for (const file of allFiles) {
    const result = await migrateFile(file);
    results.push(result);

    if (result.changed) {
      migratedCount++;
      const relativePath = file.replace(SRC_DIR, 'src');
      console.log(`  ✅ ${relativePath}`);
    }
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`   Migrated: ${migratedCount} files`);
  console.log(`   Unchanged: ${allFiles.length - migratedCount} files`);

  if (migratedCount > 0) {
    console.log('\n📝 Next steps:');
    console.log('   1. Run: bun run typecheck');
    console.log('   2. Run: bun run test');
    console.log('   3. Review changes with: git diff');
  }
}

main().catch(console.error);
