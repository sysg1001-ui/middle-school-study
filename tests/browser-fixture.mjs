// Run directly for a two-release browser test. Nothing here ships with the site.
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const project = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'study-update-test-'));
const sourceFiles = await readdir(join(project, 'dist'));
const releases = JSON.parse(await readFile(join(project, 'releases.json'), 'utf8'));
const [major, minor, patch] = releases[0].version.split('.').map(Number);
const run = promisify(execFile);
for (const release of [1, 2]) {
  const fixture = join(temp, String(release));
  await Promise.all(['dist', 'scripts'].map((directory) => mkdir(join(fixture, directory), { recursive: true })));
  await Promise.all(sourceFiles.map((file) => copyFile(join(project, 'dist', file), join(fixture, 'dist', file))));
  await copyFile(join(project, 'scripts', 'build.mjs'), join(fixture, 'scripts', 'build.mjs'));
  const history = release === 1 ? releases : [{
    version: `${major}.${minor}.${patch + 1}`, date: releases[0].date, title: '브라우저 업데이트 검증',
    changes: ['테스트에서만 제공되는 새 버전입니다.']
  }, ...releases];
  await writeFile(join(fixture, 'releases.json'), JSON.stringify(history));
  await run(process.execPath, [join(fixture, 'scripts', 'build.mjs')]);
}

const port = Number(process.argv[2] ?? 4173);
const count = {};
let current = 1;
let fault = '';
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2'
};
const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (url.pathname === '/_test') {
    if (request.method === 'POST') {
      const requested = Number(url.searchParams.get('release'));
      if ([1, 2].includes(requested)) current = requested;
      const scenario = url.searchParams.get('fault');
      if (['', 'missing', 'slow', 'offline', 'auth'].includes(scenario)) fault = scenario;
    }
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify({ current, fault, count }));
    return;
  }
  if (!url.pathname.startsWith('/study/')) {
    response.writeHead(404).end();
    return;
  }
  const path = url.pathname.slice('/study/'.length) || 'index.html';
  count[path] = (count[path] ?? 0) + 1;
  if (fault === 'offline') {
    response.destroy();
    return;
  }
  if ((fault === 'auth' && path === 'index.html') || path.startsWith('api/')) {
    response.writeHead(401, { 'Cache-Control': 'no-store' }).end('Sign in');
    return;
  }
  if (fault === 'missing' && path.endsWith('/style.css')) {
    response.writeHead(503).end();
    return;
  }
  const root = join(temp, String(current), 'build');
  const file = resolve(root, path);
  if (!file.startsWith(root + sep)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(file);
    if (fault === 'slow' && path.endsWith('/style.css')) await new Promise((done) => setTimeout(done, 5000));
    const type = contentTypes[basename(file).match(/\.[^.]+$/)?.[0]] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/study/`));

async function stop() {
  server.closeAllConnections();
  server.close();
  // This directory was created above solely for the current test.
  const prefix = join(tmpdir(), 'study-update-test-');
  if (temp.startsWith(prefix) && dirname(temp) === resolve(tmpdir())) await rm(temp, { recursive: true });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
