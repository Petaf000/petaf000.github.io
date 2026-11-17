// DetPhys のドキュメントの JS（1 本）。無くても全部の文は読める（エンジンの見せ分けは、無い時は全部見せる）。
(function () {
  "use strict";
  var D = window.DETPHYS || {};
  var UI = D.ui || {};
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* file:// など */ } }
  };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- エンジンと次元 ----
  var ENG = ["unity", "godot", "unreal"], DIM = ["both", "2d", "3d"];
  var params = new URLSearchParams(location.search);
  var picker = $(".picker");
  var eng = params.get("engine");
  if (ENG.indexOf(eng) < 0) eng = store.get("detphys.engine");
  if (ENG.indexOf(eng) < 0) eng = "unity";
  var groups = $$(".codes");
  // エンジンごとのコードの組: 選んだエンジンの物を見せる（同じエンジンに 2 つの書き方があれば、前に選んだ方）
  var showCodes = function () {
    groups.forEach(function (g) {
      var panes = $$(".pane", g), tabs = $$("[role=tab]", g);
      var want = store.get("detphys.cv." + eng), pick = null, first = null;
      panes.forEach(function (p) {
        if (p.dataset.ce !== eng) return;
        if (!first) first = p;
        if (p.dataset.cv === want) pick = p;
      });
      pick = pick || first || panes[0];
      panes.forEach(function (p) { p.classList.toggle("on", p === pick); });
      tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.ce === pick.dataset.ce && t.dataset.cv === pick.dataset.cv)); });
      // 狭い画面でタブが横にはみ出す時は、選んだタブが見える所まで送る
      var on = $("[aria-selected=true]", g), bar = on && on.parentNode;
      if (bar && (on.offsetLeft < bar.scrollLeft || on.offsetLeft + on.offsetWidth > bar.scrollLeft + bar.clientWidth)) bar.scrollLeft = Math.max(0, on.offsetLeft - 16);
    });
  };
  var applyAll = function () { showCodes(); };
  groups.forEach(function (g) {
    g.addEventListener("click", function (e) {
      var t = e.target.closest("[role=tab]");
      if (!t) return;
      var top0 = g.getBoundingClientRect().top;
      eng = t.dataset.ce;
      store.set("detphys.engine", eng);
      store.set("detphys.cv." + eng, t.dataset.cv);
      applyAll();
      // 切り替えで上の組の高さが変わっても、押した組が画面の同じ所に残るようにする
      var d = g.getBoundingClientRect().top - top0;
      if (d) window.scrollBy(0, d);
    });
  });
  showCodes();
  if (picker) {
    var dim = params.get("dim");
    if (DIM.indexOf(dim) < 0) dim = store.get("detphys.dim");
    if (DIM.indexOf(dim) < 0) dim = "both";
    var apply = function () {
      html.setAttribute("data-eng", eng);
      html.setAttribute("data-dim", dim);
      $$("[data-set-engine]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setEngine === eng)); });
      $$("[data-set-dim]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setDim === dim)); });
      $$(".toc a").forEach(function (a) {
        var t = document.getElementById(decodeURIComponent(a.hash.slice(1)));
        a.parentNode.hidden = !!(t && t.offsetParent === null);
      });
      showCodes();
    };
    applyAll = apply;
    picker.hidden = false;
    picker.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.setEngine) { eng = b.dataset.setEngine; store.set("detphys.engine", eng); }
      if (b.dataset.setDim) { dim = b.dataset.setDim; store.set("detphys.dim", dim); }
      apply();
    });
    apply();
    // 隠れた節への深いリンクで来たら、その節のエンジンに切り替える
    if (location.hash) {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var sec = t && t.closest("[data-engine]");
      if (sec && sec.dataset.engine !== eng) { eng = sec.dataset.engine; apply(); t.scrollIntoView(); }
    }
  }

  // ---- 左の目次（狭い画面の引き出し）----
  var menu = $(".menu"), scrim = $(".scrim");
  var setNav = function (open) {
    document.body.classList.toggle("nav-open", open);
    if (menu) menu.setAttribute("aria-expanded", String(open));
    if (scrim) scrim.hidden = !open;
  };
  if (menu) menu.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  // 引き出しの中のリンク（同じ頁の節を含む）を押したら閉じる
  var side = document.getElementById("side");
  if (side) side.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  // ?nav=1 で目次を開いた状態で開く（狭い画面の確かめ・人に見せる時）
  if (/[?&]nav=1(&|$)/.test(location.search)) setNav(true);
  if (scrim) scrim.addEventListener("click", function () { setNav(false); });
  var cur = $(".side [aria-current='page']");
  if (cur && cur.scrollIntoView && window.innerWidth > 900) { var sd = $(".side"); if (sd) sd.scrollTop = Math.max(0, cur.offsetTop - 120); }

  // ---- このページ（今読んでいる節に印）----
  var tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[decodeURIComponent(a.hash.slice(1))] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          tocLinks.forEach(function (a) { a.classList.remove("on"); });
          map[en.target.id].classList.add("on");
        }
      });
    }, { rootMargin: "-64px 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }

  // ---- コードの写し ----
  $$(".cp").forEach(function (b) {
    b.addEventListener("click", function () {
      var code = b.parentNode.querySelector("code").textContent;
      var done = function () { b.textContent = UI.copied || "Copied"; setTimeout(function () { b.textContent = UI.copy || "Copy"; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () {});
    });
  });

  // ---- API の絞り込み ----
  var q = $("#apiq");
  if (q) {
    var rows = $$(".apilist tbody tr"), none = $(".api-none");
    q.addEventListener("input", function () {
      var v = q.value.trim().toLowerCase().replace(/\s+/g, "_"), n = 0;
      rows.forEach(function (r) { var hit = !v || r.dataset.k.indexOf(v) >= 0 || r.textContent.toLowerCase().indexOf(q.value.trim().toLowerCase()) >= 0; r.hidden = !hit; if (hit) n++; });
      if (none) none.hidden = n > 0;
    });
  }

  // ---- 検索 ----
  var dlg = $("dialog.search"), sbtn = $(".sbtn");
  if (dlg && typeof dlg.showModal === "function") {
    var input = $("input", dlg), list = $(".sr", dlg), active = -1, results = [];
    var norm = function (s) { return (s || "").normalize("NFKC").toLowerCase(); };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var load = function (cb) {
      if (window.DETPHYS_INDEX) return cb();
      var s = document.createElement("script");
      s.src = D.search; s.onload = cb; document.head.appendChild(s);
    };
    var snippet = function (x, terms) {
      var nx = norm(x), i = -1;
      for (var k = 0; k < terms.length && i < 0; k++) i = nx.indexOf(terms[k]);
      var from = Math.max(0, i - 24);
      var s = (from > 0 ? "…" : "") + x.slice(from, from + 120);
      var out = esc(s);
      terms.forEach(function (t) {
        if (!t) return;
        var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
        out = out.replace(re, "<mark>$1</mark>");
      });
      return out;
    };
    var run = function () {
      var raw = norm(input.value).trim();
      list.innerHTML = "";
      active = -1; results = [];
      if (!raw) return;
      var terms = raw.split(/\s+/);
      var idx = window.DETPHYS_INDEX || [];
      idx.forEach(function (e) {
        var t = norm(e.t), hay = t + " " + norm(e.g) + " " + norm(e.x), score = 0;
        for (var k = 0; k < terms.length; k++) {
          if (hay.indexOf(terms[k]) < 0) return;
          if (t.indexOf(terms[k]) >= 0) score += 10;
          if (t.indexOf(terms[k]) === 0) score += 4;
        }
        if (e.api && t === raw) score += 40;
        if (e.api) score += 2;
        results.push({ e: e, s: score });
      });
      results.sort(function (a, b) { return b.s - a.s; });
      results = results.slice(0, 24);
      if (!results.length) { list.innerHTML = '<li class="none">' + esc(UI.search_none || "") + "</li>"; return; }
      list.innerHTML = results.map(function (r, i) {
        var e = r.e, href = D.root + "/" + e.p + (e.a ? "#" + e.a : "");
        var title = e.api ? "<code>" + esc(e.t) + "</code>" : "<b>" + esc(e.t) + "</b>";
        return '<li role="option" id="sr' + i + '"><a href="' + esc(href) + '">' + title + (e.g ? "<small>" + esc(e.g) + "</small>" : "") +
          "<span>" + snippet(e.x || "", terms) + "</span></a></li>";
      }).join("");
      setActive(0);
    };
    var setActive = function (i) {
      var lis = $$("li", list);
      if (!lis.length) return;
      active = (i + lis.length) % lis.length;
      lis.forEach(function (l, k) { l.classList.toggle("on", k === active); });
      lis[active].scrollIntoView({ block: "nearest" });
    };
    var open = function () {
      load(function () { run(); });
      dlg.showModal();
      input.focus(); input.select();
    };
    if (sbtn) sbtn.addEventListener("click", open);
    document.addEventListener("keydown", function (e) {
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName))) {
        e.preventDefault(); open();
      }
    });
    input.addEventListener("input", function () { load(run); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") {
        var a = $("li.on a", list);
        if (a) { e.preventDefault(); dlg.close(); location.href = a.getAttribute("href"); }
      }
    });
    list.addEventListener("click", function (e) { if (e.target.closest("a")) dlg.close(); });
    // ?q=言葉 で開くと、検索をその言葉で開く（検索の結果をそのまま人に渡せる）
    if (params.get("q")) { input.value = params.get("q"); open(); input.setSelectionRange(input.value.length, input.value.length); }
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }

  // ---- トップの帳面: tick が進み、150 でずれ → 報告 → 再同期 ----
  var lg = $("#ledger");
  if (lg && !reduced) {
    var rows2 = $$("tbody tr", lg), again = $(".lg-again", lg), timer = null;
    var play = function () {
      clearTimeout(timer);
      lg.classList.add("play");
      rows2.forEach(function (r) { r.classList.remove("on", "split"); });
      if (again) again.hidden = true;
      var i = 0;
      var step = function () {
        if (i >= rows2.length) { if (again) again.hidden = false; return; }
        var r = rows2[i++], wait = 150;
        r.classList.add("on");
        if (r.classList.contains("bad")) { setTimeout(function () { r.classList.add("split"); }, 220); wait = 900; }
        else if (r.classList.contains("lg-rep")) wait = 1100;
        else if (r.classList.contains("lg-sync")) wait = 500;
        timer = setTimeout(step, wait);
      };
      timer = setTimeout(step, 400);
    };
    if (again) again.addEventListener("click", play);
    play();
  }
})();
