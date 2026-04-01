#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sourceDir = path.join(repoRoot, 'integrations', 'openclaw-installer-skill');
const defaultTargetDir = path.join(repoRoot, 'skills', 'aipanel-installer');
const targetDir = path.resolve(process.argv[2] || defaultTargetDir);

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(srcDir, dstDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dstPath, { recursive: true });
      copyDir(srcPath, dstPath);
      continue;
    }
    fs.copyFileSync(srcPath, dstPath);
  }
}

ensureCleanDir(targetDir);
copyDir(sourceDir, targetDir);

console.log(JSON.stringify({
  ok: true,
  sourceDir,
  targetDir
}, null, 2));
