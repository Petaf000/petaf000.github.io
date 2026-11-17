// peek.js — トップの PadPlay の段の遊びの入口(小さく保つ)。
// - 段がページの真ん中あたりに来たら、ページの色を「おもちゃの箱」に変える(html.toybox。色は style.css)。
// - 段が見えそうになったら、3D の本体 /assets/peek-world.js を読む(見えるまで読まない)。
// 段は build.py の peek_card が作る [data-peek] の札。外の物は何も読まない。
(function () {
  "use strict";

  var card = document.querySelector("[data-peek]");
  if (!card || !("IntersectionObserver" in window)) return;
  var root = document.documentElement;
  root.classList.add("peek-ready");

  // --- 色: 段が画面の縦の真ん中 2 割にかかっている間 ---
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { root.classList.toggle("toybox", e.isIntersecting); });
  }, { rootMargin: "-40% 0px -40% 0px" }).observe(card);

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
