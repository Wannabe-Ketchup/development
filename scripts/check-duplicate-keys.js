#!/usr/bin/env node
// package.json은 JSON.parse가 중복 키를 조용히 마지막 값으로 덮어써버려서,
// 실수로 같은 키를 두 번 선언해도 아무 에러 없이 넘어간다.
// 이 스크립트는 원본 텍스트를 직접 파싱해 객체마다 중복 키가 있는지 검사한다.
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(import.meta.url), '../..');

const targets = [
  'package.json',
  'apps/*/package.json',
  'packages/*/package.json',
].flatMap((pattern) =>
  globSync(pattern, { cwd: rootDir }).map((p) => path.join(rootDir, p)),
);

class DuplicateKeyError extends Error {}

function parseAndCheck(text, filePath) {
  let i = 0;

  function error(message) {
    const line = text.slice(0, i).split('\n').length;
    throw new DuplicateKeyError(`${filePath}:${line} - ${message}`);
  }

  function skipWhitespace() {
    while (i < text.length && /\s/.test(text[i])) i++;
  }

  function parseString() {
    if (text[i] !== '"') error('문자열이 필요합니다.');
    let result = '';
    i++;
    while (text[i] !== '"') {
      if (i >= text.length) error('문자열이 닫히지 않았습니다.');
      if (text[i] === '\\') {
        result += text[i] + text[i + 1];
        i += 2;
      } else {
        result += text[i];
        i++;
      }
    }
    i++;
    return result;
  }

  function parseValue() {
    skipWhitespace();
    const ch = text[i];
    if (ch === '{') return parseObject();
    if (ch === '[') return parseArray();
    if (ch === '"') return parseString();
    // number, true, false, null 등은 키 중복 검사와 무관하므로 문자만 소비한다.
    const match = /^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/.exec(
      text.slice(i),
    );
    if (!match) error(`알 수 없는 값입니다: ${text.slice(i, i + 20)}`);
    i += match[0].length;
    return match[0];
  }

  function parseObject() {
    i++; // '{'
    const seenKeys = new Set();
    skipWhitespace();
    if (text[i] === '}') {
      i++;
      return;
    }
    while (true) {
      skipWhitespace();
      const key = parseString();
      if (seenKeys.has(key)) {
        error(`중복된 키 "${key}"가 있습니다.`);
      }
      seenKeys.add(key);
      skipWhitespace();
      if (text[i] !== ':') error('":"가 필요합니다.');
      i++;
      parseValue();
      skipWhitespace();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === '}') {
        i++;
        return;
      }
      error('"," 또는 "}"가 필요합니다.');
    }
  }

  function parseArray() {
    i++; // '['
    skipWhitespace();
    if (text[i] === ']') {
      i++;
      return;
    }
    while (true) {
      parseValue();
      skipWhitespace();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === ']') {
        i++;
        return;
      }
      error('"," 또는 "]"가 필요합니다.');
    }
  }

  parseValue();
}

let hasError = false;

for (const filePath of targets) {
  const text = readFileSync(filePath, 'utf8');
  const relativePath = path.relative(rootDir, filePath);
  try {
    parseAndCheck(text, relativePath);
  } catch (err) {
    if (err instanceof DuplicateKeyError) {
      console.error(`✖ ${err.message}`);
      hasError = true;
    } else {
      throw err;
    }
  }
}

if (hasError) {
  console.error(
    '\npackage.json에 중복된 키가 있습니다. 위 위치를 확인해 하나만 남겨주세요.',
  );
  process.exit(1);
}

console.log(`✔ 중복 키 없음 (검사한 파일 ${targets.length}개)`);
