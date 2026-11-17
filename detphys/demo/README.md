# DetPhys browser demo

A ring with teeth on its inside, turned by one integer per tick, with 14 bodies (6 circles, 4 boxes, 4 polygons) tumbling inside.
The physics runs in WebAssembly and gives the same results, bit for bit, as the native builds of the same code on Windows and Android.

Files: `detphys_demo.js` (ES module) and `detphys_demo.wasm`. Nothing else is needed.

## Usage

```js
import { loadDetPhysDemo } from './detphys_demo.js';
const demo = await loadDetPhysDemo(new URL('./', import.meta.url));   // the folder that holds detphys_demo.wasm

demo.reset();          // back to the first state
demo.step(angleQ);     // advance one tick; angleQ = target angle of the ring, an integer (one turn = 65536)
demo.tick;             // current tick (integer)
demo.hash;             // 64-bit hash of the current state, 16 hex digits
demo.ring;             // { outline, inner, outer, angle, angleQ }
demo.bodies;           // { count, stride: 5, data: Float32Array [x, y, angle, kind, size, ...] }
demo.bodyShape(i);     // Float32Array [x, y, ...] of body i in its own coordinates (empty for circles)
demo.verify();         // { ticks, hash, expected, ok, ms }
```

- **Fixed 60 ticks per second.** Call `step` once per tick (for example, accumulate frame time and step while it is at least 1/60 s).
- **Input:** `step(angleQ)` takes any integer and uses it modulo 65536. The ring turns toward it the short way, at most `demo.MAX_STEP` (1024, 1/64 turn) per tick, so a far target is reached over several ticks. Non-integers throw.
- **Coordinates:** metres, y up, the ring is centred on (0, 0). Outer radius 3.0 m, inner radius 2.6 m, tooth tips 2.25 m. Flip y when drawing on a canvas.
- `ring.outline` is one polygon to fill (the outer circle, then the inner edge with the teeth in reverse, joined by a single seam). `ring.inner` and `ring.outer` are the two edges as closed loops, for drawing lines. All are already turned to the current angle. `ring.angle` is in radians (-pi to pi); `ring.angleQ` is the integer angle the ring is at (not wrapped).
- `bodies.data`: `kind` 0 = circle, 1 = polygon. `size` = radius for circles, distance to the farthest vertex for polygons. The polygon of a body does not change, so `bodyShape(i)` can be read once.
- Everything returned is a copy for drawing. The simulation only receives the integer angle.
- `verify()` runs a fixed 600-tick input sequence (the ring held still, turned steadily, swung back and forth, then given jumpy targets) in a separate world and compares the final hash with the value computed by the native builds. It does not change the running demo.

No threads, no WebAssembly SIMD and no special HTTP headers are needed. Serving `.wasm` as `application/wasm` lets the browser compile it while downloading; other types also work.

## Same results on every platform

`verify()` gives `5ffae323309fbbaf` on all of these:

| Platform | Build |
|---|---|
| Windows x64 | MSVC (Release, Release with AVX2, Debug), clang-cl, MinGW-w64 GCC |
| Android arm64 | Galaxy S9 (Android 10), native |
| Android arm64 | Galaxy S9, Chrome 157 (this WebAssembly file) |
| WebAssembly | Node.js 24 (this file) |

On iOS (arm64) the engine's standard test scenes give the same hashes as above; this demo's sequence has not been run on iOS yet.

## Size and speed

| | Size | gzip |
|---|---|---|
| detphys_demo.wasm | 193 KB | 89 KB |
| detphys_demo.js | 6 KB | 2 KB |

Time for one tick (14 bodies, ring turning; mean over 3,600 ticks):

| Device | Mean | Slowest tick |
|---|---|---|
| PC (Core i7-12700F), Node.js 24 | 0.11-0.13 ms | 0.4-0.8 ms |
| Galaxy S9 (2018), Chrome 157 | 0.33 ms | 0.9-1.0 ms |

At 60 ticks per second this is under 1% of the time on the PC and about 2% on the phone. Browsers measure time in 0.1 ms steps, so the slowest-tick figures are rounded.

## License

The demo contains Box2D:

```
MIT License

Copyright (c) 2022 Erin Catto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

DetPhys is not affiliated with or endorsed by Box2D or its author.

---

## 日本語

リングの内側に歯があり、毎 tick の整数 1 つでリングを回すと、中の 14 個のボディ（丸 6・箱 4・多角形 4）が転がります。
物理は WebAssembly で動き、同じコードを Windows・Android でネイティブに組んだ物とビット単位で同じ結果になります。

- `step(angleQ)` は 1 tick 進めます。`angleQ` はリングの目標の角度の整数（1 回転 = 65536、どの整数でも 65536 で割った余りを使う）。リングは近い向きに、1 tick に最大 1024（1/64 回転）まで回ります。整数でない値を渡すと例外になります。
- 60 tick/秒の固定です。経過時間をためて、1/60 秒ごとに `step` を呼んでください。
- 座標はメートル、y が上、リングの中心は (0, 0)。外の半径 3.0 m・内の半径 2.6 m・歯の先 2.25 m。canvas に描く時は y を反転します。
- `ring.outline` は塗る用の 1 本の多角形、`ring.inner`・`ring.outer` は線を描く用の輪郭です。どれも今の角度に回してあります。
- 返す値は描く用の写しです。シミュレーションに入るのは整数の角度だけです。
- `verify()` は決まった 600 tick の入力を別のワールドで回し、最後のハッシュをネイティブで出した値と比べます（動いている見本には触りません）。
- スレッド・WebAssembly の SIMD・特別な HTTP ヘッダーは要りません。

大きさ・速さ（1 tick の平均は PC の Node.js で 0.11〜0.13 ms、Galaxy S9 の Chrome で 0.33 ms）・一致を確かめた環境は上の表のとおりです。Box2D（MIT）のライセンス文は上の「License」にあります。DetPhys は Box2D およびその作者とは無関係で、公認されたものではありません。
