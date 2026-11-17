// phys-world.js — トップの DetPhys の札の遊び(ES モジュール。phys.js が、段が見えそうになった時に読む)。
// 歯車のような凹のリングの中で、物が転がる。リングを回すと、中の物が転がる。物理は DetPhys の見本(WebAssembly)が計算し、
// ここは入力を整数にして渡すのと、描くのだけ。見本は /detphys/demo/(札の data-phys)の detphys_demo.js が読む(使い方はそこの README.md)。
// - ドラッグ(マウス・指): リングの真ん中から見た指の角度が変わった分だけ、リングが回る(つかんで回す)。
// - 傾き(スマホ。「傾けて回す」を押した人だけ): リングは画面といっしょに傾き、中の物は現実の下へ落ちる(逆さに持てば画面の上の方へ)。
//   見本の世界はそのまま(重力は世界の下、入力はリングの角度だけ)で、リングの世界の角度 = 端末の傾き φ + ドラッグで足した分 δ にし、
//   描く時に場面全体を φ だけ逆に回す(カメラを回す)。画面の上ではリングは δ だけ回って見え、物は現実の下へ落ちて見える。
//   φ は重力の向きを画面の面に写した角度(0〜360 度の全部。画面の向き(縦・横)も考える)。iOS は押した時に許可を聞く。
//   ドラッグで足した δ は、離した後もそのまま残す(手で回したダイヤルは、離した所で止まる。勝手に戻すと、触っていないのに中の物が動く)。
// - キーボード: 左右の矢印キーで回す。Home で 0 度へ。
// - 時間: 実時間をためて 60 Hz の tick を回す(1 フレームで多くても MAX_TICKS_PER_FRAME 回。遅い端末で追いつこうとして固まらない)。
//   段が画面の外・タブが隠れている間は、tick も描くのも止める。
// - 見本が読めない・動かない時は、札の絵のまま(canvas を出さない)。外の物は読まない。
const card = document.querySelector("[data-phys]");
const canvas = card && card.querySelector(".phys-canvas");
const img = card && card.querySelector(".phys-stage > img");
if (card && canvas && img && !card.hasAttribute("data-phys-live")) {
  card.setAttribute("data-phys-live", "1");
  start().catch(() => { canvas.hidden = true; });
}

async function start() {
  // --- 決まった値 ---
  const TICK_MS = 1000 / 60;
  const MAX_TICKS_PER_FRAME = 4;
  const TURN = 65536;                       // 1 回転 = 65536(入力の整数)
  const MAX_LEAD = Math.PI / 2;             // ドラッグで、指がリングより先へ行ってよい量 [rad](速く回しすぎた分は滑らせる)
  const KEY_STEP = Math.PI / 12;            // 矢印キー 1 回 = 15 度
  const PANEL = { w: 1133 / 1158, h: 628 / 658, r: 28 / 1158 };   // 絵(card.webp)の中の暗い板(幅・高さ・角の丸みの割合)
  const RING_FILL = 0.86;                   // リングの外の径 = 板の高さ × これ
  const C = {
    panel: "#191C22", ring: "#2FB8A6", ink: "#15171C",
    bodies: ["#FFC93C", "#FF784A", "#F4F2EE", "#FFE08A"]
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  const text = (k, v) => (card.dataset[k] || "").replace(/\{(\w+)\}/g, (_, n) => (v && n in v ? v[n] : ""));

  // --- 見本を読む ---
  const base = new URL(card.dataset.phys, location.href);
  const mod = await import(new URL("detphys_demo.js", base).href);
  const demo = await mod.loadDetPhysDemo(base);
  demo.reset();
  // 見本のリングは、1 tick に MAX_STEP(1/64 回転)までしか回らない。入力の角度もそれより速く動かさない
  // (リングが入力に遅れないので、リングの角度 = 入力の角度になる。遠い目標を近い向きへ回る時の逆回りも起きない)
  const MAX_STEP = demo.MAX_STEP || 1024;
  const MAX_TURN_PER_TICK = MAX_STEP / TURN * Math.PI * 2;

  // --- リングの形(世界の長さ m。上が +y)。最初の 1 回だけ読み、リングの向きに戻した形を持っておく ---
  // demo.ring は呼ぶたびに配列を写すので、毎フレームは読まない。角度は、渡した整数から見本と同じ決まり
  // (近い向きへ、1 tick に MAX_STEP まで)で追い、1 秒ごとと最初からの時に demo.ring.angleQ で合わせる
  let ringPath = null, ringR = 1, ringQ = 0;
  function buildRing() {
    const r = demo.ring, o = r.outline, a0 = -r.angle, c = Math.cos(a0), s = Math.sin(a0);
    const p = new Path2D();
    ringR = 0;
    for (let i = 0; i < o.length; i += 2) {
      const x = o[i] * c - o[i + 1] * s, y = o[i] * s + o[i + 1] * c;
      if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
      ringR = Math.max(ringR, Math.hypot(x, y));
    }
    p.closePath();
    ringPath = p;
    ringQ = r.angleQ;
  }
  buildRing();
  const wrapQ = (q) => ((q % TURN) + TURN) % TURN;
  function followRing(q) {
    let d = wrapQ(q - ringQ);
    if (d > TURN / 2) d -= TURN;
    ringQ += Math.max(-MAX_STEP, Math.min(MAX_STEP, d));
  }
  function syncRing() { ringQ = demo.ring.angleQ; }
  // 多角形の物の形(物の向きの頂点 x,y…)。番号ごとに 1 回だけ聞く
  let shapes = [];

  // --- 大きさ(CSS の大きさ × 画素の比。2 まで)。変わった時だけ測る ---
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, scale = 1, panelPath = null, cssScale = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w !== W || h !== H) { W = canvas.width = w; H = canvas.height = h; }
    const pw = W * PANEL.w, ph = H * PANEL.h, rad = W * PANEL.r;
    panelPath = new Path2D();
    panelPath.moveTo(rad, 0);
    panelPath.arcTo(pw, 0, pw, ph, rad);
    panelPath.arcTo(pw, ph, 0, ph, rad);
    panelPath.arcTo(0, ph, 0, 0, rad);
    panelPath.arcTo(0, 0, pw, 0, rad);
    panelPath.closePath();
    cx = pw / 2; cy = ph / 2;
    scale = ph * RING_FILL / 2 / ringR;   // 画素 / m
    cssScale = dpr;
    dirty = true;
    wake();
  }

  // --- 描く(毎フレーム配列を作らない) ---
  function draw() {
    if (!W) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.panel;
    ctx.fill(panelPath);
    ctx.save();
    ctx.clip(panelPath);
    // 場面全体をカメラの角度 cam だけ回す(画面の上で反時計回り = 世界の角度で +cam)。世界 → 画面(y は下が +)
    const cc = Math.cos(cam), sc = Math.sin(cam);
    // リング
    const a = ringQ / TURN * Math.PI * 2 + cam, ca = Math.cos(a), sa = Math.sin(a);
    ctx.setTransform(scale * ca, -scale * sa, -scale * sa, -scale * ca, cx, cy);
    ctx.fillStyle = C.ring;
    ctx.fill(ringPath);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 物: 色ごとに 1 本の道筋にまとめて、塗る・縁取るを 1 回ずつ
    const b = demo.bodies, n = b.count, d = b.data;
    ctx.lineWidth = 1.5 * cssScale;
    ctx.lineJoin = "round";
    ctx.strokeStyle = C.ink;
    for (let g = 0; g < C.bodies.length; g++) {
      ctx.beginPath();
      for (let i = g; i < n; i += C.bodies.length) {
        const k = i * 5, x = cx + (d[k] * cc - d[k + 1] * sc) * scale, y = cy - (d[k] * sc + d[k + 1] * cc) * scale, ang = d[k + 2] + cam;
        if (d[k + 3] === 0) {
          const r = d[k + 4] * scale;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        } else {
          let v = shapes[i];
          if (!v) v = shapes[i] = demo.bodyShape(i);
          const c = Math.cos(ang), s = Math.sin(ang);
          for (let j = 0; j < v.length; j += 2) {
            const px = x + (v[j] * c - v[j + 1] * s) * scale, py = y - (v[j] * s + v[j + 1] * c) * scale;
            if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
      }
      ctx.fillStyle = C.bodies[g];
      ctx.fill();
      ctx.stroke();
    }
    // 丸い物の向き(転がっているのが分かる線)
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const k = i * 5;
      if (d[k + 3] !== 0) continue;
      const x = cx + (d[k] * cc - d[k + 1] * sc) * scale, y = cy - (d[k] * sc + d[k + 1] * cc) * scale, r = d[k + 4] * scale, ang = d[k + 2] + cam;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * r, y - Math.sin(ang) * r);
    }
    ctx.stroke();
    ctx.restore();
  }

  // --- 入力(角度は rad。画面で時計回りが +)。tick ごとにリングの世界の角度を整数にして見本へ渡す ---
  // cur: 見本に渡すリングの世界の角度 = cam + del
  // del: 画面の上のリングの角度(ドラッグ・キーで足した分。δ)。delWant はその行き先
  // cam: カメラの角度(端末の傾き φ のうち、もうリングに渡し終えた分)。描く時は場面全体を cam だけ逆に回す
  // 1 tick に回せるのは MAX_TURN_PER_TICK(見本の MAX_STEP)まで。del と cam の動きの合計をそこに収める。端末を速く回すと
  // リングの世界の角度が遅れて追い、カメラも同じだけ遅れる(cam = cur - del なので、絵と物理がずれず、画面の上のリングも揺れない)
  let cur = 0, del = 0, delWant = 0, cam = 0;
  let drag = null;                 // { id, last }: ドラッグ中
  let tiltOn = false, tiltRaw = null, tiltU = 0, tiltS = 0, easing = false, lastO = null;
  const wrapPi = (v) => v - Math.PI * 2 * Math.floor((v + Math.PI) / (Math.PI * 2));
  function inputTick() {
    const camWant = tiltOn && tiltRaw !== null ? tiltS : 0;
    let dd = (delWant - del) * (drag ? 1 : 0.35);
    let dc = (camWant - cam) * (easing ? 0.12 : 1);   // 傾きを使い始めた時・やめた時は、ゆっくり(中の物がなだらかに流れる)
    const sum = Math.abs(dd + dc);
    if (sum > MAX_TURN_PER_TICK) { const f = MAX_TURN_PER_TICK / sum; dd *= f; dc *= f; }
    del += dd; cam += dc; cur = cam + del;
    if (easing && Math.abs(camWant - cam) < 0.01) easing = false;
    // 見本の角度は上が +y の向き(反時計回りが +)。画面の時計回り = 見本の負の向き。整数は 65536 で割った余りで渡す
    return wrapQ(Math.round(-cur / (Math.PI * 2) * TURN));
  }

  function centerAngle(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width * PANEL.w / 2), y = e.clientY - (r.top + r.height * PANEL.h / 2);
    return Math.hypot(x, y) < 10 ? null : Math.atan2(y, x);   // 真ん中のすぐ近くでは角度が暴れるので使わない
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, last: centerAngle(e) };
    delWant = del;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    interacted();
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const a = centerAngle(e);
    if (a === null) return;
    if (drag.last !== null) delWant = del + Math.max(-MAX_LEAD, Math.min(MAX_LEAD, delWant + wrapPi(a - drag.last) - del));
    drag.last = a;
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    canvas.classList.remove("dragging");
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") delWant += KEY_STEP;
    else if (e.key === "ArrowLeft") delWant -= KEY_STEP;
    else if (e.key === "Home") delWant = del - wrapPi(del);
    else return;
    interacted();
    e.preventDefault();
  });

  // --- 傾き(押した人だけ) ---
  const tiltBtn = card.querySelector(".phys-tilt-button"), statusEl = card.querySelector(".phys-status");
  let gotEvent = false;
  const say = (k) => { if (statusEl) statusEl.textContent = k ? text(k) : ""; };
  if (tiltBtn && "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches) {
    tiltBtn.hidden = false;
    tiltBtn.addEventListener("click", () => { if (tiltOn) stopTilt(); else startTilt(); });
  }
  function startTilt() {
    say("");
    const D = window.DeviceOrientationEvent;
    if (typeof D.requestPermission === "function") {
      D.requestPermission().then((r) => { if (r === "granted") listen(); else say("denied"); }, () => say("denied"));
    } else listen();
  }
  function listen() {
    tiltOn = true; gotEvent = false; tiltRaw = null; lastO = null;
    window.addEventListener("deviceorientation", onOrientation);
    tiltBtn.textContent = text("tiltOff");
    interacted();
    setTimeout(() => { if (tiltOn && !gotEvent) { stopTilt(); say("nosensor"); } }, 2000);
  }
  function stopTilt() {
    tiltOn = false; tiltRaw = null; easing = true;   // カメラはゆっくり 0 へ(中の物は画面の下へ流れる)
    window.removeEventListener("deviceorientation", onOrientation);
    tiltBtn.textContent = text("tilt");
  }
  // 地面の上の向きを端末の向き(beta・gamma)から出し、画面の面に写した向きの角度を φ にする(画面を時計回りに傾けると +。-180〜180 度)。
  // 端末の座標(右 +x・端末の上 +y)での上の向き = (-cos β sin γ, sin β)。画面が横の時は、画面の向きの角度だけ回す。
  // φ は前の値からの近い向きの差を足していく(tiltU)ので、180 度をまたいでも反対回りに 1 周しない
  function onOrientation(e) {
    if (e.beta === null || e.gamma === null) return;
    gotEvent = true;
    const d2r = Math.PI / 180, b = e.beta * d2r, g = e.gamma * d2r;
    const ux = -Math.cos(b) * Math.sin(g), uy = Math.sin(b);
    const o = ((screen.orientation && typeof screen.orientation.angle === "number") ? screen.orientation.angle : (window.orientation || 0)) * d2r;
    // 画面の座標 = 端末の座標を画面の向きの角度 o だけ回した物(o は端末を反時計回りに回した角度。PadPlay の peek-world.js と同じ R・Rz(-o))
    const sx = ux * Math.cos(o) - uy * Math.sin(o), sy = ux * Math.sin(o) + uy * Math.cos(o);
    if (Math.hypot(sx, sy) < 0.3) return;   // ほぼ水平に寝かせている時は、向きが決まらないので前の角度のまま
    const th = Math.atan2(-sx, sy);         // 時計回りに傾けると +
    if (tiltRaw === null) { tiltU = tiltS = cam + wrapPi(th - cam); easing = true; }
    else {
      const j = wrapPi(th - tiltRaw);
      if (lastO !== null && o !== lastO) {
        // 画面の向き(縦・横)が変わった: 現実のリングと中の物は動いていない。見本の角度(cur)は変えず、
        // カメラを一度に合わせて、画面の上のリングの角度でその分を引き取る
        cam += j; del -= j; delWant -= j; tiltS += j;
      }
      tiltU += j;
    }
    tiltRaw = th; lastO = o;
    // 少しのゆれを止める(入力の側だけ。見本には整数の角度しか渡さない)
    const dd = tiltU - tiltS;
    if (Math.abs(dd) > 0.003) tiltS += dd * 0.35;
  }

  // --- 文: tick と状態のハッシュ(10 回 / 秒まで)、決まった入力の確かめ ---
  const stats = card.querySelector(".phys-stats"), liveEl = card.querySelector(".phys-live"), verifyEl = card.querySelector(".phys-verify");
  let lastStats = 0, statsCount = 0;
  function showStats(now) {
    if (now - lastStats < 100) return;
    lastStats = now;
    if (++statsCount % 10 === 0) syncRing();
    const s = text("state", { tick: demo.tick, hash: demo.hash });
    if (liveEl.textContent !== s) liveEl.textContent = s;
  }
  // 決まった入力の確かめは、別のスレッド(Worker。phys-verify.js)で見本をもう 1 つ読んで回す(ページのスクロールや描くのを止めない)。
  // Worker が使えない時は出さない
  function scheduleVerify() {
    setTimeout(() => {
      let w;
      try { w = new Worker(new URL("phys-verify.js", import.meta.url), { type: "module" }); } catch (err) { return; }
      verifyEl.textContent = text("checking");
      const done = (r) => {
        w.terminate();
        verifyEl.textContent = r && !r.error ? text(r.ok ? "same" : "differ", r) : "";
      };
      w.onmessage = (e) => done(e.data);
      w.onerror = () => done(null);
      w.postMessage({ base: base.href });
    }, 600);
  }

  // --- 最初から ---
  const resetBtn = card.querySelector(".phys-reset");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    demo.reset(); shapes = [];
    syncRing();
    // 見本のリングは角度 0 に戻る。カメラ(傾き)はそのままにして、画面の上のリングの角度で合わせる(cur = cam + del = 0)
    del = delWant = -cam; cur = 0;
    dirty = true;
    interacted();
  });

  // --- いつ動かすか: 段が見えていて、タブが前にある間だけ。動きを減らす設定では、触るまで動かさない ---
  let visible = false, raf = 0, last = 0, acc = 0, dirty = true, started = !reduce.matches;
  function interacted() { if (!started) { started = true; } wake(); }
  function wake() {
    if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); }
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (!last) last = now;
    let dt = now - last;
    last = now;
    if (dt > 100) dt = TICK_MS;          // 止まっていた後は、ためた時間を捨てる
    let n = 0;
    if (started) {
      acc += dt;
      while (acc >= TICK_MS && n < MAX_TICKS_PER_FRAME) {
        const q = inputTick();
        demo.step(q);
        followRing(q);
        acc -= TICK_MS;
        n++;
      }
      if (acc >= TICK_MS) acc = 0;         // 追いつけない分は捨てる(遅い端末で固まらない)
    }
    if (n || dirty) { draw(); dirty = false; showStats(now); }
    if (started) raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) wake();
  }).observe(canvas);
  document.addEventListener("visibilitychange", wake);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  // --- 出す ---
  canvas.hidden = false;
  resize();
  draw();
  dirty = false;
  canvas.classList.add("live");
  card.querySelectorAll(".phys-hint, .phys-tools, .phys-stats").forEach((el) => { el.hidden = false; });
  showStats(performance.now());
  scheduleVerify();
}
