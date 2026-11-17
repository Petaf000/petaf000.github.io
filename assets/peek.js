// peek.js — トップの PadPlay の段の遊びの入口(小さく保つ)。
// - 段が見えそうになったら、3D の本体 /assets/peek-world.js を読む(見えるまで読まない)。
// - 段の地の色(「おもちゃの箱」)は style.css の .toy-zone。段といっしょに流れる地なので、JS では何も切り替えない。
// 段は build.py の peek_card が作る [data-peek] の札。外の物は何も読まない。
(function () {
  "use strict";

  var card = document.querySelector("[data-peek]");
  if (!card || !("IntersectionObserver" in window)) return;
  var root = document.documentElement;
  root.classList.add("peek-ready");

  // --- 3D: 段の 300px 手前まで来たら読む ---
  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    io.disconnect();
    var s = document.createElement("script");
    s.src = "/assets/peek-world.js";
    s.async = true;
    document.head.appendChild(s);
  }, { rootMargin: "300px 0px" });
  io.observe(card);
})();
