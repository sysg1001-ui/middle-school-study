(() => {
  const workerStatus = document.querySelector('#study-worker-status');
  if (!window.isSecureContext || !('serviceWorker' in navigator)) {
    workerStatus.textContent = '이 환경에서는 직접 새로고침해 주세요.';
    return;
  }

  const workers = navigator.serviceWorker;
  const pageBuild = document.querySelector('meta[name="study-build"]').content;
  const scope = new URL('./', document.baseURI);
  const scriptUrl = new URL('sw.js', scope).href;
  const reloadKey = `study-update-reload:${scope.pathname}`;
  const banner = document.querySelector('#study-update');
  const title = document.querySelector('#study-update-title');
  const detail = document.querySelector('#study-update-detail');
  const button = document.querySelector('#study-update-button');
  const checkedWorkers = new WeakMap();
  const watchedWorkers = new WeakSet();
  const checkInterval = 5 * 60 * 1000;
  const wakeDebounce = 3000;
  let registration;
  let candidate;
  let applyTimer;
  let applying;
  let activationRequested = false;
  let checking = false;
  let lastCheck = -Infinity;
  let interval;
  let trailingCheck;
  let scan = 0;
  let reloading = false;
  let downloadFailed = false;
  let reloadTarget;

  try {
    reloadTarget = sessionStorage.getItem(reloadKey);
    if (reloadTarget === pageBuild) {
      sessionStorage.removeItem(reloadKey);
      reloadTarget = null;
    }
  } catch {
    // Some browser modes disable session storage. Reload still requires a button click.
  }

  function showNotice(heading, description, action = '새로고침', busy = false) {
    if (title.textContent !== heading) title.textContent = heading;
    if (detail.textContent !== description) detail.textContent = description;
    detail.hidden = !description;
    button.textContent = action;
    button.disabled = busy;
    banner.hidden = false;
  }

  function readBuild(worker) {
    if (!worker) return Promise.resolve(null);
    if (checkedWorkers.has(worker)) return checkedWorkers.get(worker);
    const result = new Promise((resolve) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => done(null), 3500);
      function done(build) {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(build);
      }
      channel.port1.onmessage = ({ data }) => done(data?.build ?? null);
      try {
        worker.postMessage({ type: 'STUDY_BUILD' }, [channel.port2]);
      } catch {
        done(null);
      }
    }).then((build) => {
      if (!build) checkedWorkers.delete(worker);
      return build;
    });
    checkedWorkers.set(worker, result);
    return result;
  }

  function guardReload() {
    return window.studyUpdateBlockReason?.() ?? '';
  }

  function finishApply() {
    clearTimeout(applyTimer);
    const expected = applying;
    applying = null;
    activationRequested = false;
    const blocker = guardReload();
    if (blocker) {
      showNotice('새 버전이 준비됐어요', blocker);
      return;
    }
    reloading = true;
    try {
      sessionStorage.setItem(reloadKey, expected);
    } catch {
      // An explicit click and the in-memory reloading flag prevent repeat requests.
    }
    location.reload();
  }

  async function refreshUpdateState() {
    if (!registration || reloading) return;
    const revision = ++scan;
    const waiting = registration.waiting;
    const controller = workers.controller;
    const active = registration.active;
    const [waitingBuild, controllerBuild, activeBuild] = await Promise.all([
      readBuild(waiting), readBuild(controller), readBuild(active)
    ]);
    if (revision !== scan || reloading) return;

    if (activationRequested && (controllerBuild === applying || (!controller && activeBuild === applying && active?.state === 'activated'))) {
      finishApply();
      return;
    }

    const next = waitingBuild !== pageBuild && waitingBuild
      ? { worker: waiting, build: waitingBuild, waiting: true }
      : activeBuild !== pageBuild && activeBuild
        ? { worker: active, build: activeBuild, waiting: false }
        : null;
    const changed = candidate?.build !== next?.build;
    candidate = next;
    if (candidate) workerStatus.textContent = '새 버전이 준비됐어요.';
    else if (controllerBuild === pageBuild || activeBuild === pageBuild) workerStatus.textContent = '자동 업데이트를 사용할 수 있어요.';
    if (applying) return;
    if (candidate) {
      downloadFailed = false;
      if (changed || banner.hidden) {
        const message = reloadTarget === candidate.build
          ? '최신 버전 화면을 열지 못했어요. 다시 시도해 주세요.'
          : '';
        showNotice('새 버전이 준비됐어요', message, message ? '다시 시도' : '새로고침');
      }
    } else if (downloadFailed || reloadTarget) {
      showNotice('업데이트를 준비하지 못했어요', '연결을 확인한 뒤 다시 시도해 주세요.', '다시 시도');
    } else {
      banner.hidden = true;
    }
  }

  function observeInstalling() {
    const worker = registration.installing;
    if (!worker || watchedWorkers.has(worker)) return;
    watchedWorkers.add(worker);
    const previousVersionExists = Boolean(registration.active || workers.controller);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && !registration.waiting) {
        if (previousVersionExists) downloadFailed = true;
        else workerStatus.textContent = '자동 업데이트 준비에 실패했어요. 인터넷에 연결한 뒤 다시 열어 주세요.';
      }
      void refreshUpdateState();
    });
  }

  function canCheck() {
    return document.visibilityState === 'visible' && navigator.onLine !== false && !reloading;
  }

  async function checkForUpdate(force = false) {
    if (!canCheck() || checking || applying || registration?.installing) return;
    const remaining = wakeDebounce - (Date.now() - lastCheck);
    if (!force && remaining > 0) {
      if (!trailingCheck) {
        trailingCheck = setTimeout(() => {
          trailingCheck = null;
          void checkForUpdate();
        }, remaining);
      }
      return;
    }
    checking = true;
    lastCheck = Date.now();
    downloadFailed = false;
    try {
      if (!registration) {
        const existing = await workers.getRegistration(scope.href);
        registration = existing?.scope === scope.href
          ? existing
          : await workers.register(scriptUrl, { scope: scope.href, updateViaCache: 'none' });
        registration.addEventListener('updatefound', observeInstalling);
        observeInstalling();
        if (registration === existing && !registration.installing) await registration.update();
      } else {
        await registration.update();
      }
      if (!registration.installing && registration.waiting) downloadFailed = false;
    } catch (error) {
      if (registration?.active && canCheck()) downloadFailed = true;
      else if (canCheck()) {
        workerStatus.textContent = '자동 업데이트에 연결하지 못했어요. 페이지를 다시 열어 주세요.';
        console.warn('Study update registration failed', error.message);
      }
    } finally {
      checking = false;
      if (registration) observeInstalling();
      await refreshUpdateState();
    }
  }

  function wake() {
    if (!canCheck()) {
      clearInterval(interval);
      clearTimeout(trailingCheck);
      interval = null;
      trailingCheck = null;
      return;
    }
    if (!interval) interval = setInterval(() => void checkForUpdate(), checkInterval);
    void checkForUpdate();
  }

  function applyFailed(message = '업데이트를 적용하지 못했어요. 다시 시도해 주세요.') {
    clearTimeout(applyTimer);
    applying = null;
    activationRequested = false;
    showNotice('새 버전이 준비됐어요', message, '다시 시도');
  }

  async function canLoadRelease(build) {
    const request = new AbortController();
    const timeout = setTimeout(() => request.abort(), 10000);
    try {
      const response = await fetch(scope.href, {
        cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: request.signal
      });
      return response.ok && (await response.text()).includes(`<meta name="study-build" content="${build}">`);
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  button.addEventListener('click', async () => {
    if (applying || reloading) return;
    if (!canCheck()) {
      showNotice(title.textContent, '인터넷에 연결한 뒤 다시 시도해 주세요.', '다시 시도');
      return;
    }
    if (!candidate) {
      showNotice('업데이트 확인 중', '새 버전 파일을 다시 확인하고 있어요.', '확인 중…', true);
      await checkForUpdate(true);
      if (!candidate && registration?.installing) {
        showNotice('업데이트 준비 중', '파일을 받는 중이에요. 준비가 끝나면 알려드릴게요.', '준비 중…', true);
      }
      return;
    }
    const blocker = guardReload();
    if (blocker) {
      showNotice('새 버전이 준비됐어요', blocker);
      return;
    }
    const selected = candidate;
    applying = selected.build;
    showNotice('새 버전이 준비됐어요', '업데이트를 적용하고 있어요.', '적용 중…', true);
    if (!await canLoadRelease(selected.build)) {
      applyFailed('최신 화면에 연결하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
      void checkForUpdate(true);
      return;
    }
    activationRequested = true;
    applyTimer = setTimeout(applyFailed, 15000);
    try {
      if (selected.waiting) selected.worker.postMessage({ type: 'STUDY_APPLY', build: applying });
      await refreshUpdateState();
    } catch {
      applyFailed();
    }
  });

  workers.addEventListener('controllerchange', () => void refreshUpdateState());
  workers.addEventListener('message', (event) => {
    if (event.data?.type === 'STUDY_INSTALL_ERROR') console.warn('Study update asset installation failed', event.data.reason);
  });
  document.addEventListener('visibilitychange', wake);
  for (const event of ['focus', 'pageshow', 'online', 'offline']) window.addEventListener(event, wake);
  wake();
})();
