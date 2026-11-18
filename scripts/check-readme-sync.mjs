import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Both READMEs must keep the same skeleton so a reader can switch languages
// without losing sections. The prose is translated, the structure is not.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = { en: 'README.md', tr: 'README.tr.md' };
const problems = [];

function read(name) {
  return readFileSync(resolve(root, name), 'utf8').replace(/\r\n/g, '\n');
}

function headingLevels(text) {
  return text
    .split('\n')
    .map((line) => line.match(/^(#{1,3}) /))
    .filter(Boolean)
    .map((match) => match[1].length);
}

function count(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

const en = read(files.en);
const tr = read(files.tr);

const enHeadings = headingLevels(en);
const trHeadings = headingLevels(tr);

if (enHeadings.length !== trHeadings.length) {
  problems.push(
    `Heading count differs: ${files.en} has ${enHeadings.length}, ${files.tr} has ${trHeadings.length}.`
  );
} else {
  enHeadings.forEach((level, index) => {
    if (level !== trHeadings[index]) {
      problems.push(
        `Heading #${index + 1} level differs: expected h${level}, found h${trHeadings[index]}.`
      );
    }
  });
}

const enFences = count(en, /^```/gm);
const trFences = count(tr, /^```/gm);
if (enFences !== trFences) {
  problems.push(
    `Code fence count differs: ${files.en} has ${enFences}, ${files.tr} has ${trFences}.`
  );
}
if (enFences % 2 !== 0 || trFences % 2 !== 0) {
  problems.push('Unbalanced code fences detected.');
}

const enTableRows = count(en, /^\|/gm);
const trTableRows = count(tr, /^\|/gm);
if (enTableRows !== trTableRows) {
  problems.push(
    `Table row count differs: ${files.en} has ${enTableRows}, ${files.tr} has ${trTableRows}.`
  );
}

if (!en.includes('href="README.tr.md"')) {
  problems.push(`${files.en} does not link to ${files.tr}.`);
}
if (!tr.includes('href="README.md"')) {
  problems.push(`${files.tr} does not link to ${files.en}.`);
}

for (const [locale, text] of Object.entries({ en, tr })) {
  const bar = text.split('\n').slice(0, 8).join('\n');
  if (count(bar, /<strong>/g) !== 1) {
    problems.push(
      `The ${locale} language bar must mark exactly one active language with <strong>.`
    );
  }
}

if (problems.length > 0) {
  console.error('README parity check failed:');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  `README parity check passed (${enHeadings.length} headings, ${enFences} fences, ${enTableRows} table rows).`
);
