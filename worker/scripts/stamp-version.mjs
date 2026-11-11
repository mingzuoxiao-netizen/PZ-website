import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const sha = process.env.GITHUB_SHA || '';
if (!/^[a-f0-9]{40}$/.test(sha)) throw Error('A full 40-character GitHub commit SHA is required');
const filename = resolve(dirname(fileURLToPath(import.meta.url)), '../src/index.js');
const content = readFileSync(filename, 'utf8');
if (content.split('"__PZ_GIT_SHA__"').length !== 2) {
  throw Error('Expected exactly one Worker deploy SHA marker');
}
writeFileSync(filename, content.replace('"__PZ_GIT_SHA__"', JSON.stringify(sha)));
console.log('Version metadata stamped with GitHub commit SHA');
