// phys.js — トップの DetPhys の段の遊びの入口(小さく保つ)。
// ページを読み終えてから、札の絵(.phys-stage)が画面の 120px 手前まで来たら、本体 /assets/phys-world.js(ES モジュール)を読む。
// wasm と見本の JS は本体が読む。それまでは何も読まない(開いた時に絵が画面の外なら、最初の表示では読まない)。
// 段は build.py の phys_card が作る [data-phys] の札。読めない・動かない時は、札の絵のまま。
(function () {
  "use strict";

  var card = document.querySelector("[data-phys]");
  var stage = card && card.querySelector(".phys-stage");
  if (!stage || !("IntersectionObserver" in window) || typeof WebAssembly !== "object") return;
  function watch() {
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var s = document.createElement("script");
      s.type = "module";
      s.src = "/assets/phys-world.js";
      document.head.appendChild(s);
    }, { rootMargin: "120px 0px" });
    io.observe(stage);
  }
  if (document.readyState === "complete") watch();
  else window.addEventListener("load", watch, { once: true });
})();
