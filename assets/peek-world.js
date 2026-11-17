// peek-world.js — トップの PadPlay の段の「のぞき窓」(peek.js が、段が見えそうになった時に読む)。
// ページの奥に浮き島の 3D の世界があり、P1 のスマホの画面はそこへの窓になる。拡大鏡ではなく、窓の位置から見える物をそのまま見せる:
//   見る人の目をページの前(画面の真ん中から EYE_UNITS だけ手前)に置き、目からスマホの画面の四角を通した視錐台(軸のずれた錐台)で描く。
//   スマホを動かしても、ページを送っても、その方向の景色が見える。
// - 傾き: 「傾けて見回す」を押した人だけ、端末の向きのイベントを使う(iOS は押した時に DeviceOrientationEvent.requestPermission で許可を聞く)。
//   見回すのは目の向きだけで、窓の位置はそのまま。うしろを向き続けると、うしろの空をクジラが泳いでいる(傾きを使っている時だけ)。
// - キーボード: スマホに移って矢印キーで動かす(Shift で大きく)。Home で元の場所へ。
// - 外の物は読まない。WebGL 1 だけで、ライブラリは使わない。段が見えている間だけ描く。
//   動きを減らす設定(prefers-reduced-motion)では雲を流さず、触った時・傾けた時だけ描く。WebGL が無い時は静止画のまま(動かさない)。
(function () {
  "use strict";

  var card = document.querySelector("[data-peek]");
  if (!card || card.getAttribute("data-peek-live")) return;
  var phone = card.querySelector(".peek-phone");
  var screenBox = card.querySelector(".peek-screen");
  var tvImg = card.querySelector(".plate-inner > img");
  if (!phone || !screenBox || !tvImg) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // --- 決まった値 ---
  var TV_CENTER = [488 / 1044, 278 / 748];   // 絵(hero-tv.webp)の中の TV の真ん中。世界の原点はここ(ページの面の上)
  var TV_UNITS = 5.6;                         // TV の絵の幅 = 世界の 5.6 の長さ(画面の幅が変わっても見え方の比を保つ)
  var EYE_UNITS = 8.5;                        // 目はページの面から、この長さだけ手前
  var EYE_FOLLOW = 0.4;                       // 目は TV の真ん中の前から、画面の真ん中の方へこの割合だけ寄る(ページを送ると景色が少しずれる)
  var PHONE_TILT_DEG = 2.5;                   // スマホの絵の傾き(style.css の rotate と同じ)
  var KEY_STEP_PX = 24;
  var DRAG_MARGIN_PX = 160;                   // スマホを段の上下にはみ出させてよい量
  var BEHIND_HOLD_MS = 500;                   // うしろを向き続ける時間
  var WHALE_UNITS = 14;                       // うしろのクジラまでの長さ
  var WHALE_SCALE = 0.45;                     // クジラの大きさ(元の形は頭から尾びれまで約 7.5)

  // --- WebGL ---
  var canvas = document.createElement("canvas");
  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "low-power" });
  } catch (err) { gl = null; }
  if (!gl) return;   // スマホに静止画が出たまま
  card.setAttribute("data-peek-live", "1");
  canvas.setAttribute("aria-hidden", "true");
  screenBox.appendChild(canvas);

  var VS = [
    "attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol;",
    "uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel;",
    "uniform vec3 uTint; uniform float uEmit; uniform float uFog;",
    "varying vec3 vCol; varying float vFog;",
    "void main() {",
    "  vec4 vp = uView * (uModel * vec4(aPos, 1.0));",
    "  vec3 n = normalize((uModel * vec4(aNor, 0.0)).xyz);",
    "  float d = max(dot(n, normalize(vec3(0.45, 0.8, 0.4))), 0.0);",
    "  vec3 c = aCol * uTint;",
    "  vCol = mix(c * (0.6 + 0.48 * d), c, uEmit);",
    "  vFog = uFog * clamp((length(vp.xyz) - 22.0) / 80.0, 0.0, 0.75);",
    "  gl_Position = uProj * vp;",
    "}"].join("\n");
  var FS = [
    "precision mediump float;",
    "uniform vec3 uFogCol; varying vec3 vCol; varying float vFog;",
    "void main() { gl_FragColor = vec4(mix(vCol, uFogCol, vFog), 1.0); }"].join("\n");

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.bindAttribLocation(prog, 1, "aNor");
  gl.bindAttribLocation(prog, 2, "aCol");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  var U = {};
  ["uProj", "uView", "uModel", "uTint", "uEmit", "uFog", "uFogCol"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  // --- 行列(4×4 は列優先。GL にそのまま渡す) ---
  function m4() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++)
      for (var r = 0; r < 4; r++)
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function T(x, y, z) { var m = m4(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function S(x, y, z) { var m = m4(); m[0] = x; m[5] = y === undefined ? x : y; m[10] = z === undefined ? x : z; return m; }
  function RY(a) { var c = Math.cos(a), s = Math.sin(a), m = m4(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
  function chain() { var m = m4(); for (var i = 0; i < arguments.length; i++) m = mul(m, arguments[i]); return m; }
  function tp(m, p) {
    return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
            m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
            m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  }
  function frustum(l, r, b, t, n, f) {
    return [2 * n / (r - l), 0, 0, 0, 0, 2 * n / (t - b), 0, 0,
            (r + l) / (r - l), (t + b) / (t - b), -(f + n) / (f - n), -1, 0, 0, -2 * f * n / (f - n), 0];
  }
  // 3×3(行優先)。端末の向きの計算だけで使う
  function m3mul(a, b) {
    var o = new Array(9);
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 3; c++)
        o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    return o;
  }
  function m3rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function m3ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function m3rz(a) { var c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; }

  // --- 形を組む(面ごとの法線。低いポリゴンの見た目) ---
  function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  var C = {
    grass: hex("#93D46E"), grassSide: hex("#74B95A"), dirt: hex("#A06A45"), dirtDark: hex("#7E5137"),
    trunk: hex("#7A5236"), leaf: hex("#3F9E5C"), leaf2: hex("#55B46C"), wall: hex("#F3ECDD"), roof: hex("#E86F5F"),
    door: hex("#8B5A3C"), stone: hex("#A4AAB2"), water: hex("#7CC8F0"), white: hex("#F4F2EE"), red: hex("#D9534F"),
    dark: hex("#3A3F48"), lamp: hex("#FFD84A"), cloud: hex("#FFFFFF"),
    whale: hex("#3E5F8A"), whaleBelly: hex("#EDE6D6"),
    zenith: hex("#4F9FE6"), horizon: hex("#A8D6F4"), low: hex("#CFE8F8")
  };

  var V = [];
  function vert(p, n, c) { V.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2]); }
  function tri(m, a, b, c, col, inside) {
    var A = tp(m, a), B = tp(m, b), Cc = tp(m, c);
    var ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    var vx = Cc[0] - A[0], vy = Cc[1] - A[1], vz = Cc[2] - A[2];
    var n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    var len = Math.hypot(n[0], n[1], n[2]);
    if (len < 1e-9) return;
    n = [n[0] / len, n[1] / len, n[2] / len];
    var o = tp(m, inside);   // 面の内側の点。法線を外へ向ける
    if ((A[0] - o[0]) * n[0] + (A[1] - o[1]) * n[1] + (A[2] - o[2]) * n[2] < 0) n = [-n[0], -n[1], -n[2]];
    vert(A, n, col); vert(B, n, col); vert(Cc, n, col);
  }
  function quad(m, a, b, c, d, col, inside) { tri(m, a, b, c, col, inside); tri(m, a, c, d, col, inside); }

  // 円錐台: y0 から y1 まで、下の半径 r0・上の半径 r1。capCol があれば上下に蓋
  function cyl(m, r0, r1, y0, y1, seg, col, capCol, rot) {
    var o = [0, (y0 + y1) / 2, 0];
    rot = rot || 0;
    for (var i = 0; i < seg; i++) {
      var a0 = rot + i / seg * Math.PI * 2, a1 = rot + (i + 1) / seg * Math.PI * 2;
      var b0 = [r0 * Math.cos(a0), y0, r0 * Math.sin(a0)], b1 = [r0 * Math.cos(a1), y0, r0 * Math.sin(a1)];
      var t0 = [r1 * Math.cos(a0), y1, r1 * Math.sin(a0)], t1 = [r1 * Math.cos(a1), y1, r1 * Math.sin(a1)];
      if (r0 <= 0) tri(m, b0, t0, t1, col, o);
      else if (r1 <= 0) tri(m, b0, b1, t0, col, o);
      else quad(m, b0, b1, t1, t0, col, o);
      if (capCol && r1 > 0) tri(m, [0, y1, 0], t0, t1, capCol, o);
      if (capCol && r0 > 0) tri(m, [0, y0, 0], b1, b0, capCol, o);
    }
  }
  function box(m, w, h, d, col) {
    var x = w / 2, z = d / 2, o = [0, h / 2, 0];
    var p = [[-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z], [-x, h, -z], [x, h, -z], [x, h, z], [-x, h, z]];
    [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].forEach(function (f) {
      quad(m, p[f[0]], p[f[1]], p[f[2]], p[f[3]], col, o);
    });
  }
  // 切妻の屋根(幅 w・高さ h・奥行き d。底が y=0)
  function roof(m, w, h, d, col) {
    var x = w / 2, z = d / 2, o = [0, h / 3, 0];
    var a = [-x, 0, -z], b = [x, 0, -z], c = [0, h, -z], a2 = [-x, 0, z], b2 = [x, 0, z], c2 = [0, h, z];
    tri(m, a, b, c, col, o); tri(m, a2, b2, c2, col, o);
    quad(m, a, c, c2, a2, col, o); quad(m, b, c, c2, b2, col, o);
  }
  // 正二十面体を 1 回分けた球(半径 1)
  var ICO = (function () {
    var t = (1 + Math.sqrt(5)) / 2;
    var v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
             [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
    var f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
             [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    var out = [];
    f.forEach(function (k) {
      var a = v[k[0]], b = v[k[1]], c = v[k[2]];
      var ab = nrm(mid(a, b)), bc = nrm(mid(b, c)), ca = nrm(mid(c, a));
      out.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    });
    return out;
    function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; }
    function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; }
  })();
  function ball(m, col) { ICO.forEach(function (f) { tri(m, f[0], f[1], f[2], col, [0, 0, 0]); }); }

  function tree(x, z, s, base) {
    base = base || m4();
    cyl(chain(base, T(x, 0, z), S(s)), 0.1, 0.08, 0, 0.55, 6, C.trunk, C.trunk);
    ball(chain(base, T(x, 0.95 * s, z), S(0.52 * s)), C.leaf);
    ball(chain(base, T(x + 0.08 * s, 1.42 * s, z - 0.05 * s), S(0.34 * s)), C.leaf2);
  }
  // 島: 上が y=0 の草の円盤・土の帯・下へ尖る岩
  function island(base, r, rot) {
    cyl(base, r * 0.97, r, -0.28, 0, 11, C.grassSide, C.grass, rot);
    cyl(base, r * 0.86, r * 0.97, -0.95, -0.28, 11, C.dirt, null, rot);
    cyl(base, 0, r * 0.86, -0.95 - r * 0.95, -0.95, 9, C.dirtDark, null, rot + 0.35);
  }

  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- 世界(長さの 1 = 絵の幅の 1/5.6。原点はページの面の上の TV の真ん中。奥が -z、上が +y) ---
  // 置き場所は「ページの面の上の点」と奥行きで決める: 目を (0, 0, EYE_UNITS) に置いた時に、ページの面のその点の向こうに見える所。
  // こうすると、窓をどこへ動かしても何かが見える
  function behind(px, py, z) { var k = (EYE_UNITS - z) / EYE_UNITS; return [px * k, py * k, z]; }
  var PHONE_HOME = [1.21, -1.6];   // スマホの元の場所(ページの面の上。TV の真ん中から)

  function buildWorld() {
    V = [];
    // 見本の浮き島: 家・灯台・木・池・滝・灰色の箱。スマホの元の場所から少し見下ろす所に置く
    var c = behind(PHONE_HOME[0], PHONE_HOME[1], -15);
    var M = chain(T(c[0], c[1] - 1.3, c[2]), RY(-0.35));
    island(M, 3.2, 0.1);
    var house = chain(M, T(-1.3, 0, -0.4), RY(0.45));
    box(house, 1.1, 0.8, 0.95, C.wall);
    roof(chain(house, T(0, 0.8, 0)), 1.3, 0.5, 1.07, C.roof);
    box(chain(house, T(0.2, 0, 0.48)), 0.24, 0.44, 0.04, C.door);
    var lh = chain(M, T(0.45, 0, -1.3));
    cyl(lh, 0.36, 0.27, 0, 1.8, 10, C.white, C.white);
    cyl(lh, 0.345, 0.32, 0.55, 0.78, 10, C.red, null);
    cyl(lh, 0.31, 0.29, 1.18, 1.4, 10, C.red, null);
    cyl(lh, 0.31, 0.31, 1.8, 1.86, 10, C.dark, C.dark);
    cyl(lh, 0.22, 0.22, 1.86, 2.14, 8, C.lamp, null);
    cyl(lh, 0.33, 0, 2.14, 2.45, 10, C.red, C.red);
    box(chain(M, T(0.4, 0, 1.2), RY(-0.3)), 0.8, 0.5, 0.62, C.stone);
    cyl(chain(M, T(1.55, 0.005, 0.75)), 0.66, 0.66, 0, 0.03, 12, C.water, C.water);
    box(chain(M, T(2.9, -3.0, 1.55), RY(-0.5)), 0.36, 3.0, 0.1, C.water);
    [[-2.2, 0.5, 0.9], [-0.3, -2.3, 1.0], [1.7, -1.8, 0.85], [2.4, -0.3, 0.75], [-2.0, -1.5, 0.8],
     [-0.6, 1.5, 0.7], [1.0, 2.3, 0.68], [-2.4, 1.7, 0.62]].forEach(function (t) { tree(t[0], t[1], t[2], M); });

    // まわりの小さな島: ページの面に粗い格子を置き、ます目ごとに 1 つ(いくつかは空ける)
    var R = rng(7);
    for (var gx = -6; gx <= 6; gx++)
      for (var gy = -4; gy <= 4; gy++) {
        var px = gx * 2.6 + (R() - 0.5) * 1.6, py = gy * 2.3 + (R() - 0.5) * 1.4;
        var z = -(5 + R() * 16), keep = R(), kind = R(), turn = R() * 6, seed = R();
        if (keep < 0.22) continue;
        if (Math.hypot(px - PHONE_HOME[0], py - PHONE_HOME[1] + 0.4) < 2.4) continue;   // 見本の島の前は空ける
        var p = behind(px, py, z), k = (EYE_UNITS - z) / EYE_UNITS;
        islet(p, (0.3 + seed * 0.45) * k, kind, turn);
      }
    // 横とうしろ(傾けて見回す人のため)
    for (var i = 0; i < 14; i++) {
      var a = Math.PI * (0.6 + 1.8 * R());   // 横から、うしろを回って反対の横まで
      var dist = 14 + R() * 12;
      islet([Math.sin(a) * dist, (R() - 0.5) * 10, EYE_UNITS - Math.cos(a) * dist], 0.9 + R() * 1.1, R(), R() * 6);
    }
    return mesh();
  }
  function islet(p, r, kind, turn) {
    var b = chain(T(p[0], p[1], p[2]), RY(turn));
    island(b, r, turn);
    if (kind < 0.55) tree(r * 0.2, -r * 0.15, 0.35 + r * 0.35, b);
    if (kind > 0.35 && kind < 0.75) tree(-r * 0.45, r * 0.3, 0.3 + r * 0.3, b);
    if (kind >= 0.75 && kind < 0.88) box(chain(b, T(-0.1 * r, 0, 0.1 * r), RY(turn)), 0.5 * r, 0.35 * r, 0.4 * r, C.stone);
    if (kind >= 0.88) {   // 小さな家
      box(chain(b, T(0, 0, 0)), 0.55 * r, 0.4 * r, 0.5 * r, C.wall);
      roof(chain(b, T(0, 0.4 * r, 0)), 0.66 * r, 0.26 * r, 0.56 * r, C.roof);
    }
  }

  function buildCloud() {
    V = [];
    [[0, 0, 0, 1], [1.0, -0.1, 0.1, 0.72], [-1.0, -0.15, 0, 0.75], [0.35, 0.45, -0.1, 0.66], [-0.45, 0.3, 0.2, 0.6]].forEach(function (b) {
      ball(chain(T(b[0], b[1] * 0.7, b[2]), S(b[3], b[3] * 0.72, b[3])), C.cloud);
    });
    return mesh();
  }
  // 雲: [ページの面の x, y, 奥行き, 大きさ]。うしろの 3 つは奥行きの代わりに目からの位置
  var CLOUDS = [[-3.5, 2.6, -10, 0.55], [4.2, 3.2, -14, 0.6], [-7.5, -0.6, -8, 0.5], [7.8, 0.4, -9, 0.5], [0.2, -4.4, -12, 0.45],
                [-9, 4.6, -18, 0.6], [9.5, 4.2, -20, 0.65], [-1.5, 5.4, -16, 0.55], [-5.5, -4.2, -11, 0.5], [6, -3.6, -15, 0.5]].map(function (c) {
    var p = behind(c[0], c[1], c[2]);
    return [p[0], p[1], p[2], c[3] * (EYE_UNITS - c[2]) / EYE_UNITS];
  }).concat([[-14, 2, 14, 1.5], [15, 1.5, 18, 1.4], [5, 5, 26, 1.3]]);

  // うしろのクジラ(うしろを向き続けると現れる)。体は頭が +x・上が +y の低いポリゴンで、毎フレーム組み直す
  // (体のうねりと尾びれ・胸びれの動き。三角は 150 ほどなので軽い)。動きを減らす設定では止まった姿のまま
  var WHALE_X = [-3.0, -2.2, -1.2, -0.1, 1.0, 2.0, 2.8];     // 体の輪の位置(尾 → 頭)
  var WHALE_R = [0.1, 0.32, 0.62, 0.9, 0.95, 0.78, 0.42];     // 輪の半径
  var WHALE_SIDES = 8;
  function whaleBend(x, t) { var w = (3.2 - x) / 6.2; return 0.34 * w * w * Math.sin(x * 0.9 - t * 1.4); }
  function buildWhale(t) {
    V = [];
    var I = m4(), rings = [], sides = WHALE_SIDES;
    WHALE_X.forEach(function (x, i) {
      var r = WHALE_R[i], cy = whaleBend(x, t), ring = [];
      for (var j = 0; j < sides; j++) {
        var a = (j + 0.5) / sides * Math.PI * 2;
        ring.push([x, cy + Math.cos(a) * r * 0.82, Math.sin(a) * r]);
      }
      rings.push({ x: x, cy: cy, r: r, p: ring });
    });
    // 胴: 背は濃い青、腹はクリーム色
    for (var i = 0; i < rings.length - 1; i++) {
      var A = rings[i], B = rings[i + 1], o = [(A.x + B.x) / 2, (A.cy + B.cy) / 2, 0];
      for (var j = 0; j < sides; j++) {
        var k = (j + 1) % sides, a = A.p[j], b = A.p[k], c = B.p[k], d = B.p[j];
        var belly = (a[1] + b[1] + c[1] + d[1]) / 4 < o[1] - 0.3 * (A.r + B.r) / 2;
        quad(I, a, b, c, d, belly ? C.whaleBelly : C.whale, o);
      }
    }
    // 頭の先と尾の付け根を閉じる
    var head = rings[rings.length - 1], tail = rings[0];
    var nose = [3.3, whaleBend(3.3, t) - 0.08, 0], root = [-3.15, tail.cy, 0];
    for (var j2 = 0; j2 < sides; j2++) {
      var k2 = (j2 + 1) % sides;
      tri(I, head.p[j2], head.p[k2], nose, head.p[j2][1] < head.cy - 0.1 ? C.whaleBelly : C.whale, [head.x, head.cy, 0]);
      tri(I, tail.p[j2], tail.p[k2], root, C.whale, [tail.x + 0.2, tail.cy, 0]);
    }
    // 尾びれ: 尾の傾きに合わせて上下に振れる、左右 2 枚の平たい板
    var slope = (whaleBend(-2.9, t) - whaleBend(-3.1, t)) / 0.2, ty = tail.cy;
    [1, -1].forEach(function (side) {
      var p0 = [-3.0, ty, 0], p1 = [-3.6, ty - slope * 0.6 + 0.12, 0.5 * side], p2 = [-4.05, ty - slope * 1.05 + 0.38, 1.15 * side], p3 = [-3.5, ty - slope * 0.5 + 0.02, 0.15 * side];
      quad(I, p0, p1, p2, p3, C.whale, [-3.4, ty + 1, 0.4 * side]);
    });
    // 胸びれ: 腹の横から斜め下へ。ゆっくり羽ばたく
    var flap = Math.sin(t * 1.4 + 0.8) * 0.18, fy = whaleBend(1.1, t);
    [1, -1].forEach(function (side) {
      tri(I, [1.6, fy - 0.35, 0.78 * side], [0.9, fy - 0.45, 0.82 * side], [0.5, fy - 0.85 + flap, 1.9 * side], C.whale, [1.1, fy + 1, 0]);
    });
    // 背の小さなひれと、目
    var dy = whaleBend(-1.5, t);
    tri(I, [-1.2, dy + 0.62, 0], [-1.9, dy + 0.45, 0.05], [-1.85, dy + 0.85, 0], C.whale, [-1.6, dy, 0]);
    tri(I, [-1.2, dy + 0.62, 0], [-1.9, dy + 0.45, -0.05], [-1.85, dy + 0.85, 0], C.whale, [-1.6, dy, 0]);
    var ey = whaleBend(2.3, t);
    box(T(2.3, ey + 0.05, 0.62), 0.12, 0.12, 0.05, C.dark);
    box(T(2.3, ey + 0.05, -0.62), 0.12, 0.12, 0.05, C.dark);
    var n = V.length / 9;
    gl.bindBuffer(gl.ARRAY_BUFFER, whale.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.DYNAMIC_DRAW);
    V = [];
    whale.n = n;
  }

  function buildSky() {
    V = [];
    var rows = 12, cols = 18;
    function p(i, j) {
      var th = i / rows * Math.PI, ph = j / cols * Math.PI * 2;
      return [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
    }
    function col(q) {
      var y = q[1];
      if (y >= 0) return lerp(C.horizon, C.zenith, Math.pow(y, 0.7));
      return lerp(C.horizon, C.low, Math.min(1, -y * 3));
    }
    for (var i = 0; i < rows; i++)
      for (var j = 0; j < cols; j++) {
        var a = p(i, j), b = p(i + 1, j), c = p(i + 1, j + 1), d = p(i, j + 1);
        [a, b, c, a, c, d].forEach(function (q) { vert(q, [0, 1, 0], col(q)); });
      }
    return mesh();
  }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  function mesh() {
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW);
    var n = V.length / 9;
    V = [];
    return { buf: buf, n: n };
  }

  var world = buildWorld(), cloud = buildCloud(), sky = buildSky(), whale = { buf: gl.createBuffer(), n: 0 };

  // --- 描く ---
  var ONE = [1, 1, 1];
  function draw(m, model, tint, emit, fog) {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
    gl.uniformMatrix4fv(U.uModel, false, model);
    gl.uniform3fv(U.uTint, tint || ONE);
    gl.uniform1f(U.uEmit, emit || 0);
    gl.uniform1f(U.uFog, fog === undefined ? 1 : fog);
    gl.drawArrays(gl.TRIANGLES, 0, m.n);
  }

  var G = [1, 0, 0, 0, 1, 0, 0, 0, 1];   // 傾きで回した目の向き(3×3 行優先。傾きを使っていない時は単位)
  var animTime = 0, lastNow = 0;
  var found = false, foundAt = 0;

  function render(now) {
    var dt = lastNow ? Math.min(now - lastNow, 100) : 0;
    lastNow = now;
    if (!reduce.matches) animTime += dt / 1000;

    // 大きさ(CSS の大きさ × 画素の比。2 まで)
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    var pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    gl.viewport(0, 0, pw, ph);

    // 窓と目(世界の長さ。y は上が +)
    var tv = tvImg.getBoundingClientRect();
    var unitPx = tv.width / TV_UNITS;
    var ox = tv.left + tv.width * TV_CENTER[0], oy = tv.top + tv.height * TV_CENTER[1];
    var sr = canvas.getBoundingClientRect();
    var wx = (sr.left + sr.width / 2 - ox) / unitPx, wy = -(sr.top + sr.height / 2 - oy) / unitPx;
    var eye = [EYE_FOLLOW * (window.innerWidth / 2 - ox) / unitPx, -EYE_FOLLOW * (window.innerHeight / 2 - oy) / unitPx, EYE_UNITS];
    var a = -PHONE_TILT_DEG * Math.PI / 180;
    var right = [Math.cos(a), Math.sin(a), 0], up = [-Math.sin(a), Math.cos(a), 0];
    var dx = (eye[0] - wx) * right[0] + (eye[1] - wy) * right[1];
    var dy = (eye[0] - wx) * up[0] + (eye[1] - wy) * up[1];
    var hw = cw / 2 / unitPx, hh = ch / 2 / unitPx, near = 0.1, k = near / EYE_UNITS;
    var proj = frustum((-hw - dx) * k, (hw - dx) * k, (-hh - dy) * k, (hh - dy) * k, near, 900);

    // 目の向き = 傾き G × 窓の向き(右・上・手前)
    var gr = rot3(G, right), gu = rot3(G, up), gb = rot3(G, [0, 0, 1]);
    var view = [gr[0], gu[0], gb[0], 0, gr[1], gu[1], gb[1], 0, gr[2], gu[2], gb[2], 0,
                -dot(gr, eye), -dot(gu, eye), -dot(gb, eye), 1];

    gl.clearColor(C.horizon[0], C.horizon[1], C.horizon[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
    gl.uniformMatrix4fv(U.uProj, false, proj);
    gl.uniformMatrix4fv(U.uView, false, view);
    gl.uniform3fv(U.uFogCol, C.horizon);

    gl.disable(gl.DEPTH_TEST);
    draw(sky, chain(T(eye[0], eye[1], eye[2]), S(400)), ONE, 1, 0);
    gl.enable(gl.DEPTH_TEST);
    draw(world, m4());
    CLOUDS.forEach(function (c, i) {
      var x = wrap(c[0] + animTime * (0.12 + i % 3 * 0.04), -36, 36);
      draw(cloud, chain(T(x, c[1], c[2]), S(c[3])), ONE, 0.45);
    });

    // うしろのクジラ: 窓の真ん中を通る向きを、上下はそのまま前後と左右だけ反対にした所のまわりを、横向きにゆっくり泳ぐ
    if (found) {
      var wcx = wx - eye[0], wcy = wy - eye[1], wcz = -EYE_UNITS, wl = Math.hypot(wcx, wcy, wcz);
      var e = [eye[0] - wcx / wl * WHALE_UNITS, eye[1] + wcy / wl * WHALE_UNITS, eye[2] - wcz / wl * WHALE_UNITS];
      var st = reduce.matches ? 0 : (now - foundAt) / 1000;          // 現れてからの秒
      var ph = st * 0.18;                                           // 横に長い楕円を回る
      var pos = [e[0] + Math.sin(ph) * 1.0, e[1] + Math.sin(st * 0.5) * 0.25, e[2] + Math.cos(ph) * 0.6];
      var heading = Math.atan2(Math.sin(ph) * 0.6, Math.cos(ph) * 1.0);   // 進む向き(楕円の接線)へ頭を向ける
      var grow = reduce.matches ? 1 : Math.min(st / 0.9, 1);
      grow = 1 - (1 - grow) * (1 - grow);
      buildWhale(st);
      draw(whale, chain(T(pos[0], pos[1], pos[2]), RY(heading), S(WHALE_SCALE * grow)));
    }
    if (!phone.classList.contains("live")) phone.classList.add("live");
    checkBehind(gb, now);
  }
  function rot3(m, v) {
    return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function wrap(v, lo, hi) { var w = hi - lo; return lo + ((((v - lo) % w) + w) % w); }

  // --- いつ描くか: 段が見えていて、タブが前にある間だけ ---
  var visible = false, dirty = true, raf = 0, lost = false;
  function animating() { return !reduce.matches; }
  function wake() {
    dirty = true;
    if (!raf && visible && !document.hidden && !lost) raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden || lost) { lastNow = 0; return; }
    var anim = animating();
    if (dirty || anim) { render(now); dirty = false; }
    if (anim) raf = requestAnimationFrame(loop);
    else lastNow = 0;
  }
  new IntersectionObserver(function (entries) {
    visible = entries.some(function (e) { return e.isIntersecting; });
    if (visible) wake();
  }, { rootMargin: DRAG_MARGIN_PX + "px 0px" }).observe(card);
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", function () { setOffset(off[0], off[1]); });
  if (reduce.addEventListener) reduce.addEventListener("change", wake);
  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    lost = true;
    phone.classList.remove("live");   // 静止画に戻す
  });

  // --- スマホを動かす(ドラッグ・矢印キー) ---
  var off = [0, 0], drag = null;
  function setOffset(x, y) {
    var r = phone.getBoundingClientRect(), c = card.getBoundingClientRect();
    var hx = r.left + r.width / 2 - off[0], hy = r.top + r.height / 2 - off[1];   // 元の場所の真ん中
    var W = document.documentElement.clientWidth;
    x = Math.max(-hx, Math.min(W - hx, x));
    y = Math.max(c.top - DRAG_MARGIN_PX - hy, Math.min(c.bottom + DRAG_MARGIN_PX - hy, y));
    off = [Math.round(x), Math.round(y)];
    phone.style.setProperty("--peek-x", off[0] + "px");
    phone.style.setProperty("--peek-y", off[1] + "px");
    wake();
  }
  phone.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || e.target.closest(".peek-found")) return;
    drag = { id: e.pointerId, x: e.clientX - off[0], y: e.clientY - off[1] };
    phone.setPointerCapture(e.pointerId);
    phone.classList.add("dragging");
    e.preventDefault();
  });
  phone.addEventListener("pointermove", function (e) {
    if (drag && e.pointerId === drag.id) setOffset(e.clientX - drag.x, e.clientY - drag.y);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    phone.classList.remove("dragging");
  }
  phone.addEventListener("pointerup", endDrag);
  phone.addEventListener("pointercancel", endDrag);
  phone.addEventListener("dragstart", function (e) { e.preventDefault(); });
  phone.tabIndex = 0;
  phone.setAttribute("role", "application");
  phone.addEventListener("keydown", function (e) {
    var step = e.shiftKey ? KEY_STEP_PX * 4 : KEY_STEP_PX;
    var moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (e.key === "Home") { setOffset(0, 0); e.preventDefault(); return; }
    var mv = moves[e.key];
    if (!mv) return;
    setOffset(off[0] + mv[0], off[1] + mv[1]);
    e.preventDefault();
  });

  var hint = card.querySelector(".peek-hint");
  if (hint) hint.hidden = false;

  // --- 傾き(押した人だけ) ---
  var tiltBox = card.querySelector(".peek-tilt"), tiltBtn = card.querySelector(".peek-tilt-button");
  var statusEl = card.querySelector(".peek-status"), foundEl = card.querySelector(".peek-found");
  var tiltOn = false, gotEvent = false, base = null, behindSince = 0;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  if (tiltBox && tiltBtn && "DeviceOrientationEvent" in window && coarse) {
    tiltBox.hidden = false;
    tiltBtn.addEventListener("click", function () { if (tiltOn) stopTilt(); else startTilt(); });
  }
  function say(key) { if (statusEl) statusEl.textContent = key ? card.getAttribute("data-" + key) : ""; }
  function startTilt() {
    say("");
    var D = window.DeviceOrientationEvent;
    if (typeof D.requestPermission === "function") {
      D.requestPermission().then(function (r) { if (r === "granted") listen(); else say("denied"); }, function () { say("denied"); });
    } else listen();
  }
  function listen() {
    tiltOn = true; gotEvent = false; base = null;
    window.addEventListener("deviceorientation", onOrientation);
    tiltBtn.textContent = card.getAttribute("data-tilt-off");
    setTimeout(function () { if (tiltOn && !gotEvent) { stopTilt(); say("nosensor"); } }, 2000);
  }
  function stopTilt() {
    tiltOn = false;
    window.removeEventListener("deviceorientation", onOrientation);
    G = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    behindSince = 0;
    tiltBtn.textContent = card.getAttribute("data-tilt");
    if (foundEl) foundEl.hidden = true;
    wake();
  }
  // 端末の向き(地面の東・北・上に対して)→ この世界(右 +x・上 +y・ページの奥 -z)。
  // 押した時の向きを「ページを正面に見ている」とする: 左右の向きと上下の傾きをその時の値で引く(持った角度のまま見回せる)
  function onOrientation(e) {
    if (e.alpha === null && e.beta === null && e.gamma === null) return;
    gotEvent = true;
    var d2r = Math.PI / 180;
    var R = m3mul(m3mul(m3rz((e.alpha || 0) * d2r), m3rx((e.beta || 0) * d2r)), m3ry((e.gamma || 0) * d2r));
    var angle = (screen.orientation && typeof screen.orientation.angle === "number") ? screen.orientation.angle : (window.orientation || 0);
    R = m3mul(R, m3rz(-angle * d2r));
    var W = m3mul([1, 0, 0, 0, 0, 1, 0, -1, 0], R);
    if (!base) {
      var f = [-W[2], -W[5], -W[8]];
      var h = [f[0], f[2]];
      if (Math.hypot(h[0], h[1]) < 0.2) h = [W[1], W[7]];   // ほぼ水平に持っている時は、端末の上の向き
      var yaw = Math.atan2(-h[0], -h[1]);
      var pitch = Math.asin(Math.max(-1, Math.min(1, f[1])));
      base = { yaw: m3ry(-yaw), pitch: m3rx(-pitch) };
    }
    G = m3mul(m3mul(base.yaw, W), base.pitch);
    wake();
  }
  // うしろ(+z)を向き続けたら、うしろにクジラが現れる
  function checkBehind(back, now) {
    if (!tiltOn || found) return;
    var facingBack = back[2] < -0.5;   // 目の前の向き(-back)が +z の側
    if (!facingBack) { behindSince = 0; return; }
    if (!behindSince) behindSince = now;
    else if (now - behindSince > BEHIND_HOLD_MS) {
      found = true;
      foundAt = now;
      if (foundEl) foundEl.hidden = false;
      wake();
    }
  }
  setOffset(0, 0);
})();
