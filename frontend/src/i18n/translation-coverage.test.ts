import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Translation coverage guard.
 *
 * English source strings are the translation keys, so a missing Turkish entry
 * silently renders English. This test walks the TypeScript AST (never regex)
 * and fails when:
 *   - a literal `t()` / `translate()` / `translateFor()` / `plural()` key has no
 *     entry in `tr.ts`,
 *   - a Turkish entry drops or renames an `{{interpolation}}` placeholder,
 *   - visible JSX text or a literal UI attribute is not translated.
 *
 * Dynamic keys (`t(roleLabel)`) cannot be verified statically; they stay
 * canonical English strings in the data layer and are translated at render.
 */

const SRC_ROOT = path.resolve(process.cwd(), 'src');
const DICTIONARY_PATH = path.join(SRC_ROOT, 'i18n/messages/tr.ts');

const SKIPPED_FILES = new Set(['App.tsx', 'main.tsx', 'vite-env.d.ts']);
const SKIPPED_PREFIXES = ['i18n/messages/', 'test/'];

const TRANSLATION_CALLS = new Set([
  't',
  'translate',
  'translateFor',
  'plural',
]);

const UI_ATTRIBUTES = new Set([
  'placeholder',
  'title',
  'aria-label',
  'aria-description',
  'alt',
  'label',
  'hint',
  'description',
]);

/**
 * Text that is identical in both languages: brand names, keyboard hints and
 * timezone identifiers. Add to this list only for content that must not be
 * translated; every other literal belongs behind `t()`.
 */
const UNTRANSLATED_TEXT = new Set([
  'Nova',
  'Nova Live',
  'Nova Labs',
  'LiveKit',
  'Google Meet',
  'Microsoft Teams',
  'Zoom',
  'ESC',
  'K',
  '⌘',
  '⌘K',
  'Nova ·',
  'Europe/Istanbul (GMT+3)',
  'Europe/London',
  'Europe/Berlin',
  'America/New York',
  'America/Los Angeles',
  'Asia/Singapore',
]);

const UNTRANSLATED_ATTRIBUTES = new Set(['you@company.com']);

interface Violation {
  key: string;
  where: string;
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

function relativePath(file: string): string {
  return path.relative(SRC_ROOT, file).split(path.sep).join('/');
}

function listSourceFiles(dir: string = SRC_ROOT): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'coverage'].includes(entry.name)) continue;
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) continue;

    const relative = relativePath(fullPath);
    if (SKIPPED_FILES.has(relative)) continue;
    if (SKIPPED_PREFIXES.some((prefix) => relative.startsWith(prefix))) {
      continue;
    }

    files.push(fullPath);
  }

  return files.sort();
}

function readDictionary(): Map<string, string> {
  const dictionary = new Map<string, string>();
  const source = parse(DICTIONARY_PATH);

  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;

    for (const declaration of node.declarationList.declarations) {
      if (!declaration.initializer) continue;
      if (!ts.isObjectLiteralExpression(declaration.initializer)) continue;

      for (const property of declaration.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;

        const { name, initializer } = property;
        const isNamedProperty =
          ts.isStringLiteral(name) ||
          ts.isNoSubstitutionTemplateLiteral(name) ||
          ts.isIdentifier(name);
        const isStringValue =
          ts.isStringLiteral(initializer) ||
          ts.isNoSubstitutionTemplateLiteral(initializer);

        if (isNamedProperty && isStringValue) {
          dictionary.set(name.text, initializer.text);
        }
      }
    }
  });

  return dictionary;
}

function stringValue(node: ts.Node | undefined): string | null {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

function location(source: ts.SourceFile, node: ts.Node, file: string): string {
  const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
  return `${relativePath(file)}:${line + 1}`;
}

function callKeys(callee: string, args: ts.NodeArray<ts.Expression>) {
  if (callee === 't' || callee === 'translate') {
    return [stringValue(args[0])];
  }
  if (callee === 'translateFor') {
    return [stringValue(args[1])];
  }
  if (callee === 'plural') {
    return [stringValue(args[1]), stringValue(args[2])];
  }
  return [];
}

function collectLiteralKeys(files: string[]): Violation[] {
  const violations: Violation[] = [];

  for (const file of files) {
    const source = parse(file);

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const callee = node.expression.text;
        if (TRANSLATION_CALLS.has(callee)) {
          for (const key of callKeys(callee, node.arguments)) {
            if (key !== null) {
              violations.push({ key, where: location(source, node, file) });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  return violations;
}

function collectUntranslatedJsxText(files: string[]): Violation[] {
  const violations: Violation[] = [];

  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const source = parse(file);

    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node)) {
        const text = node.text.replace(/\s+/g, ' ').trim();
        if (
          text.length > 0 &&
          /[A-Za-z]/.test(text) &&
          !UNTRANSLATED_TEXT.has(text)
        ) {
          violations.push({ key: text, where: location(source, node, file) });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  return violations;
}

function collectUntranslatedAttributes(files: string[]): Violation[] {
  const violations: Violation[] = [];

  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const source = parse(file);

    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node)) {
        const name = node.name.getText(source);

        if (UI_ATTRIBUTES.has(name) && node.initializer) {
          const initializer = node.initializer;
          const value = ts.isStringLiteral(initializer)
            ? initializer.text
            : ts.isJsxExpression(initializer)
              ? stringValue(initializer.expression)
              : null;

          if (
            value !== null &&
            /[A-Za-z]/.test(value) &&
            !UNTRANSLATED_TEXT.has(value) &&
            !UNTRANSLATED_ATTRIBUTES.has(value)
          ) {
            violations.push({
              key: `${name}=${JSON.stringify(value)}`,
              where: location(source, node, file),
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  return violations;
}

function placeholders(value: string): string {
  return [...value.matchAll(/\{\{(\w+)\}\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');
}

function formatViolations(violations: Violation[]): string[] {
  return violations.map(
    ({ key, where }) => `${JSON.stringify(key)} — ${where}`
  );
}

describe('translation coverage', () => {
  const dictionary = readDictionary();
  const files = listSourceFiles();

  it('finds the Turkish dictionary and source files', () => {
    expect(dictionary.size).toBeGreaterThan(0);
    expect(files.length).toBeGreaterThan(0);
  });

  it('has a Turkish entry for every literal translation key', () => {
    const missing = collectLiteralKeys(files).filter(
      ({ key }) => !dictionary.has(key)
    );

    expect(formatViolations(missing)).toEqual([]);
  });

  it('keeps interpolation placeholders in Turkish entries', () => {
    const mismatched = [...dictionary]
      .filter(([key, value]) => placeholders(key) !== placeholders(value))
      .map(([key, value]) => `${JSON.stringify(key)} — ${JSON.stringify(value)}`);

    expect(mismatched).toEqual([]);
  });

  it('has no empty Turkish entries', () => {
    const empty = [...dictionary]
      .filter(([, value]) => value.trim().length === 0)
      .map(([key]) => JSON.stringify(key));

    expect(empty).toEqual([]);
  });

  it('translates visible JSX text', () => {
    expect(formatViolations(collectUntranslatedJsxText(files))).toEqual([]);
  });

  it('translates literal UI attributes', () => {
    expect(formatViolations(collectUntranslatedAttributes(files))).toEqual([]);
  });
});
