// phys-verify.js — トップの DetPhys の札の「決まった入力の確かめ」を回す Worker(ES モジュール。phys-world.js が作る)。
// 見本(detphys_demo.js と wasm)をこのスレッドでもう 1 つ読み、verify() の結果だけを返す。ページの側の見本の状態には触らない。
self.onmessage = async (e) => {
  try {
    const base = new URL(e.data.base);
    const mod = await import(new URL("detphys_demo.js", base).href);
    const demo = await mod.loadDetPhysDemo(base);
    const r = demo.verify();
    self.postMessage({ ticks: r.ticks, hash: String(r.hash), expected: String(r.expected), ok: !!r.ok });
  } catch (err) {
    self.postMessage({ error: true });
  }
};
