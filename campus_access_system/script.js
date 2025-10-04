/* =========================================================
   SmartCampus – Teachable Machine Scanners
   - Face model  : ./tm_model/
   - ID model    : ./id_model/
   ========================================================= */

/* Warn if opened via file:// (fetch + camera blocked) */
if (location.protocol !== 'http:' && location.protocol !== 'https:') {
  alert('Please run this site via http(s). Camera & model loading are blocked on file://');
}

/* =======================
   Teachable Machine Scanner
   ======================= */
class TMScanner {
  /**
   * @param {Object} cfg
   *  - canvas: HTMLCanvasElement
   *  - topLeftEl: HTMLElement (overlay for top class + %)
   *  - bottomLeftEl: HTMLElement (overlay container with <ul class="pred-list">)
   *  - modelPath: string (directory with model.json + metadata.json)
   *  - facingMode: 'user'|'environment'
   *  - onLock: (lockInfo)=>void   lockInfo = { className, prob, timestamp }
   */
  constructor(cfg) {
    this.canvas = cfg.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.topLeftEl = cfg.topLeftEl;
    this.bottomLeftEl = cfg.bottomLeftEl;
    this.modelPath = cfg.modelPath;
    this.facingMode = cfg.facingMode || 'user';
    this.onLock = cfg.onLock || (() => {});

    // runtime state
    this.model = null;
    this.predLoopId = null;
    this.webcam = null;
    this.isRunning = false;

    // stability tracking
    this.threshold = 0.98;        // >= 98%
    this.stableWindowMs = 1000;   // 1s continuous
    this.lastTop = null;          // { name, prob, since }
    this.locked = false;
  }

  note(msg)  { if (this.topLeftEl) this.topLeftEl.textContent = msg; }
  error(msg) { if (this.topLeftEl) this.topLeftEl.textContent = `⚠️ ${msg}`; }

  async loadModel() {
    try {
      this.note(`Loading model…`);
      this.model = await tmImage.load(
        this.modelPath + 'model.json',
        this.modelPath + 'metadata.json'
      );
      this.note(`Model ready`);
    } catch (e) {
      this.error(`Model load failed (${this.modelPath}). Check path & server.`);
      console.error('TMScanner model load error:', e);
      throw e;
    }
  }

  async start() {
    try {
      if (!this.model) await this.loadModel();

      // init webcam with canvas size
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.webcam = new tmImage.Webcam(w, h, false);
      this.note(`Requesting camera…`);
      await this.webcam.setup({ facingMode: this.facingMode }); // prompts for permission
      await this.webcam.play();

      this.isRunning = true;
      this.locked = false;
      this.lastTop = null;
      this.note(`Scanning…`);
      this.loop();
    } catch (e) {
      if (e && (e.name === 'NotAllowedError' || e.name === 'NotFoundError')) {
        this.error('Camera blocked or not found. Allow camera & refresh.');
      } else {
        this.error('Failed to start camera. Use http(s) and check permissions.');
      }
      console.error('TMScanner start error:', e);
      throw e;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.predLoopId) cancelAnimationFrame(this.predLoopId);
    if (this.webcam) {
      try { this.webcam.stop(); } catch (e) {}
    }
  }

  freezeOverlay(message) {
    if (this.topLeftEl) this.topLeftEl.textContent = `✅ Locked: ${message}`;
  }

  async loop() {
    if (!this.isRunning) return;

    this.webcam.update();
    // draw webcam frame to our canvas
    this.ctx.drawImage(this.webcam.canvas, 0, 0, this.canvas.width, this.canvas.height);

    // predict
    let preds;
    try {
      preds = await this.model.predict(this.webcam.canvas);
    } catch (e) {
      this.error('Prediction failed (see console).');
      console.error('Predict error:', e);
      return;
    }
    preds.sort((a, b) => b.probability - a.probability);

    const top = preds[0];
    const topName = top.className;
    const topProb = top.probability;

    // overlays
    if (this.topLeftEl) {
      this.topLeftEl.textContent = `${topName} • ${(topProb * 100).toFixed(1)}%`;
    }
    if (this.bottomLeftEl) {
      const ul = this.bottomLeftEl.querySelector('.pred-list');
      if (ul) {
        ul.innerHTML = '';
        for (let i = 0; i < Math.min(3, preds.length); i++) {
          const li = document.createElement('li');
          const p = (preds[i].probability * 100).toFixed(1);
          li.innerHTML = `<span>${preds[i].className}</span><span>${p}%</span>`;
          ul.appendChild(li);
        }
      }
    }

    // stability / lock
    const now = performance.now();
    if (!this.lastTop || this.lastTop.name !== topName || topProb < this.threshold) {
      if (topProb >= this.threshold) this.lastTop = { name: topName, since: now, prob: topProb };
      else this.lastTop = null;
    } else {
      if (now - this.lastTop.since >= this.stableWindowMs) {
        this.locked = true;
        this.stop();
        this.freezeOverlay(topName);
        this.onLock({ className: topName, prob: topProb, timestamp: new Date() });
        return;
      }
    }

    this.predLoopId = requestAnimationFrame(() => this.loop());
  }
}

/* =======================
   Views / Steps helpers
   ======================= */
function show(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(viewId);
  if (el) el.classList.add('active');

  const status = document.getElementById('current-phase');
  if (status) status.textContent = viewId.replace('view-', '').replace('-', ' ').toUpperCase();
}

function setStepState(badgeEl, state /* 'pending'|'active'|'done' */) {
  if (!badgeEl) return;
  badgeEl.setAttribute('data-state', state);
  badgeEl.textContent = state === 'pending' ? 'Pending' : state === 'active' ? 'Active' : 'Done';
}

/* =======================
   Logs / Misc
   ======================= */
function addLog(message, type = 'system') {
  const logsContainer = document.getElementById('logs-container');
  if (!logsContainer) return;
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `<span class="timestamp">${timestamp}</span><span class="message">${message}</span>`;
  logsContainer.prepend(logEntry);
  const logs = logsContainer.querySelectorAll('.log-entry');
  if (logs.length > 10) logs[logs.length - 1].remove();
  logsContainer.scrollTop = 0;
}
function closeModal() {
  const modal = document.getElementById('success-modal');
  if (modal) modal.style.display = 'none';
}
function normalizeName(s){ return (s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}
function safeStop(scanner){ if(scanner) try{ scanner.stop(); }catch(e){} }

/* =======================
   DEMO FLOW (Sequential: Face → ID → Verify)
   ======================= */
let demoFaceScanner, demoIdScanner;
let lockedFace = null; // { className, prob, timestamp }
let lockedId = null;

function startDemoFlow() {
  addLog('🎬 Interactive Demo started.', 'system');

  lockedFace = null; 
  lockedId = null;

  // Reset badges
  setStepState(document.getElementById('badge-face'), 'active');
  setStepState(document.getElementById('badge-id'), 'pending');
  setStepState(document.getElementById('badge-verify'), 'pending');
  document.getElementById('verify-status').textContent = 'Waiting for face lock…';

  // Stop any previous scanners
  if (demoFaceScanner) demoFaceScanner.stop();
  if (demoIdScanner) demoIdScanner.stop();

  // FACE SCANNER starts first
  demoFaceScanner = new TMScanner({
    canvas: document.getElementById('demo-face-canvas'),
    topLeftEl: document.getElementById('demo-face-topleft'),
    bottomLeftEl: document.getElementById('demo-face-bottomleft'),
    modelPath: './tm_model/',
    facingMode: 'user',
    onLock: (info) => {
      lockedFace = info;
      setStepState(document.getElementById('badge-face'), 'done');
      document.getElementById('demo-face-scan-again').style.display = 'inline-flex';
      addLog(`✅ Face locked: ${info.className}`, 'success');

      // 👉 Now start ID step
      setStepState(document.getElementById('badge-id'), 'active');
      document.getElementById('verify-status').textContent = 'Face done. Waiting for ID lock…';

      if (demoIdScanner) demoIdScanner.stop();
      demoIdScanner = new TMScanner({
        canvas: document.getElementById('demo-id-canvas'),
        topLeftEl: document.getElementById('demo-id-topleft'),
        bottomLeftEl: document.getElementById('demo-id-bottomleft'),
        modelPath: './id_model/',
        facingMode: 'environment',
        onLock: (idInfo) => {
          lockedId = idInfo;
          setStepState(document.getElementById('badge-id'), 'done');
          document.getElementById('demo-id-scan-again').style.display = 'inline-flex';
          setStepState(document.getElementById('badge-verify'), 'active');
          document.getElementById('verify-status').textContent = 'Ready to verify!';
          addLog(`✅ ID locked: ${idInfo.className}`, 'success');
        }
      });
      demoIdScanner.start();
    }
  });
  demoFaceScanner.start();

  // Scan Again buttons
  document.getElementById('demo-face-scan-again').onclick = () => {
    // Resets entire flow back to Face
    lockedFace = null;
    lockedId = null;
    if (demoIdScanner) demoIdScanner.stop();
    setStepState(document.getElementById('badge-face'), 'active');
    setStepState(document.getElementById('badge-id'), 'pending');
    setStepState(document.getElementById('badge-verify'), 'pending');
    document.getElementById('demo-face-scan-again').style.display = 'none';
    document.getElementById('demo-id-scan-again').style.display = 'none';
    document.getElementById('verify-status').textContent = 'Waiting for face lock…';
    demoFaceScanner.start();
  };

  document.getElementById('demo-id-scan-again').onclick = () => {
    // Only rescan ID (keep face result)
    lockedId = null;
    setStepState(document.getElementById('badge-id'), 'active');
    setStepState(document.getElementById('badge-verify'), 'pending');
    document.getElementById('demo-id-scan-again').style.display = 'none';
    document.getElementById('verify-status').textContent = 'Rescanning ID…';
    demoIdScanner.start();
  };

  // Back button
  document.getElementById('btn-demo-back').onclick = () => {
    safeStop(demoFaceScanner);
    safeStop(demoIdScanner);
    show('view-home');
  };

  // Verify button
  document.getElementById('btn-check-verify').onclick = () => {
    if (!lockedFace || !lockedId) {
      document.getElementById('verify-status').textContent = 'Both face & ID must be locked!';
      return;
    }
    const faceName = normalizeName(lockedFace.className);
    const idName = normalizeName(lockedId.className);
    if (faceName && idName && faceName === idName) {
      setStepState(document.getElementById('badge-verify'), 'done');
      goVerified(faceName);
    } else {
      alert('Mismatch! Please rescan ID.');
      // reset only ID step, keep face
      lockedId = null;
      document.getElementById('demo-id-scan-again').style.display = 'none';
      setStepState(document.getElementById('badge-verify'), 'pending');
      setStepState(document.getElementById('badge-id'), 'active');
      demoIdScanner.start();
    }
  };
}

function goVerified(name) {
  safeStop(demoFaceScanner);
  safeStop(demoIdScanner);
  document.getElementById('verified-title').textContent = 'Verified';
  document.getElementById('verified-text').innerHTML =
    `The person and ID belong to <strong>${escapeHtml(name.toUpperCase())}</strong>`;
  show('view-verified');
  addLog(`🎉 Verified: ${name}`, 'success');
}

/* =======================
   SOLO FLOWS
   ======================= */
let soloFaceScanner, soloIdScanner;

function startSoloFace() {
  if (soloFaceScanner) soloFaceScanner.stop();
  document.getElementById('solo-face-scan-again').style.display = 'none';

  soloFaceScanner = new TMScanner({
    canvas: document.getElementById('solo-face-canvas'),
    topLeftEl: document.getElementById('solo-face-topleft'),
    bottomLeftEl: document.getElementById('solo-face-bottomleft'),
    modelPath: './tm_model/',
    facingMode: 'user',
    onLock: (info) => {
      addLog(`✅ Face locked: ${info.className}`, 'success');
      document.getElementById('solo-face-scan-again').style.display = 'inline-flex';
    }
  });
  soloFaceScanner.start();

  document.getElementById('solo-face-scan-again').onclick = () => {
    document.getElementById('solo-face-scan-again').style.display = 'none';
    soloFaceScanner.start();
  };
  document.getElementById('solo-face-back').onclick = () => {
    safeStop(soloFaceScanner);
    show('view-home');
  };
}

function startSoloId() {
  if (soloIdScanner) soloIdScanner.stop();
  document.getElementById('solo-id-scan-again').style.display = 'none';

  soloIdScanner = new TMScanner({
    canvas: document.getElementById('solo-id-canvas'),
    topLeftEl: document.getElementById('solo-id-topleft'),
    bottomLeftEl: document.getElementById('solo-id-bottomleft'),
    modelPath: './id_model/',
    facingMode: 'environment',
    onLock: (info) => {
      addLog(`✅ ID locked: ${info.className}`, 'success');
      document.getElementById('solo-id-scan-again').style.display = 'inline-flex';
    }
  });
  soloIdScanner.start();

  document.getElementById('solo-id-scan-again').onclick = () => {
    document.getElementById('solo-id-scan-again').style.display = 'none';
    soloIdScanner.start();
  };
  document.getElementById('solo-id-back').onclick = () => {
    safeStop(soloIdScanner);
    show('view-home');
  };
}

/* =======================
   App bootstrap
   ======================= */
document.addEventListener('DOMContentLoaded', () => {
  // Tiny animation def for any toasts you might add later
  const style = document.createElement('style');
  style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
  document.head.appendChild(style);

  // Clock in logs card
  setInterval(() => {
    const now = new Date();
    const t = document.getElementById('current-time');
    if (t) t.textContent = now.toLocaleTimeString();
  }, 1000);

  addLog('🚀 App Ready. Choose Demo or Solo mode.', 'system');

  // Home buttons
  document.getElementById('btn-demo').addEventListener('click', () => {
    show('view-demo');
    startDemoFlow();
  });
  document.getElementById('btn-face-only').addEventListener('click', () => {
    show('view-solo-face');
    startSoloFace();
  });
  document.getElementById('btn-id-only').addEventListener('click', () => {
    show('view-solo-id');
    startSoloId();
  });

  // Verified -> Done
  document.getElementById('btn-verified-done').addEventListener('click', () => {
    show('view-home');
  });
});
