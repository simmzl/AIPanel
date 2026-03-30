#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sourceDir = path.join(repoRoot, 'integrations', 'openclaw-skill');
const defaultTargetDir = path.join(repoRoot, 'skills', 'aipanel-feishu-bitable');
const targetDir = path.resolve(process.argv[2] || defaultTargetDir);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(repoRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env.vercel.local'));

const replacements = {
  '__AIPANEL_APP_TOKEN__': process.env.AIPANEL_SKILL_APP_TOKEN || process.env.FEISHU_BITABLE_APP_TOKEN || 'YOUR_FEISHU_BITABLE_APP_TOKEN',
  '__AIPANEL_TABLE_ID__': process.env.AIPANEL_SKILL_TABLE_ID || process.env.FEISHU_BITABLE_TABLE_ID || 'YOUR_FEISHU_BITABLE_TABLE_ID',
  '__AIPANEL_SOURCE_URL__': process.env.AIPANEL_SKILL_SOURCE_URL || process.env.FEISHU_BITABLE_SOURCE_URL || 'https://your-feishu-domain/base/YOUR_FEISHU_BITABLE_APP_TOKEN'
};

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirWithRender(srcDir, dstDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dstPath, { recursive: true });
      copyDirWithRender(srcPath, dstPath);
      continue;
    }

    const raw = fs.readFileSync(srcPath, 'utf8');
    const rendered = Object.entries(replacements).reduce(
      (value, [placeholder, replacement]) => value.split(placeholder).join(replacement),
      raw
    );
    fs.writeFileSync(dstPath, rendered, 'utf8');
  }
}

ensureCleanDir(targetDir);
copyDirWithRender(sourceDir, targetDir);

console.log(JSON.stringify({
  ok: true,
  sourceDir,
  targetDir,
  replacements
}, null, 2));
