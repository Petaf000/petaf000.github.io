// DetPhys browser demo: a ring with teeth turned by one integer input per tick, with bodies tumbling inside.
// Loads detphys_demo.wasm (no other files). Works in browsers and in Node.js (file: URLs).
// The simulation only receives integers; the floats returned here are read-only copies for drawing.

const SCRATCH_FLOATS = 512;

function makeImports(module, state) {
  const imports = {};
  for (const imp of WebAssembly.Module.imports(module)) {
    if (imp.kind !== 'function') continue;
    const mod = (imports[imp.module] ??= {});
    let fn;
    if (imp.name === 'emscripten_notify_memory_growth') {
      fn = () => {};                                     // views are made fresh on every read
    } else if (imp.name === 'proc_exit' || imp.name === 'abort' || imp.name.includes('assert')) {
      fn = (code) => { state.failed = true; throw new Error(`detphys_demo: stopped (${imp.name} ${code ?? ''})`); };
    } else {
      fn = () => 0;                                      // nothing else is used by the demo (no files, no clock, no printing)
    }
    mod[imp.name] = fn;
  }
  return imports;
}

async function loadModule(url) {
  if (url.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    return WebAssembly.compile(await readFile(url));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`detphys_demo: cannot load ${url} (${res.status})`);
  if (WebAssembly.compileStreaming && (res.headers.get('content-type') || '').includes('application/wasm')) {
    return WebAssembly.compileStreaming(res);
  }
  return WebAssembly.compile(await res.arrayBuffer());
}

/**
 * Loads the demo. `baseUrl` is the folder that holds detphys_demo.wasm (default: next to this file).
 * Returns an object with reset / step / tick / hash / ring / bodies / bodyShape / verify.
 */
export async function loadDetPhysDemo(baseUrl = new URL('./', import.meta.url)) {
  const url = new URL('detphys_demo.wasm', baseUrl);
  const module = await loadModule(url);
  const state = { failed: false };
  const instance = await WebAssembly.instantiate(module, makeImports(module, state));
  const ex = instance.exports;
  if (typeof ex._initialize === 'function') ex._initialize();

  const h = ex.dpdemo_create();
  if (!h) throw new Error('detphys_demo: cannot create the world');
  const scratch = ex.dpdemo_scratch(h);
  const floats = (n) => new Float32Array(ex.memory.buffer, scratch, n).slice();
  const hex = (hi, lo) => (hi >>> 0).toString(16).padStart(8, '0') + (lo >>> 0).toString(16).padStart(8, '0');
  const ring = (which) => floats(2 * ex.dpdemo_ring_read(h, which));
  const now = () => (globalThis.performance ? performance.now() : Date.now());

  const demo = {
    /** One turn of the ring in input units. */
    TURN: 65536,
    /** Ticks per second (fixed). */
    TICK_HZ: 60,
    /** The most the ring turns in one tick, in input units (it follows a far target over several ticks). */
    MAX_STEP: 1024,

    /** Goes back to the first state. */
    reset() {
      if (ex.dpdemo_reset(h) !== 0) throw new Error('detphys_demo: reset failed');
    },
    /** Advances one tick. angleQ: the target angle of the ring as an integer (one turn = 65536; any integer, taken modulo 65536). */
    step(angleQ) {
      if (!Number.isInteger(angleQ)) throw new TypeError('detphys_demo: step(angleQ) needs an integer');
      if (ex.dpdemo_step(h, angleQ | 0) !== 0) throw new Error('detphys_demo: step failed');
    },
    /** The current tick. */
    get tick() { return ex.dpdemo_tick(h) >>> 0; },
    /** The 64-bit hash of the current state, as 16 hex digits. */
    get hash() { return hex(ex.dpdemo_hash_hi(h), ex.dpdemo_hash_lo(h)); },
    /**
     * The ring, in world coordinates (metres), turned to the current angle.
     *   outline: one polygon to fill (outer circle, then the inner edge with the teeth in reverse, joined by one seam)
     *   inner / outer: the two edges as closed loops (counter-clockwise), for drawing lines
     *   angle: radians (-pi to pi), angleQ: the integer angle the ring is at (not wrapped)
     */
    get ring() {
      return { outline: ring(0), inner: ring(1), outer: ring(2), angle: ex.dpdemo_ring_angle(h), angleQ: ex.dpdemo_ring_angle_q(h) };
    },
    /** The bodies for drawing: data = [x, y, angle, kind, size] per body (kind 0 = circle, 1 = polygon; size = radius / farthest vertex, metres). */
    get bodies() {
      const count = ex.dpdemo_bodies_read(h);
      return { count, stride: 5, data: floats(5 * count) };
    },
    /** The vertices of body i in its own coordinates (x, y, ... metres, counter-clockwise). Empty for circles. Does not change during the demo. */
    bodyShape(i) {
      return floats(2 * ex.dpdemo_body_shape_read(h, i >>> 0));
    },
    /**
     * Runs a fixed input sequence (600 ticks, the ring going back and forth) in a new world and compares the final hash
     * with the value computed natively (Windows, Android, iOS builds of the same code). The current demo is not touched.
     */
    verify() {
      const ticks = ex.dpdemo_verify_ticks() >>> 0;
      const t0 = now();
      if (ex.dpdemo_verify_run(ticks, scratch) !== 0) throw new Error('detphys_demo: verify failed');
      const ms = now() - t0;
      const out = new Uint32Array(ex.memory.buffer, scratch, 2);
      const hash = hex(out[0], out[1]);
      const expected = hex(ex.dpdemo_verify_expected_hi(), ex.dpdemo_verify_expected_lo());
      return { ticks, hash, expected, ok: hash === expected && expected !== '0000000000000000', ms };
    },
  };
  return demo;
}
