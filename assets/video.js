// video.js — 動画の札(自分たちの静止画と再生ボタン)を、押した時だけ YouTube の再生画面に替える。
// 押すまでは YouTube に何も読みに行かない。読み込みはプライバシー強化モード(www.youtube-nocookie.com)。
// 札の HTML は site/_tools/build.py(このサイト)と site/_tools/docs/app.js(PadPlay の文書)が作る:
//   <div class="yt" data-yt="<動画 ID>" data-title="<題>"><a class="yt-poster" href="https://www.youtube.com/watch?v=<動画 ID>">…</a></div>
//   JS が無い時や、Ctrl・中ボタンで押した時は、ふつうのリンクとして YouTube の頁を開く。
// トップの「はじめかたの動画を見る」のように data-yt-dialog を付けたリンクは、頁の上に重ねた枠の中で再生する。
(function () {
  "use strict";

  var EMBED = "https://www.youtube-nocookie.com/embed/";

  function frame(id, title) {
    var f = document.createElement("iframe");
    f.src = EMBED + encodeURIComponent(id) + "?autoplay=1";
    f.title = title || "YouTube";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    return f;
  }

  // --- 札 → 再生画面(同じ場所・同じ大きさ) ---
  function play(box) {
    var f = frame(box.getAttribute("data-yt"), box.getAttribute("data-title"));
    box.textContent = "";
    box.appendChild(f);
    box.classList.add("playing");
    f.focus();
  }

  // --- 重ねた枠の中で再生(閉じると再生画面ごと消す) ---
  function playInDialog(link) {
    var ja = (document.documentElement.lang || "").indexOf("ja") === 0;
    var d = document.createElement("dialog");
    d.className = "yt-dialog";
    d.setAttribute("aria-label", link.getAttribute("data-title") || "YouTube");
    var close = document.createElement("button");
    close.type = "button";
    close.className = "yt-close";
    close.textContent = ja ? "閉じる" : "Close";
    var box = document.createElement("div");
    box.className = "yt playing";
    box.appendChild(frame(link.getAttribute("data-yt-dialog"), link.getAttribute("data-title")));
    d.appendChild(close);
    d.appendChild(box);
    close.addEventListener("click", function () { d.close(); });
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });   // 枠の外(暗い所)を押した
    d.addEventListener("close", function () { d.remove(); link.focus(); });
    document.body.appendChild(d);
    d.showModal();
  }

  function plainClick(e) {
    return e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
  }

  function target(el) {
    var poster = el.closest && el.closest(".yt-poster");
    if (poster && poster.parentElement && poster.parentElement.hasAttribute("data-yt"))
      return { box: poster.parentElement };
    var link = el.closest && el.closest("[data-yt-dialog]");
    if (link && typeof HTMLDialogElement === "function")
      return { link: link };
    return null;
  }

  function start(t) {
    if (t.box)
      play(t.box);
    else
      playInDialog(t.link);
  }

  // --- 押す(マウス・タッチ・Enter)と Space(ボタンとして) ---
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || !plainClick(e))
      return;
    var t = target(e.target);
    if (!t)
      return;
    e.preventDefault();
    start(t);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== " " && e.key !== "Spacebar")
      return;
    var t = target(e.target);
    if (!t)
      return;
    e.preventDefault();
    start(t);
  });

  // --- JS がある時は、リンクを「再生」のボタンとして読ませる ---
  function upgrade() {
    var els = document.querySelectorAll(".yt-poster[data-play-label], [data-yt-dialog][data-play-label]");
    for (var i = 0; i < els.length; i++) {
      els[i].setAttribute("role", "button");
      els[i].setAttribute("aria-label", els[i].getAttribute("data-play-label"));
    }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", upgrade);
  else
    upgrade();
})();
