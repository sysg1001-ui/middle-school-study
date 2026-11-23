import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = new URL('dist/', root);
const output = new URL('build/', root);
const assets = [
  'style.css', 'midterm.js', 'study-notes.js', 'practice-sets.js', 'finals.js', 'materials.js',
  'app.js', 'update.js', 'study-icon-32.png', 'study-icon-180.png', 'study-icon-192.png', 'study-icon-512.png',
  'Jua-StudyTitle.woff2', 'PretendardVariable.woff2', 'Jua-OFL.txt', 'Pretendard-OFL.txt'
];
const inputFiles = ['index.html', 'sw.js', '_headers', ...assets];
const inputs = new Map(await Promise.all(inputFiles.map(async name => [name, await readFile(new URL(name, source))])));
const releases = await readFile(new URL('releases.json', root), 'utf8');
const history = JSON.parse(releases);
const version = history[0].version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('The latest release needs a version number.');

const hash = createHash('sha256');
for (const [name, bytes] of inputs) hash.update(name).update('\0').update(bytes).update('\0');
hash.update(releases).update(await readFile(new URL(import.meta.url)));
const buildId = hash.digest('hex').slice(0, 20);
const assetPath = `_study/${buildId}/`;
const assetOutput = new URL(assetPath, output);
const text = (name) => inputs.get(name).toString('utf8');
const digest = (contents) => createHash('sha256').update(contents).digest('hex');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const releaseMarkup = history.map((release) => {
  const changes = release.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join('');
  return `<li><strong>${escapeHtml(release.version)} · ${escapeHtml(release.title)}</strong> <time datetime="${escapeHtml(release.date)}">${escapeHtml(release.date)}</time><ul>${changes}</ul></li>`;
}).join('');
const html = text('index.html')
  .replaceAll('{{ASSET_PATH}}', assetPath)
  .replaceAll('{{BUILD_ID}}', buildId)
  .replaceAll('{{VERSION}}', version)
  .replace('{{RELEASES}}', () => releaseMarkup);
const manifest = JSON.stringify({
  id: './',
  name: '중학 시험 공부방',
  short_name: '시험 공부방',
  lang: 'ko',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#fff5f9',
  theme_color: '#fff5f9',
  icons: [192, 512].map((size) => ({
    src: `${assetPath}study-icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png'
  }))
});
// Static hosts can redirect .html asset paths to extensionless navigation URLs.
const shellPath = `${assetPath}shell.txt`;
const staticFiles = [
  ...assets.map((name) => [assetPath + name, inputs.get(name)]),
  [shellPath, html],
  ['manifest.webmanifest', manifest]
];
const worker = text('sw.js')
  .replace('{{BUILD_ID}}', buildId)
  .replace('{{SHELL_PATH}}', shellPath)
  .replace('{{PRECACHE}}', () => JSON.stringify(staticFiles.map(([path, contents]) => [path, digest(contents)])));

await mkdir(assetOutput, { recursive: true });
await Promise.all(staticFiles.map(([path, contents]) => writeFile(new URL(path, output), contents)));
await Promise.all([
  writeFile(new URL('index.html', output), html),
  writeFile(new URL('sw.js', output), worker),
  writeFile(new URL('_headers', output), text('_headers'))
]);
const assetRoot = await realpath(new URL('_study/', output));
const projectRoot = await realpath(root);
if (assetRoot !== join(projectRoot, 'build', '_study')) throw new Error('Unexpected build asset directory.');
for (const directory of await readdir(assetRoot, { withFileTypes: true })) {
  if (!directory.isDirectory() || !/^[a-f0-9]{20}$/.test(directory.name) || directory.name === buildId) continue;
  const obsolete = await realpath(join(assetRoot, directory.name));
  if (dirname(obsolete) !== assetRoot) throw new Error('Unexpected path in build assets.');
  await rm(obsolete, { recursive: true });
}
console.log(`공부방 ${version} (${buildId}) → ${fileURLToPath(output)}`);
