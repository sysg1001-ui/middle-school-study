import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setImmediate as settle } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const oldBuild = 'a'.repeat(20);
const newBuild = 'b'.repeat(20);
const scope = 'https://study.example/nested/';
const code = await readFile(new URL('../dist/update.js', import.meta.url), 'utf8');

class Worker extends EventTarget {
  state = 'installed';
  requested = 0;

  constructor(build) {
    super();
    this.build = build;
  }

  postMessage(message, [port] = []) {
    if (message.type === 'STUDY_BUILD') port.postMessage({ build: this.build });
    if (message.type === 'STUDY_APPLY') {
      assert.equal(message.build, this.build);
      this.requested++;
    }
  }
}

function testPage(options = {}) {
  const registration = Object.assign(new EventTarget(), {
    scope, installing: null, waiting: null, active: new Worker(oldBuild),
    async update() { this.checks++; },
    checks: 0,
  });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: options.first ? null : registration.active,
    async getRegistration() { return options.first ? undefined : registration; },
    async register(url, settings) {
      assert.equal(url, scope + 'sw.js');
      assert.equal(settings.scope, scope);
      assert.equal(settings.updateViaCache, 'none');
      return registration;
    }
  });
  const elements = new Map();
  const document = Object.assign(new EventTarget(), {
    visibilityState: options.hidden ? 'hidden' : 'visible',
    baseURI: scope + 'index.html#practice',
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, Object.assign(new EventTarget(), {
        content: oldBuild, hidden: true, textContent: ''
      }));
      return elements.get(selector);
    }
  });
  const window = Object.assign(new EventTarget(), { isSecureContext: true });
  const navigator = { serviceWorker, onLine: !options.offline };
  const storage = new Map();
  const intervals = new Map();
  const timers = new Map();
  let time = 0;
  let nextTimer = 0;
  let reloads = 0;
  let pageAvailable = true;
  runInNewContext(code, {
    window, document, navigator, URL, Date: { now: () => time },
    MessageChannel: class {
      port1 = { close() {} };
      port2 = { postMessage: (data) => this.port1.onmessage({ data }) };
    },
    sessionStorage: {
      getItem: (name) => storage.get(name),
      setItem: (name, value) => storage.set(name, value),
      removeItem: (name) => storage.delete(name)
    },
    location: { reload() { reloads++; } },
    AbortController,
    async fetch(url, options) {
      assert.equal(url, scope);
      assert.equal(options.cache, 'no-store');
      return new Response(`<meta name="study-build" content="${newBuild}">`, { status: pageAvailable ? 200 : 503 });
    },
    setInterval: (fn, delay) => (intervals.set(++nextTimer, { fn, delay }), nextTimer),
    clearInterval: (id) => intervals.delete(id),
    setTimeout: (fn, delay) => (timers.set(++nextTimer, { fn, delay }), nextTimer),
    clearTimeout: (id) => timers.delete(id)
  });
  const fire = (target, type) => target.dispatchEvent(new Event(type));
  return {
    get reloads() { return reloads; },
    get visible() { return !elements.get('#study-update').hidden; },
    get title() { return elements.get('#study-update-title').textContent; },
    get detail() { return elements.get('#study-update-detail').textContent; },
    get action() { return elements.get('#study-update-button').textContent; },
    get status() { return elements.get('#study-update-button').disabled; },
    get workerStatus() { return elements.get('#study-worker-status').textContent; },
    window, document, navigator, registration, serviceWorker, intervals, timers, fire, storage,
    advance(ms) { time += ms; },
    setPageAvailable(available) { pageAvailable = available; },
    click() { fire(elements.get('#study-update-button'), 'click'); },
    install(worker, success) {
      registration.installing = worker;
      worker.state = 'installing';
      fire(registration, 'updatefound');
      registration.installing = null;
      if (success) registration.waiting = worker;
      worker.state = success ? 'installed' : 'redundant';
      fire(worker, 'statechange');
    },
    activate(worker) {
      registration.waiting = null;
      registration.active = worker;
      serviceWorker.controller = worker;
      worker.state = 'activated';
      fire(serviceWorker, 'controllerchange');
    }
  };
}

test('foreground-only checks, five-minute polling, wake deduplication and offline recovery', async () => {
  const page = testPage({ hidden: true, offline: true });
  await settle();
  assert.equal(page.registration.checks, 0);
  page.document.visibilityState = 'visible';
  page.fire(page.document, 'visibilitychange');
  assert.equal(page.intervals.size, 0);
  page.navigator.onLine = true;
  page.fire(page.window, 'online');
  page.fire(page.window, 'focus');
  page.fire(page.window, 'pageshow');
  await settle();
  assert.equal(page.registration.checks, 1);
  const periodic = [...page.intervals.values()][0];
  assert.equal(periodic.delay, 300000);
  page.advance(periodic.delay);
  periodic.fn();
  await settle();
  assert.equal(page.registration.checks, 2);
  page.document.visibilityState = 'hidden';
  page.fire(page.document, 'visibilitychange');
  assert.equal(page.intervals.size, 0);
  periodic.fn();
  await settle();
  assert.equal(page.registration.checks, 2);
});

test('initial installation is silent and applying protects in-progress work', async () => {
  const page = testPage({ first: true });
  await settle();
  page.activate(new Worker(oldBuild));
  await settle();
  assert.equal(page.visible, false);
  assert.equal(page.workerStatus, '자동 업데이트를 사용할 수 있어요.');
  const update = new Worker(newBuild);
  page.install(update, true);
  await settle();
  assert.equal(page.title, '새 버전이 준비됐어요');
  page.window.studyUpdateBlockReason = () => 'unfinished answer';
  page.click();
  assert.equal(page.detail, 'unfinished answer');
  assert.equal(update.requested, 0);
  page.window.studyUpdateBlockReason = () => '';
  page.click();
  await settle();
  assert.equal(update.requested, 1);
  assert(page.status);
  page.window.studyUpdateBlockReason = () => 'another answer';
  page.activate(update);
  await settle();
  assert.equal(page.detail, 'another answer');
  assert.equal(page.reloads, 0);
  page.window.studyUpdateBlockReason = () => '';
  page.click();
  await settle();
  assert.equal(page.reloads, 1);
  page.activate(update);
  await settle();
  assert.equal(page.reloads, 1);
  assert.equal(page.storage.get('study-update-reload:/nested/'), newBuild);
});

test('a different tab stays on its current screen and installation errors can be retried', async () => {
  const page = testPage();
  await settle();
  page.install(new Worker(newBuild), false);
  await settle();
  assert.equal(page.action, '다시 시도');
  page.click();
  await settle();
  assert.equal(page.registration.checks, 2);
  page.activate(new Worker(newBuild));
  await settle();
  assert.equal(page.title, '새 버전이 준비됐어요');
  assert.equal(page.reloads, 0);
  page.setPageAvailable(false);
  page.click();
  await settle();
  assert.equal(page.reloads, 0);
  assert.equal(page.action, '다시 시도');
  page.setPageAvailable(true);
  page.click();
  await settle();
  assert.equal(page.reloads, 1);
});

test('worker verifies files, retains access checks, and retires only its own active caches', async () => {
  const source = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  const shell = '_study/' + newBuild + '/shell.txt';
  const css = '_study/' + newBuild + '/style.css';
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const prefix = 'middle-school-study:static:/nested/:';
  const cached = new Map([
    ['unrelated', new Map()],
    [prefix + oldBuild, new Map([[scope + '_study/activated-marker', new Response('old')]])],
    [prefix + 'c'.repeat(20), new Map()],
    ['middle-school-study:static:/another/:' + oldBuild, new Map()]
  ]);
  const callbacks = {};
  let failed = true;
  let claimed = false;
  let networkResponses = new Map();

  runInNewContext(source.replace('{{BUILD_ID}}', newBuild).replace('{{SHELL_PATH}}', shell)
    .replace('{{PRECACHE}}', JSON.stringify([[shell, hash('shell')], [css, hash('style')]])), {
    URL, AbortController, Headers, Response, crypto: webcrypto, setTimeout, clearTimeout,
    self: {
      registration: { scope },
      addEventListener(name, callback) { callbacks[name] = callback; },
      clients: {
        async claim() { claimed = true; },
        async matchAll() { return []; }
      }
    },
    caches: {
      async open(name) {
        if (!cached.has(name)) cached.set(name, new Map());
        const cache = cached.get(name);
        return { async put(key, value) { cache.set(key, value); }, async match(key) { return cache.get(key)?.clone(); } };
      },
      async keys() { return [...cached.keys()]; },
      async delete(name) { return cached.delete(name); }
    },
    async fetch(input) {
      const url = typeof input === 'string' ? input : input.url;
      if (networkResponses.has(url)) return networkResponses.get(url).clone();
      const response = new Response(url.endsWith(css) ? (failed ? 'corrupt' : 'style') : 'shell');
      Object.defineProperty(response, 'url', { value: url });
      return response;
    }
  });

  const lifecycle = (type) => new Promise((resolve, reject) => callbacks[type]({ waitUntil: (result) => result.then(resolve, reject) }));
  const fetchThroughWorker = (path, mode = 'navigate') => {
    let intercepted;
    callbacks.fetch({
      request: { method: 'GET', headers: new Headers(), url: new URL(path, scope).href, mode },
      respondWith(response) { intercepted = response; }
    });
    return intercepted;
  };

  await assert.rejects(lifecycle('install'), /Invalid release asset/);
  assert(!cached.has(prefix + newBuild));
  failed = false;
  await lifecycle('install');
  assert(cached.has(prefix + oldBuild), 'waiting does not retire the active version');
  await lifecycle('activate');
  assert(claimed);
  assert(!cached.has(prefix + oldBuild));
  assert.equal(cached.size, 4);
  assert.equal(await (await fetchThroughWorker(css, 'no-cors')).text(), 'style');
  assert.equal(fetchThroughWorker('api/profile', 'cors'), undefined);
  assert.equal(fetchThroughWorker('auth/sign-in'), undefined);
  networkResponses.set(scope, new Response('sign in', { status: 401 }));
  assert.equal((await fetchThroughWorker('')).status, 401);
  networkResponses.set(scope, new Response(`<meta name="study-build" content="${oldBuild}">`, {
    headers: { 'Content-Type': 'text/html' }
  }));
  const pinned = await fetchThroughWorker('');
  assert.equal(pinned.headers.get('Content-Type'), 'text/html');
  assert.equal(await pinned.text(), 'shell');
});
