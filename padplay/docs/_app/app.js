// app.js — PadPlay docs. One script for every page under /padplay/docs/ (English) and /padplay/docs/ja/ (Japanese).
// The data (API, guides, troubleshooting, search index) comes from data.js (window.PADPLAY_DOCS), made by site/_tools/docs/build_app.py.
// Routes are real paths (/padplay/docs/ja/recipe/map/). Every route also exists as a static page, so a link opened directly works;
// inside the site, links switch the view with history.pushState instead of loading the page again.
"use strict";

// --- data ---
const D = window.PADPLAY_DOCS;
const J = id => D[id];
const BASE = D.base, PROTO = !!D.proto;
const API = J("data-api"), REC = J("data-recipes"), FIX = J("data-fix"), START = J("data-start"),
      FLOW = J("data-flow"), CON = J("data-concepts"), MENUS = J("data-menus"), MSG = J("data-messages"), IDX = J("data-search"), IMG = J("data-images"),
      VIDEOS = J("data-videos") || {};

const UI = {
  ja: { home: "ホーム", start: "はじめる", make: "作り方", fix: "困ったときは", api: "API リファレンス", flow: "全体の流れ", concepts: "仕組み",
        search: "検索", other: "English",
        title: "PadPlay ドキュメント",
        lead: "遊ぶ人のスマホを、画面とジャイロのついたコントローラーにする Unity 用の SDK です。",
        searchHint: "API 名や設定名のほか、スマホや PC に出た文言でも探せます",
        tryWords: "例:", startCta: "5 分ではじめる", apiCta: "API リファレンス",
        heroCap: "テレビには島の全体、スマホにはそれぞれが向けた先が映ります。サンプル「Floating Island」",
        fiveTitle: "5 分ではじめる", fiveLead: "空のプロジェクトから、スマホでキャラクターが動くまでの手順です。", fiveGo: "手順をすべて見る",
        makeTitle: "作り方", fixTitle: "困ったときは", needTitle: "必要なもの", lookTitle: "よく使う API", allApi: "すべての API",
        copy: "コピー", copied: "コピーしました", linkCopied: "リンクをコピーしました",
        place: "シーンに追加する", set: "Inspector で設定する", code: "スクリプトを書く", try: "動かしてみる",
        next: "次に読む", sample: "サンプル", modules: "モジュール", time: "所要時間",
        ifnot: "うまく動かないとき", apiHere: "このページの API", soon: "準備中", answer: "対処", related: "関連",
        def: "既定値", locked: "再生中は変更不可", filterPh: "名前や意味で絞り込む(例: 振動、slot)", settings: "設定項目(Inspector)",
        allTypes: "すべての API", flowLead: "スマホが参加してから離れるまでの流れです。段階を選ぶと、そこで届くイベントと API を表示します。",
        noHit: "見つかりませんでした。別の言葉で試してください。",
        kinds: { recipe: "作り方", fix: "困ったときは", api: "API", setting: "設定項目", menu: "メニュー", message: "画面に出る文言", page: "ページ" },
        say: { phone: "スマホの表示", pc: "PC の QR コードの下", game: "ゲームの画面", debug: "PadPlay Debug の表示", console: "Unity の Console", none: "" },
        mocks: "ほかの画面の案", proto: "試作です。API 名・既定値・メニューは実際のコードに合わせています。",
        wheelTurn: "スマホを回す", nav: "↑↓ で選択 · Enter で開く · Esc で閉じる",
        apiLead: "名前でも、意味でも探せます。型ごとのページと、似た名前の違いをまとめています。",
        setLead: "Host の Inspector と同じ順に並べています。上が Inspector の表示名、下がコードでの名前です。",
        startLead: "空のプロジェクトから、スマホで動かすまでの手順です。", flowShort: "参加から退出まで、どこで何のイベントが届くか",
        conceptsLead: "通信は安全か、何が外に出るか、どう動くかを 1 ページにまとめています。細かい所はリンク先にあります。" },
  en: { home: "Home", start: "Get started", make: "Guides", fix: "Troubleshooting", api: "API reference", flow: "Lifecycle", concepts: "How it works",
        search: "Search", other: "日本語",
        title: "PadPlay documentation",
        lead: "A Unity SDK that turns each player's phone into a controller with its own screen and gyro.",
        searchHint: "Search API and setting names, or paste text the phone or PC showed",
        tryWords: "Try:", startCta: "Get started in 5 minutes", apiCta: "API reference",
        heroCap: "The TV shows the whole island; each phone shows where its player points it. Sample: Floating Island",
        fiveTitle: "Get started in 5 minutes", fiveLead: "From an empty project to a character you move with a phone.", fiveGo: "See all steps",
        makeTitle: "Guides", fixTitle: "Troubleshooting", needTitle: "Requirements", lookTitle: "Most used API", allApi: "Full API reference",
        copy: "Copy", copied: "Copied", linkCopied: "Link copied",
        place: "Add to the scene", set: "Set in the Inspector", code: "Write the script", try: "Try it",
        next: "Read next", sample: "Sample", modules: "Modules", time: "Time",
        ifnot: "If it doesn't work", apiHere: "API on this page", soon: "Coming soon", answer: "Fix", related: "Related",
        def: "default", locked: "locked in Play mode", filterPh: "Filter by name or meaning (e.g. vibrate, slot)", settings: "Settings (Inspector)",
        allTypes: "Full API reference", flowLead: "What happens from a phone joining to leaving. Pick a stage to see its events and API.",
        noHit: "Nothing found. Try other words.",
        kinds: { recipe: "Guides", fix: "Troubleshooting", api: "API", setting: "Settings", menu: "Menus", message: "On-screen text", page: "Pages" },
        say: { phone: "On the phone", pc: "Under the QR code on the PC", game: "In the game", debug: "In PadPlay Debug", console: "Unity Console", none: "" },
        mocks: "Drafts for other screens", proto: "Prototype. API names, defaults and menus match the code.",
        wheelTurn: "Turn the phone", nav: "↑↓ select · Enter open · Esc close",
        apiLead: "Find things by name or by meaning. One page per type, with similar names compared.",
        setLead: "In the same order as the Host Inspector. Inspector label on top, code path below.",
        startLead: "From an empty project to a phone that moves things.", flowShort: "Which event arrives where, from joining to leaving",
        conceptsLead: "Is the connection safe, what leaves the network, and how it works, on one page. The details are behind the links." },
};

let lang = "ja";
const t = o => (o == null ? "" : typeof o === "string" ? o : (o[lang] ?? o.ja));
const u = k => UI[lang][k];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = s => String(s).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
// a member's route name; T.ren (made by build_app.py) renames names that differ only in case (pad.recenter / pad.Recenter)
const mslug = (T, n) => (T && T.ren && T.ren[n]) || slug(n);
const href = r => BASE + (lang === "ja" ? "ja/" : "") + (r ? String(r).replace(/\/?$/, "/") : "");
const $ = (s, el = document) => el.querySelector(s);
const num = (i, sm) => `<span class="n${sm ? " sm" : ""}">${i}</span>`;
const strip = s => String(s).replace(/[。.]$/, "");

// on-screen text, shown as a quote with where it appears
function say(where, text) {
  if (!where || where === "none") return `<span class="say">${esc(text)}</span>`;
  return `<span class="say"><span class="where">${esc(u("say")[where])}</span><q>${esc(strip(text))}</q></span>`;
}
const CS_KW = /^(using|public|private|static|void|var|new|return|if|else|foreach|in|out|readonly|class|get|set|float|int|bool|string|null|true|false|async|await|this)$/;
function hl(code) {
  const re = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|\$"(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?f?\b)|([A-Za-z_]\w*)/g;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const s = m[0];
    if (m[1]) out += `<span class="tk-c">${esc(s)}</span>`;
    else if (m[2]) out += `<span class="tk-s">${esc(s)}</span>`;
    else if (m[3]) out += `<span class="tk-n">${esc(s)}</span>`;
    else if (CS_KW.test(s)) out += `<span class="tk-k">${s}</span>`;
    else if (/^(PadPlay\w*|AttitudeCalibrationMode|Vector[23]|Quaternion|Camera|GameObject|MonoBehaviour|Debug|Mathf|Physics|RaycastHit|Dictionary|PointerEventData|IPointerClickHandler|EventSystem|Ray)$/.test(s)) out += `<span class="tk-t">${s}</span>`;
    else out += esc(s);
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}
const codeBlock = c => `<div class="code"><button class="cp" data-copy="${esc(c)}">${u("copy")}</button><pre>${hl(c)}</pre></div>`;

// references (PadPlayHost.Pulse, set:X, cmp:x, recipe:x, fix:x) → target and label
function ref(r) {
  if (r.startsWith("set:")) { const s = API.settings.find(x => x.id === r.slice(4)); return { h: "settings/" + r.slice(4), n: s ? s.label : r.slice(4), k: "setting" }; }
  if (r.startsWith("cmp:")) { const c = API.compare.find(x => x.id === r.slice(4)); const [ty] = c.at.split(":"); return { h: "api/" + ty + "/cmp-" + c.id, n: t(c.title), k: "cmp" }; }
  if (r.startsWith("recipe:")) { const x = REC.items.find(y => y.id === r.slice(7)); return { h: "recipe/" + r.slice(7), n: x ? t(x.title) : r, k: "recipe" }; }
  if (r.startsWith("fix:")) { const p = r.slice(4), f = FIX.symptoms.find(y => y.id === p), a = FIX.answers[p], nd = FIX.nodes[p];
    return { h: "fix/" + p, n: f ? t(f.title) : a ? t(a.title) : nd && nd.q ? t(nd.q) : p, k: "fix" }; }
  if (r.startsWith("menu:")) return { h: "fix/connect", n: "PadPlay Debug", k: "menu" };
  if (r === "flow") return { h: "flow", n: u("flow"), k: "page" };
  if (r === "settings") return { h: "settings", n: u("settings"), k: "page" };
  const i = r.indexOf(".");
  if (i < 0) return { h: "api/" + r, n: r, k: "api" };
  const ty = r.slice(0, i), mem = r.slice(i + 1);
  return { h: "api/" + ty + "/" + mslug(API.types.find(x => x.id === ty), mem), n: (ty === "PadPlayHost" ? "host." : ty === "PadPlayPad" ? "pad." : ty + ".") + mem, k: "api" };
}
const refLink = r => { const x = ref(r); return `<a href="${href(x.h)}">${x.k === "api" ? `<code>${esc(x.n).replace(/\./g, ".<wbr>")}</code>` : esc(x.n)}</a>`; };
const img = name => IMG[name] || "";
// a video: our own still and a play button. /assets/video.js swaps it for the YouTube player (youtube-nocookie.com) only when pressed;
// until then nothing is loaded from YouTube. withTitle: show the video title under it (when it differs from the page title).
// Ctrl / middle click opens the video on YouTube as a normal link.
function video(name, withTitle) {
  const v = VIDEOS[name];
  if (!v) return "";
  const x = v[lang], ja = lang === "ja";
  const label = ja ? `「${x.title}」を再生する(${v.len})` : `Play “${x.title}” (${v.len})`;
  return `<div class="vid" data-a="video">
    <div class="yt" data-yt="${esc(x.id)}" data-title="${esc(x.title)}"><a class="yt-poster" role="button" href="https://www.youtube.com/watch?v=${esc(x.id)}" aria-label="${esc(label)}"><img src="${esc(v.img)}" alt="" width="800" height="450" loading="lazy"><span class="yt-play" aria-hidden="true"></span></a></div>
    <p class="vid-cap"><b>${ja ? "動画で見る" : "Watch the video"}</b>${withTitle ? `<span>${esc(x.title)}</span>` : ""}<span class="meta">${esc(v.len)}</span></p>
  </div>`;
}
const SEARCH_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

// --- home: intro, two tabs (get started / API) that open under the buttons, then troubleshooting ---
function viewHome() {
  const tries = lang === "ja" ? ["ハンドル", "つながらない", "振動", "PlayerRemoved"] : ["steering", "can't connect", "vibrate", "PlayerRemoved"];
  const tb = (id, label, on) => `<button type="button" class="tab ${on ? "on" : ""}" role="tab" aria-selected="${on}" aria-controls="panel-${id}" data-tab="${id}">${label}</button>`;
  return `
  <section class="intro" data-a="hero">
    <div>
      <h1>${u("title")}</h1>
      <p class="lead">${u("lead")}</p>
      <button class="sfield" data-open-search>${SEARCH_ICON}<span>${u("search")}</span><kbd>Ctrl</kbd><kbd>K</kbd></button>
      <p class="hint">${u("searchHint")}</p>
      <p class="tries">${u("tryWords")} ${tries.map(w => `<button data-open-search="${esc(w)}">${esc(w)}</button>`).join(lang === "ja" ? "、" : ", ")}</p>
      <div class="tabs" role="tablist">${tb("start", u("startCta"), true)}${tb("api", u("apiCta"), false)}</div>
    </div>
    <figure class="shot"><img src="${img("floating-island")}" alt="Floating Island"><figcaption>${u("heroCap")}</figcaption></figure>
  </section>
  <section class="tabpanel" id="panel-start" role="tabpanel" data-a="start">${panelStart()}</section>
  <section class="tabpanel" id="panel-api" role="tabpanel" data-a="apis" hidden>${panelApiHome()}</section>
  <section class="sec" data-a="fixdoor">
    <div class="sec-h"><h2>${u("fixTitle")}</h2></div>
    <ul class="rows fixgrid">${FIX.symptoms.map(f => `<li><a class="flink" href="${href("fix/" + f.id)}"><b>${esc(t(f.title))}</b>${
      f.says && f.says.length ? f.says.slice(0, 2).map(s => `<span class="q">${lang === "ja" ? "「" + esc(strip(s[1])) + "」" : "“" + esc(strip(s[2])) + "”"}</span>`).join("")
      : f.hint ? `<span class="q">${esc(t(f.hint))}</span>` : ""}</a></li>`).join("")}</ul>
  </section>`;
}
// API tab on the home page: a search box; common API and main components while it is empty, results in their place while typing
function panelApiHome() {
  const comps = API.types.filter(x => x.group === "place");
  return `<div class="apihome">
    <div class="apiq">${SEARCH_ICON}<input id="apiq" type="search" autocomplete="off" spellcheck="false" placeholder="${lang === "ja" ? "API・設定項目を検索(例: Pulse、振動、Max Players)" : "Search API and settings (e.g. Pulse, vibrate, Max Players)"}"><a href="${href("api")}">${u("allApi")}</a></div>
    <div id="apiDefault" class="apidef">
      <section><h3>${u("lookTitle")}</h3>
        <table class="apitbl">${API.top.map(r => { const x = ref(r); const m = memberOf(r); return `<tr><td><a href="${href(x.h)}">${esc(x.n)}</a></td><td>${esc(m ? t(m.one) : "")}</td></tr>`; }).join("")}</table></section>
      <section><h3>${lang === "ja" ? "主なコンポーネント" : "Main components"}</h3>
        <table class="apitbl">${comps.map(T => `<tr><td><a href="${href("api/" + T.id)}">${T.id}</a></td><td>${esc(t(T.one))}</td></tr>`).join("")}
          <tr><td><a href="${href("settings")}">${u("settings")}</a></td><td>${lang === "ja" ? "Inspector の全項目と既定値" : "Every Inspector value and its default"}</td></tr></table></section>
    </div>
    <div id="apiResults" class="apires" hidden></div>
  </div>`;
}
function renderApiResults(q) {
  const def = $("#apiDefault"), box = $("#apiResults");
  if (!q.trim()) { def.hidden = false; box.hidden = true; box.innerHTML = ""; return; }
  const res = search(q).filter(([, e]) => e.k === "api" || e.k === "setting").slice(0, 30);
  def.hidden = true; box.hidden = false;
  box.innerHTML = res.length
    ? `<p class="small muted">${lang === "ja" ? `${res.length} 件` : `${res.length} found`}</p><table class="apitbl">${res.map(([, e]) => `<tr><td><a href="${href(e.h)}">${esc(t(e.t))}</a></td><td>${esc(t(e.s))}</td></tr>`).join("")}</table>`
    : `<p class="muted" style="padding:16px 0">${u("noHit")}</p>`;
}
function rlink(r) {
  const th = r.demo === "wheel" ? `<span class="th wheel">${wheelSvg(-18, true)}</span>` : r.demo === "pointer" ? `<span class="th wheel">${pointerSvg(true)}</span>` : `<span class="th" style="background-image:url(${img(r.demo.slice(4))})"></span>`;
  return `<a class="rlink" href="${href("recipe/" + r.id)}">${th}<span><b>${esc(t(r.title))}</b><span>${esc(t(r.lead))}</span></span><span class="meta">${esc(t(r.time))}</span></a>`;
}
function memberOf(r) {
  const i = r.indexOf("."); if (i < 0) return null;
  const ty = API.types.find(x => x.id === r.slice(0, i)); if (!ty) return null;
  return ty.members.find(m => m.n === r.slice(i + 1)) || null;
}
// home tabs: switch the panel under the buttons in place (no re-render, no jump)
function wireTabs() {
  document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => {
    const id = btn.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach(x => { const on = x.dataset.tab === id; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
    document.querySelectorAll(".tabpanel").forEach(p => { p.hidden = p.id !== "panel-" + id; });
    if (id === "api") $("#apiq").focus({ preventScroll: true });
  }));
  const q = $("#apiq");
  if (q) q.addEventListener("input", () => renderApiResults(q.value));
}

// --- panel: get started ---
function panelStart() {
  const need = START[0], rest = START.slice(1);
  return `<div class="page">
    <div>${video("quickstart", true)}
    <ol class="steps">${rest.map((s, i) => `<li data-a="s${i + 1}">${num(i + 1)}<div>
      <h3>${esc(t(s.t))}</h3><div class="body">
      ${s.menu ? `<div class="menuline"><span class="menu">${esc(s.menu)}</span><button class="cbtn" data-copy="${esc(s.menu)}">${u("copy")}</button></div>` : ""}
      ${s.do.map(d => `<p>${esc(t(d))}</p>`).join("")}
      ${s.code ? codeBlock(s.code) : ""}
      ${s.see ? `<p class="check">${esc(t(s.see))}</p>` : ""}
      ${s.alt ? `<p class="alt">${esc(t(s.alt))}</p>` : ""}
      ${s.fix ? `<p class="alt"><a href="${href("fix/" + s.fix)}">${u("ifnot")}</a></p>` : ""}
      </div></div></li>`).join("")}</ol></div>
    <aside class="aside">
      <div><h4>${u("needTitle")}</h4><ul>${need.do.map(d => `<li>${esc(t(d))}</li>`).join("")}</ul></div>
      <div><h4>${u("next")}</h4><ul>${REC.items.map(r => `<li><a href="${href("recipe/" + r.id)}">${esc(t(r.title))}</a></li>`).join("")}</ul></div>
    </aside>
  </div>`;
}

// --- guides index ---
function viewRecipes() {
  return `<p class="crumb"><a href="${href("")}">${u("home")}</a></p><h1>${u("makeTitle")}</h1>
  <p class="lead">${lang === "ja" ? "よく作るものを、置くもの・設定・スクリプトの順にまとめています。" : "Common things to build: what to add, what to set and the script."}</p>
  <ul class="rows" style="margin-top:32px">${REC.items.map(r => `<li>${rlink(r)}</li>`).join("")}
    ${REC.stubs.length ? `<li class="later">${u("soon")}: ${REC.stubs.map(s => esc(t(s.title))).join(lang === "ja" ? "、" : ", ")}</li>` : ""}</ul>`;
}

// --- guide (recipe) ---
function viewRecipe(id) {
  const r = REC.items.find(x => x.id === id);
  if (!r) return notFound();
  const demo = r.demo === "wheel" ? wheelDemo() : r.demo === "pointer" ? `<div class="demo wheel">${pointerSvg(false)}</div>` : `<figure class="demo"><img src="${img(r.demo.slice(4))}" alt=""></figure>`;
  const sample = r.sample ? `<span><b>${u("sample")}</b>${esc(r.sample[0])}(${esc(t(r.sample[2]))})</span>` : `<span><b>${u("sample")}</b>${esc(t(r.near))}</span>`;
  return `<div class="rhead" data-a="top">
    <div><p class="crumb"><a href="${href("")}">${u("home")}</a> / <a href="${href("recipes")}">${u("make")}</a></p>
      <h1>${esc(t(r.title))}</h1><p class="lead">${esc(t(r.lead))}</p>
      <div class="facts"><span><b>${u("time")}</b>${esc(t(r.time))}</span><span><b>${u("modules")}</b>${r.modules.join(", ")}</span>${sample}</div>
      ${video(r.id)}</div>
    ${demo}</div>
  <div class="page">
    <ol class="steps">
      <li data-a="place">${num(1)}<div><h3>${u("place")}</h3><div class="body"><ul>${r.place.map(p => `<li>${menuize(t(p))}</li>`).join("")}</ul></div></div></li>
      <li data-a="set">${num(2)}<div><h3>${u("set")}</h3><div class="body"><div class="insp"><div class="ttl">Inspector</div>${r.inspector.map(i => `<div class="r ${i[2] ? "ch" : ""}"><span class="lab">${esc(i[0])}</span><span class="v">${esc(i[1])}</span>${t(i[3]) ? `<span class="note">${esc(t(i[3]))}</span>` : ""}</div>`).join("")}</div>
        <p class="small muted" style="margin-top:8px">${lang === "ja" ? "左に青い線がある行が、変更する項目です。" : "Rows with a blue bar are the ones you change."}</p></div></div></li>
      <li data-a="code">${num(3)}<div><h3>${u("code")}</h3><div class="body">${codeBlock(r.code)}</div></div></li>
      <li data-a="try">${num(4)}<div><h3>${u("try")}</h3><div class="body"><p>${esc(t(r.try))}</p></div></div></li>
    </ol>
    <aside class="aside">
      <div><h4>${u("ifnot")}</h4><ul>${r.fixes.map(f => `<li><a href="${href(f[0])}">${esc(t(f[1]))}</a></li>`).join("")}</ul></div>
      <div><h4>${u("apiHere")}</h4><ul>${r.api.map(a => `<li>${refLink(a)}</li>`).join("")}</ul></div>
      <div><h4>${u("next")}</h4><ul>${r.next.map(n => { const x = REC.items.find(y => y.id === n); return `<li><a href="${href("recipe/" + n)}">${esc(t(x.title))}</a></li>`; }).join("")}</ul></div>
    </aside>
  </div>`;
}
const menuize = s => esc(s).replace(/((?:GameObject|Add Component|Window|Assets) → [^(、,]+?)(?=$|<|、|,| \(| [^\x00-\x7F→›])/g, '<span class="menu">$1</span>');

// the phone held like a wheel (drawn, not a photo)
function wheelSvg(deg, small) {
  const id = small ? "s" : "b";
  return `<svg viewBox="0 0 360 210" ${small ? 'width="76" height="44"' : ""} aria-hidden="true">
    ${small ? "" : `<path d="M84 110a96 96 0 0 1 192 0" fill="none" stroke="#5e554a" stroke-width="1.25" stroke-dasharray="3 6"/>
      <text x="180" y="22" text-anchor="middle" font-family="ui-monospace,monospace" font-size="11" fill="#8a847a">0°</text>
      <text x="62" y="118" text-anchor="middle" font-family="ui-monospace,monospace" font-size="11" fill="#8a847a">-90°</text>
      <text x="298" y="118" text-anchor="middle" font-family="ui-monospace,monospace" font-size="11" fill="#8a847a">+90°</text>`}
    <g class="ph" transform="rotate(${deg} 180 110)">
      <rect x="86" y="58" width="188" height="104" rx="20" fill="#2a251f" stroke="#efe9de" stroke-opacity=".9" stroke-width="${small ? 8 : 3}"/>
      <rect x="100" y="70" width="160" height="80" rx="8" fill="url(#gw${id})"/>
      ${small ? "" : `<circle cx="128" cy="122" r="12" fill="#1f1b16" fill-opacity=".35"/><circle cx="128" cy="122" r="7" fill="#efe9de"/>
      <circle cx="236" cy="104" r="9" fill="#efe9de"/><circle cx="216" cy="124" r="9" fill="#efe9de" fill-opacity=".7"/>
      <rect x="164" y="78" width="32" height="10" rx="3" fill="#1f1b16" fill-opacity=".5"/>
      <text x="180" y="86" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7" fill="#efe9de">Center</text>`}
    </g>
    <defs><linearGradient id="gw${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc93c"/><stop offset="1" stop-color="#ff8a4a"/></linearGradient></defs>
  </svg>`;
}
function wheelDemo() {
  return `<div class="demo wheel" id="wheel">${wheelSvg(0)}
    <div class="wrow"><span>${u("wheelTurn")}</span><input type="range" min="-120" max="120" value="0" id="wheelIn" aria-label="${u("wheelTurn")}"><span class="val" id="wheelVal">Steer  0.00</span></div>
    <div class="meter"><i id="wheelBar"></i></div></div>`;
}
// two phones pointing at an on-screen menu (drawn, not a photo). Cursor colors = PadPlayPlayerColors P1 / P2
function pointerSvg(small) {
  const btn = (y, label, hot) => `<rect x="118" y="${y}" width="124" height="26" rx="6" fill="${hot ? "#ffc93c" : "#3a332b"}" stroke="#efe9de" stroke-opacity=".35"/>${small ? "" : `<text x="180" y="${y + 17}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="${hot ? "#1f1b16" : "#efe9de"}">${label}</text>`}`;
  const cur = (x, y, c) => `<circle cx="${x}" cy="${y}" r="${small ? 9 : 7}" fill="${c}" stroke="#1f1b16" stroke-width="2"/>`;
  return `<svg viewBox="0 0 360 210" ${small ? 'width="76" height="44"' : ""} aria-hidden="true">
    <rect x="88" y="18" width="184" height="134" rx="10" fill="#2a251f" stroke="#efe9de" stroke-opacity=".9" stroke-width="${small ? 8 : 3}"/>
    ${btn(36, "Play", true)}${btn(70, "Options", false)}${btn(104, "Quit", false)}
    ${cur(206, 50, "#3A8DFF")}${cur(150, 116, "#FF5A4E")}
    ${small ? "" : `<g transform="rotate(-30 50 176)"><rect x="34" y="150" width="32" height="52" rx="6" fill="#2a251f" stroke="#3A8DFF" stroke-width="2"/></g>
    <g transform="rotate(30 310 176)"><rect x="294" y="150" width="32" height="52" rx="6" fill="#2a251f" stroke="#FF5A4E" stroke-width="2"/></g>
    <path d="M66 152 L198 58" stroke="#3A8DFF" stroke-width="1.25" stroke-dasharray="3 5"/><path d="M294 152 L157 118" stroke="#FF5A4E" stroke-width="1.25" stroke-dasharray="3 5"/>
    <text x="180" y="186" text-anchor="middle" font-family="ui-monospace,monospace" font-size="11" fill="#8a847a">A = click</text>`}
  </svg>`;
}
let wheelAnim = 0;
function wireWheel() {
  const box = $("#wheel"); if (!box) return;
  const inp = $("#wheelIn"), g = box.querySelector(".ph"), val = $("#wheelVal"), bar = $("#wheelBar");
  // same formula as the script: screen turned clockwise = right, -1..1 at ±90°
  const show = deg => {
    g.setAttribute("transform", `rotate(${deg} 180 110)`);
    const steer = Math.max(-1, Math.min(1, deg / 90));
    val.textContent = "Steer " + (steer >= 0 ? " " : "") + steer.toFixed(2);
    bar.style.left = (steer >= 0 ? 50 : 50 + steer * 50) + "%"; bar.style.width = Math.abs(steer) * 50 + "%";
  };
  let auto = true, t0 = performance.now();
  inp.addEventListener("input", () => { auto = false; show(+inp.value); });
  cancelAnimationFrame(wheelAnim);
  const tick = now => { if (!document.body.contains(box)) return; if (auto) { const d = Math.sin((now - t0) / 1100) * 60; inp.value = Math.round(d); show(d); } wheelAnim = requestAnimationFrame(tick); };
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) wheelAnim = requestAnimationFrame(tick); else show(0);
}

// --- troubleshooting ---
function viewFix(path) {
  const sym = path[0] || "connect";
  const S = FIX.symptoms.find(x => x.id === sym);
  if (!S) return notFound();
  const list = `<nav class="symlist">${FIX.symptoms.map(f => `<a class="${f.id === sym ? "on" : ""}" href="${href("fix/" + f.id)}">${esc(t(f.title))}</a>`).join("")}</nav>`;
  let trail = "", cur = sym, body = "";
  const steps = path.slice(1);
  for (let i = 0; i <= steps.length; i++) {
    const node = FIX.nodes[cur], ans = FIX.answers[cur];
    if (ans && !node) { body = answerBox(ans); break; }
    if (!node) { body = notFound(); break; }
    if (i === steps.length) { body = qBox(node, cur); break; }
    const opt = node.opts.find(o => o.to === steps[i] || o.to === "/" + steps.slice(i).join("/"));
    if (!opt) { body = qBox(node, cur); break; }
    const target = opt.abs ? opt.to.slice(1) : cur + "/" + opt.to;
    trail += `<a href="${href("fix/" + cur)}">${esc(t(node.q))} <span class="pick">→ ${esc(strip(t(opt.label)))}</span></a>`;
    if (opt.abs) { cur = target; const a = FIX.answers[cur]; body = a ? answerBox(a) : qBox(FIX.nodes[cur], cur); break; }
    cur = target;
  }
  return `<p class="crumb"><a href="${href("")}">${u("home")}</a> / ${u("fix")}</p>
    <h1>${esc(t(S.title))}</h1>
    <div class="fixwrap"><div>${list}</div><div data-a="fix-${esc(path.join("-"))}">${trail ? `<div class="trail">${trail}</div>` : ""}${body}</div></div>`;
}
function qBox(node, at) {
  if (node.answer) return answerBox(node.answer);
  return `<div class="qbox"><h2>${esc(t(node.q))}</h2><div class="opts">${node.opts.map(o => {
    const to = o.abs ? o.to.slice(1) : at + "/" + o.to;
    return `<a class="opt" href="${href("fix/" + to)}"><span class="what">${say(o.where, t(o.label))}</span><span class="go">→</span></a>`; }).join("")}</div></div>`;
}
function answerBox(a) {
  return `<div class="ans"><p class="label">${u("answer")}</p><h2>${esc(t(a.title))}</h2>
    <ol>${a.steps.map((s, i) => `<li>${num(i + 1, true)}<span>${esc(t(s))}</span></li>`).join("")}</ol>
    ${a.api.length ? `<div class="rel"><span>${u("related")}</span>${a.api.map(refLink).join("")}</div>` : ""}</div>`;
}

// --- API reference: every type, member, comparison and setting on one page ---
function viewApiAll(focus) {
  const groups = Object.keys(API.groups);
  const typesIn = g => API.types.filter(x => x.group === g);
  const gname = g => g === "common" ? (lang === "ja" ? "入力を読む型" : "Reading input") : t(API.groups[g]);
  const side = `<aside class="side apiside">${groups.filter(g => typesIn(g).length).map(g => `<h4>${esc(gname(g))}</h4>${typesIn(g).map(T => `<a href="${href("api/" + T.id)}" data-jump="t-${T.id}" class="${focus === T.id ? "on" : ""}">${T.id}</a>`).join("")}`).join("")}
    <h4>${u("settings")}</h4><a href="${href("settings")}" data-jump="settings">Settings</a>
    ${API.stubs.length ? `<h4>${u("soon")}</h4>${API.stubs.map(x => `<span class="stub">${x.id}</span>`).join("")}` : ""}</aside>`;
  // on this page "most used" is not a group: its members go to methods/properties or events by kind
  const dg = m => m.g === "common" ? (m.kind === "event" ? "events" : "methods") : m.g;
  const ORDER = ["methods", "events", "settings", "phone", "check", "more", "place"];
  const glabel = g => g === "methods" ? (lang === "ja" ? "メソッドとプロパティ" : "Methods and properties") : t(API.groups[g]);
  const cmpHtml = c => `<div class="cmp" id="cmp-${c.id}" data-a="cmp-${c.id}"><b>${esc(t(c.title))}</b><table>${c.rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(t(r[1]))}</td></tr>`).join("")}</table>${c.foot ? `<p class="small muted" style="margin-top:8px">${esc(t(c.foot))}</p>` : ""}</div>`;
  const typeBlock = T => {
    const gs = ORDER.filter(g => T.members.some(m => dg(m) === g));
    const cmpsOf = g => API.compare.filter(c => { const cg = c.at.split(":")[1]; return c.at.startsWith(T.id + ":") && (cg === g || (cg === "common" && g === "methods")); }).map(cmpHtml).join("");
    return `<section class="tblock" id="t-${T.id}" data-a="t-${T.id}">
      <h2 class="tname">${T.id}</h2><p class="lead">${esc(t(T.one))}</p><p class="small muted" style="margin-top:6px">${esc(T.place)}</p>
      ${gs.map(g => {
        const ms = T.members.filter(m => dg(m) === g);
        const body = g === "events" ? evTable(T, ms) : ms.map(m => mrow(T, m)).join("");
        return `<h3 class="gtitle">${esc(glabel(g))}</h3>${cmpsOf(g)}${body}`;
      }).join("")}</section>`;
  };
  const sets = [...new Set(API.settings.map(x => x.g))];
  const settings = `<section class="tblock" id="settings" data-a="settings"><h2>${u("settings")}</h2><p class="lead">${u("setLead")}</p>
    ${sets.map(g => `<h3 class="gtitle setgroup">${g}</h3><div>${API.settings.filter(x => x.g === g).map(x => `<div class="setrow mem" id="s-${x.id}" data-a="s-${x.id}" data-f="${esc([x.label, x.path, x.def, x.one.ja, x.one.en, x.syn].join(" "))}">
      <div><span class="lab">${esc(x.label)}</span><span class="path">${esc(x.path)}</span></div>
      <div><span class="dv">${esc(x.def)}</span>${x.lock ? `<span class="lock">${u("locked")}</span>` : ""}</div>
      <div>${esc(t(x.one))}</div></div>`).join("")}</div>`).join("")}</section>`;
  return `<p class="crumb"><a href="${href("")}">${u("home")}</a></p><h1>${u("api")}</h1>
    <p class="lead">${lang === "ja" ? "PadPlay のすべての型・メンバー・設定項目をこのページにまとめています。名前や意味で絞り込めます。" : "Every PadPlay type, member and setting on one page. Filter by name or meaning."}</p>
    <div class="filterbar"><input class="filter" id="memFilter" placeholder="${u("filterPh")}" autocomplete="off"><span class="small muted" id="hitCount"></span></div>
    <div class="tpage">${side}<div id="mems">${groups.map(g => typesIn(g).map(typeBlock).join("")).join("")}${settings}</div></div>`;
}

const KIND = { ja: { event: "イベント", method: "メソッド", property: "プロパティ", prop: "プロパティ", field: "フィールド", component: "コンポーネント", type: "型", note: "補足" }, en: { prop: "property" } };
function mrow(T, m) {
  const id = mslug(T, m.n), dom = T.id + "-" + id;
  const f = [m.n, m.sig, m.one.ja, m.one.en, m.def, m.type, m.syn, ...(m.args || []).map(a => a[0])].join(" ");
  return `<article class="mem" id="m-${dom}" data-a="m-${dom}" data-f="${esc(f)}">
    <div class="nm"><code>${esc(m.n)}</code><span class="kind">${esc(KIND[lang][m.kind] || m.kind)}</span>${m.def ? `<span class="def">${u("def")} ${esc(m.def)}</span>` : ""}<button class="lnk" data-link="${href("api/" + T.id + "/" + id)}" title="${u("linkCopied")}">#</button></div>
    <p>${esc(t(m.one))}</p><div class="sig">${esc(m.sig)}</div>
    ${argList(m)}
    ${m.ex ? codeBlock(m.ex) : ""}
    ${m.rel.length ? `<div class="links">${m.rel.map(refLink).join("")}</div>` : ""}</article>`;
}
// small "arguments / returns" list under a signature
function argList(m) {
  const rows = (m.args || []).map(a => `<dt><code>${esc(a[0])}</code></dt><dd>${esc(t(a[1]))}</dd>`);
  if (m.ret) rows.push(`<dt class="rt">${lang === "ja" ? (m.kind === "method" ? "戻り値" : "値") : (m.kind === "method" ? "Returns" : "Value")}</dt><dd>${esc(t(m.ret))}</dd>`);
  return rows.length ? `<dl class="args">${rows.join("")}</dl>` : "";
}
// events as a table: name / when it is raised / what it passes
function evTable(T, ms) {
  const head = lang === "ja" ? ["イベント", "呼ばれるとき", "受け取る値"] : ["Event", "When it is raised", "Argument"];
  const arg = sig => { const m = /Action<([^>]+(?:<[^>]+>)?)>/.exec(sig || ""); return m ? m[1] : "—"; };
  return `<table class="evtbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${ms.map(m => {
    const id = mslug(T, m.n), dom = T.id + "-" + id, f = [m.n, m.sig, m.one.ja, m.one.en, m.syn].join(" ");
    return `<tr class="mem evrow" id="m-${dom}" data-a="m-${dom}" data-f="${esc(f)}">
      <td><code class="evn">${esc(m.n)}</code><button class="lnk" data-link="${href("api/" + T.id + "/" + id)}" title="${u("linkCopied")}">#</button></td>
      <td>${esc(t(m.one))}${m.ex ? `<details class="ex"><summary>${lang === "ja" ? "例" : "Example"}</summary>${codeBlock(m.ex)}</details>` : ""}${m.rel.length ? `<div class="links">${m.rel.map(refLink).join("")}</div>` : ""}</td>
      <td><code class="evarg">${esc(arg(m.sig))}</code>${(m.args || []).length ? `<dl class="args ev">${m.args.map(a => `<dt><code>${esc(a[0])}</code></dt><dd>${esc(t(a[1]))}</dd>`).join("")}</dl>` : ""}</td></tr>`; }).join("")}</tbody></table>`;
}
function wireMemFilter() {
  const f = $("#memFilter"); if (!f) return;
  f.addEventListener("input", () => {
    const q = norm(f.value); let n = 0;
    document.querySelectorAll("#mems .mem").forEach(el => { const ok = !q || norm(el.dataset.f).includes(q); el.style.display = ok ? "" : "none"; if (ok && q) n++; });
    document.querySelectorAll("#mems .cmp").forEach(el => { el.style.display = q ? "none" : ""; });
    document.querySelectorAll("#mems .tblock").forEach(el => { el.style.display = !q || el.querySelector('.mem:not([style*="none"])') ? "" : "none"; });
    $("#hitCount").textContent = q ? (lang === "ja" ? `${n} 件` : `${n} found`) : "";
  });
}

function wireApiSide() {
  const links = document.querySelectorAll(".apiside [data-jump]"); if (!links.length) return;
  const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle("on", l.dataset.jump === e.target.id)); }); }, { rootMargin: "-90px 0px -70% 0px" });
  document.querySelectorAll("#mems .tblock").forEach(b => io.observe(b));
}

// --- lifecycle ---
function flowSvg(sel, thumb) {
  const main = FLOW.slice(0, 7), W = 150, gap = 18, y = 30;
  const x = i => 10 + i * (W + gap);
  let s = `<svg viewBox="0 0 1190 300" role="img" aria-label="${esc(u("flow"))}"><defs><marker id="ar${thumb ? "t" : ""}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="rgba(31,27,22,.45)"/></marker></defs>`;
  const mk = `marker-end="url(#ar${thumb ? "t" : ""})"`;
  main.forEach((n, i) => { if (i) s += `<path class="ln" d="M${x(i) - gap + 1} ${y + 32}h${gap - 4}" ${mk}/>`; });
  const back = FLOW[7], gone = FLOW[8], lx = x(6);
  s += `<path class="ln" d="M${lx + W / 2 - 30} ${y + 64}v70h-40" ${mk}/><path class="ln" d="M${lx + W / 2 + 10} ${y + 64}v126" ${mk}/>`;
  s += `<path class="ln" d="M${x(5) + 12} ${y + 136}H${x(2) + W / 2}V${y + 68}" ${mk} stroke-dasharray="4 5"/>`;
  s += `<text class="lbl" x="${x(3)}" y="${y + 128}">${lang === "ja" ? "Resume Hold Seconds(既定 300 秒)以内なら同じ枠に戻る" : "back to the same slot within Resume Hold Seconds (300 s)"}</text>`;
  const node = (n, nx, ny) => `<g class="node ${n.id === sel ? "on" : ""}" ${thumb ? "" : `data-node="${n.id}" tabindex="0"`}><rect x="${nx}" y="${ny}" width="${W}" height="64" rx="10"/><text x="${nx + 14}" y="${ny + 25}">${esc(t(n.t))}</text><text class="ev" x="${nx + 14}" y="${ny + 43}">${esc(n.ev || "")}</text><text class="st" x="${nx + 14}" y="${ny + 57}">${esc(n.state)}</text></g>`;
  main.forEach((n, i) => { s += node(n, x(i), y); });
  s += node(back, x(5) + 12, y + 104) + node(gone, lx, y + 190);
  return s + "</svg>";
}
function viewFlow(sel) {
  sel = sel || "ready";
  const n = FLOW.find(x => x.id === sel) || FLOW[2];
  return `<p class="crumb"><a href="${href("")}">${u("home")}</a></p><h1>${u("flow")}</h1><p class="lead">${u("flowLead")}</p>
  <div class="flowbox">${flowSvg(n.id)}</div>
  <div class="flowtabs">${FLOW.map(f => `<a class="${f.id === n.id ? "on" : ""}" href="${href("flow/" + f.id)}">${esc(t(f.t))}</a>`).join("")}</div>
  <div class="fdetail" data-a="flow-${n.id}"><h2>${esc(t(n.t))}${n.state ? `<span class="st">${esc(n.state)}</span>` : ""}</h2>
    <p>${esc(t(n.say))}</p><div class="links" style="margin-top:12px">${n.items.map(refLink).join("")}</div></div>`;
}

// --- how it works: one page; the figure, a row of section links, then every section (concepts/<id> scrolls to one) ---
function conceptSvg() {
  const F = CON.fig, W = 200, x1 = 10, x2 = 790, top = 16, H = 272, y = i => 64 + i * 42;
  let s = `<svg viewBox="0 0 1000 350" role="img" aria-label="${esc(u("concepts"))}"><defs><marker id="arc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="rgba(31,27,22,.45)"/></marker></defs>`;
  const box = (x, title, sub, lines) => `<g class="node"><rect x="${x}" y="${top}" width="${W}" height="${H}" rx="10"/><text x="${x + 14}" y="${top + 28}">${esc(t(title))}</text>` +
    `<text class="ev" x="${x + 14}" y="${top + 48}">${esc(t(sub))}</text>${lines.map((l, i) => `<text class="st" x="${x + 14}" y="${top + 84 + i * 20}">${esc(t(l))}</text>`).join("")}</g>`;
  s += box(x1, F.phone, F.phoneSub, F.phoneLines) + box(x2, F.pc, F.pcSub, F.pcLines);
  F.rows.forEach(([from, dashed, label], i) => {
    const d = from === "phone" ? `M${x1 + W + 4} ${y(i)}H${x2 - 6}` : `M${x2 - 4} ${y(i)}H${x1 + W + 6}`;
    s += `<path class="ln" d="${d}" marker-end="url(#arc)"${dashed ? ' stroke-dasharray="4 5"' : ""}/><text class="lbl" x="500" y="${y(i) - 8}" text-anchor="middle">${esc(t(label))}</text>`;
  });
  s += `<text class="lbl" x="${x1}" y="318">${esc(t(F.qrNote))}</text><text class="lbl" x="${x1}" y="338">${esc(t(F.note))}</text>`;
  return s + "</svg>";
}
function viewConcepts(sel) {
  const on = CON.items.some(x => x.id === sel) ? sel : "";
  return `<p class="crumb"><a href="${href("")}">${u("home")}</a></p><h1>${u("concepts")}</h1><p class="lead">${u("conceptsLead")}</p>
  <div class="flowbox">${conceptSvg()}</div>
  <div class="flowtabs">${CON.items.map(c => `<a class="${c.id === on ? "on" : ""}" href="${href("concepts/" + c.id)}">${esc(t(c.t))}</a>`).join("")}</div>
  ${CON.items.map(c => `<section class="fdetail" id="c-${c.id}" data-a="c-${c.id}"><h2>${esc(t(c.t))}</h2>
    ${c.ul ? `<ul>${c.ul.map(x => `<li>${esc(t(x))}</li>`).join("")}</ul>` : ""}${(c.p || []).map(x => `<p>${esc(t(x))}</p>`).join("")}
    <div class="links" style="margin-top:12px">${c.items.map(refLink).join("")}${(c.out || []).map(([lab, h]) => `<a href="${esc(t(h))}">${esc(t(lab))}</a>`).join("")}</div></section>`).join("")}`;
}

// --- drafts of other screens ---
function viewMock(which) { return which === "store" ? mockStore() : mockWelcome(); }
function mockWelcome() {
  const ja = lang === "ja";
  const notes = ja ? ["説明文より先に、今どこまで準備できているかを出します。足りないものには、直すボタンを付けます。",
                      "次にやることを 1 つだけ大きく出します。状態に合わせて変わります(Host が無い → 追加、再生していない → 再生、スマホが無い → QR か仮想スマホ)。",
                      "サイトと同じ検索です。結果は Web の同じ場所を開きます。",
                      "作り方は、サンプルのシーンと Web の手順の両方へ進めます。",
                      "困ったときは症状から選びます。よくある 3 つだけをここに出し、残りは Web へ案内します。"]
                   : ["Show what is ready before any text, with a button to fix what is missing.",
                      "One next step, large. It changes with the state (no Host → add it, not playing → press Play, no phone → QR or a virtual phone).",
                      "The same search as the site; results open the same place on the web.",
                      "Each guide opens both the sample scene and the web guide.",
                      "Troubleshooting starts from the symptom: the three most common here, the rest on the web."];
  return `<p class="crumb">${u("mocks")}</p><h1>${ja ? "Welcome ウィンドウの案" : "Welcome window (draft)"}</h1>
  <p class="lead">${ja ? "エディタの中でも、探す・わかる・使えるの順に並べます。" : "Find, understand and use, inside the Editor."}</p>
  <div class="mockwrap"><div class="uwin"><div class="tab"><span>PadPlay</span></div><div class="in">
    <div class="u-h"><img src="${img("mark")}" width="20" height="20" alt="">PadPlay<span class="sp">${ja ? "日本語 ▾" : "English ▾"}</span></div>
    <div class="u-state">${num(1, true)}<div><span class="ok">✓</span> Input System</div><div><span class="ng">✕</span> ${ja ? "シーンに Host" : "Host in scene"}</div><div><span class="wait">–</span> ${ja ? "スマホ" : "Phone"}</div></div>
    <div class="u-next">${num(2, true)}<b>${ja ? "次に: シーンに PadPlay を追加" : "Next: add PadPlay to the scene"}</b><span class="p">GameObject → PadPlay → PadPlay Setup</span><span class="u-btn">${ja ? "追加" : "Add"}</span></div>
    <div class="u-search">${ja ? "作り方・困ったこと・API を検索" : "Search guides, problems, API"}</div>
    <div class="u-cols">
      <div class="u-col"><h5>${ja ? "作り方" : "Guides"}</h5>${REC.items.map(r => `<div class="u-item">${esc(t(r.title))}<small>${r.sample ? (ja ? "サンプル" : "Sample") : "Web"}</small></div>`).join("")}</div>
      <div class="u-col"><h5>${ja ? "困ったときは" : "Troubleshooting"}</h5><div class="u-item">${ja ? "つながらない" : "Can't connect"}<small>${ja ? "接続タブ" : "Connection"}</small></div><div class="u-item">${ja ? "映像が乱れる" : "Broken video"}<small>Web</small></div><div class="u-item">${ja ? "入力が届かない" : "No input"}<small>Web</small></div></div>
      <div class="u-col"><h5>${ja ? "サンプル" : "Samples"}</h5><div class="u-item">${ja ? "すべて入れて Sample Hub を開く" : "Import all, open the Sample Hub"}</div><div class="u-item">${ja ? "仮想スマホで試す" : "Try with Virtual Phones"}</div></div>
    </div></div></div>
    <div class="notes">${notes.map((n, i) => `<div>${num(i + 1, true)}<span>${esc(n)}</span></div>`).join("")}</div></div>`;
}
function mockStore() {
  const ja = lang === "ja";
  const notes = ja ? ["1 行目で何の商品かがわかるようにします。",
                      "できることを、文章より先にサンプルの画像 3 枚で見せます。",
                      "買う前に知っておくべき条件(アプリが要る、同じ Wi-Fi)を最初の画面に出します。",
                      "はじめ方は 3 行だけにして、続きは文書の該当ページへ直接リンクします。",
                      "Lite との違いは 1 行で書きます。"]
                   : ["The first line says what it is.",
                      "Three sample pictures show what it does before any paragraph.",
                      "What buyers must know (the app, the same Wi-Fi) is on the first screen.",
                      "Getting started in three lines, with deep links to the guides.",
                      "Lite in one line."];
  return `<p class="crumb">${u("mocks")}</p><h1>${ja ? "Asset Store の説明文の案" : "Asset Store description (draft)"}</h1>
  <p class="lead">${ja ? "ストアの本文は英語です。" : "The store text is in English."}</p>
  <div class="mockwrap"><div class="store"><div class="bar">Asset Store / Tools / Input Management / PadPlay SDK</div><div class="in">
    <h3>${num(1, true)} Your phone is a second screen</h3>
    <p>PadPlay turns phones into game controllers with their own screen: touch, gyro, buttons, vibration and a picture just for that player.</p>
    <div class="tiles"><figure><img src="${img("floating-island")}" alt=""><figcaption>${num(2, true)} A zoom lens in your hand</figcaption></figure><figure><img src="${img("treasure-map")}" alt=""><figcaption>A private map per player</figcaption></figure><figure><img src="${img("gyro-window")}" alt=""><figcaption>Two players look into one room</figcaption></figure></div>
    <div class="req"><div>${num(3, true)} <b>Free PadPlay app</b> on every phone (Android 7.0+ / iOS 15+)</div><div><b>Same Wi-Fi</b> for PC and phones; no play over the internet</div><div><b>Windows 10 / 11</b>, Unity 2022.3.62f3+</div></div>
    <div><b>${num(4, true)} Running in 5 minutes</b><ol style="margin:4px 0 0;padding-left:1.3em"><li>GameObject → PadPlay → PadPlay Setup</li><li>Press Play and scan the QR code with the app</li><li>Read the phone like any gamepad: <code>host.GetPad(0).buttonSouth</code></li></ol></div>
    <p style="font-size:13px;color:#555">${num(5, true)} Free <b>PadPlay Lite</b>: same API and player count, no second-screen video.</p>
  </div></div><div class="notes">${notes.map((n, i) => `<div>${num(i + 1, true)}<span>${esc(n)}</span></div>`).join("")}</div></div>`;
}
const notFound = () => `<h1>404</h1><p style="margin-top:12px"><a href="${href("")}">${u("home")}</a></p>`;

// --- search ---
const KANA = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const norm = s => KANA(String(s || "").normalize("NFKC").toLowerCase()).replace(/[\s・()()「」『』、。,.\-_/›→:;'"!?!?…]+/g, "");
function search(q) {
  const qn = norm(q); if (!qn) return [];
  const toks = q.normalize("NFKC").toLowerCase().split(/\s+/).map(norm).filter(Boolean);
  const out = [];
  for (const e of IDX) {
    const tn = e.tn[lang] ?? e.tn.ja;
    let s = 0;
    if (tn === qn) s = 100; else if (e.nn && e.nn === qn) s = 95; else if (tn.startsWith(qn)) s = 80; else if (tn.includes(qn)) s = 64;
    else if (e.w.includes(qn)) s = 44;
    else if (toks.length > 1 && toks.every(k => tn.includes(k) || e.w.includes(k))) s = 30;
    if (s) out.push([s + (e.boost || 0), e]);
  }
  out.sort((a, b) => b[0] - a[0]);
  return out;
}
const KORD = ["recipe", "fix", "api", "setting", "menu", "message", "page"];
let sel = 0, flat = [];
function renderResults(q) {
  const box = $("#sres");
  if (!q.trim()) {
    const ex = lang === "ja" ? ["ハンドル", "つながらない", "Pulse", "既定値 300", "今はこのゲームに入れません"] : ["steering", "can't connect", "Pulse", "default 300", "You can't join this game"];
    box.innerHTML = `<div class="shint">${u("searchHint")}<br>${u("tryWords")} ${ex.map(w => `<button data-fill="${esc(w)}">${esc(w)}</button>`).join("")}</div>`; flat = []; return;
  }
  const res = search(q);
  if (!res.length) { box.innerHTML = `<div class="shint">${u("noHit")}</div>`; flat = []; return; }
  const by = {}; res.forEach(([s, e]) => { (by[e.k] = by[e.k] || []).push([s, e]); });
  const order = Object.keys(by).sort((a, b) => (by[b][0][0] - by[a][0][0]) || (KORD.indexOf(a) - KORD.indexOf(b)));
  flat = []; let html = "";
  for (const k of order) {
    html += `<div class="sgrp">${u("kinds")[k]}</div>`;
    for (const [, e] of by[k].slice(0, 6)) {
      const i = flat.length; flat.push(e);
      const title = t(e.t), sub = e.where ? `<span class="where">${esc(u("say")[e.where])}</span> ${esc(t(e.s))}` : esc(t(e.s));
      html += `<a class="sitem" data-i="${i}" href="${href(e.h)}"><span class="tt ${e.k === "api" || e.k === "menu" ? "mono" : ""}">${esc(title)}</span>${sub.trim() ? `<span class="ss">${sub}</span>` : ""}</a>`;
    }
  }
  box.innerHTML = html; sel = 0; mark();
}
function mark() { document.querySelectorAll(".sitem").forEach(el => el.classList.toggle("sel", +el.dataset.i === sel)); const el = $(`.sitem[data-i="${sel}"]`); if (el) el.scrollIntoView({ block: "nearest" }); }
function openSearch(text) {
  const ov = $("#sov"), inp = $("#sin");
  ov.classList.add("open"); inp.placeholder = u("search"); inp.value = text || ""; renderResults(inp.value);
  $("#sfoot").textContent = u("nav");
  setTimeout(() => inp.focus(), 0);
}
const closeSearch = () => $("#sov").classList.remove("open");

// --- frame ---
function frame(route) {
  const top = route[0] || "";
  const navs = [["recipes", "make"], ["fix/connect", "fix"], ["api", "api"], ["flow", "flow"], ["concepts", "concepts"]];
  const on = n => n.split("/")[0] === top || (n === "recipes" && top === "recipe") || (n === "api" && top === "settings");
  $("#brand").href = href("");
  $("#nav").innerHTML = navs.map(([r, k]) => `<a href="${href(r)}" data-nav class="${on(r) ? "on" : ""}">${u(k)}</a>`).join("");
  $("#sbtnTxt").textContent = u("search");
  $("#langbtn").textContent = u("other");
  $("#brandSub").textContent = lang === "ja" ? "ドキュメント" : "Docs";
  const site = lang === "ja" ? "/ja/" : "/";
  $("#foot").innerHTML = PROTO
    ? `<span>${u("proto")}</span><a href="${href("mock/welcome")}">${lang === "ja" ? "Welcome ウィンドウの案" : "Welcome window draft"}</a><a href="${href("mock/store")}">${lang === "ja" ? "Asset Store の説明文の案" : "Asset Store text draft"}</a>`
    : `<span>© ${D.year} Petaf</span><a href="${site}">petaf.dev</a><a href="${site}contact/">${lang === "ja" ? "お問い合わせ" : "Contact"}</a><a href="${site}privacy/">${lang === "ja" ? "プライバシー" : "Privacy"}</a>`;
  document.documentElement.lang = lang;
}
function parse() {
  let p = location.pathname;
  try { p = decodeURIComponent(p); } catch {}
  p = p.startsWith(BASE) ? p.slice(BASE.length) : "";
  const parts = p.split("/").filter(x => x && x !== "index.html");
  lang = parts[0] === "ja" ? (parts.shift(), "ja") : "en";
  return parts;
}
// move to another route of this site without loading the page again (the page for every route also exists as a file)
function go(url, replace) {
  if (replace) history.replaceState(null, "", url); else history.pushState(null, "", url);
  render();
}
let pendingAnchor = null, arrivedByNav = false;
function render() {
  const r = parse(); frame(r);
  const [a, b, c] = r;
  let html;
  if (!a || a === "start") html = viewHome();
  else if (a === "recipes") html = viewRecipes();
  else if (a === "recipe") html = viewRecipe(b);
  else if (a === "fix") html = viewFix(r.slice(1));
  else if (a === "api" || a === "settings") html = viewApiAll(a === "api" ? b : null);
  else if (a === "flow") html = viewFlow(b);
  else if (a === "concepts") html = viewConcepts(b);
  else if (a === "mock" && PROTO) html = viewMock(b);
  else html = notFound();
  $("#main").innerHTML = html;
  document.title = (document.querySelector("#main h1")?.textContent || "PadPlay") + " | PadPlay";
  wireWheel(); wireMemFilter(); wireTabs(); wireApiSide();
  document.querySelectorAll("[data-node]").forEach(g => { const go2 = () => go(href("flow/" + g.dataset.node)); g.addEventListener("click", go2); g.addEventListener("keydown", e => { if (e.key === "Enter") go2(); }); });
  let target = null;
  if (pendingAnchor) target = document.querySelector(`[data-a="${CSS.escape(pendingAnchor.a)}"]`);
  else if (a === "api" && b) target = c ? (document.getElementById(c.startsWith("cmp-") ? c : "m-" + b + "-" + c) || document.getElementById("t-" + b)) : document.getElementById("t-" + b);
  else if (a === "settings") target = document.getElementById(b ? "s-" + b : "settings");
  else if (a === "concepts" && b) target = document.getElementById("c-" + b);
  else if (a === "start") target = document.querySelector(".tabs");
  if (target) {
    const off = pendingAnchor ? pendingAnchor.off : (a === "api" || a === "settings" ? 140 : 88);
    window.scrollTo(0, target.getBoundingClientRect().top + scrollY - off);
    if (!pendingAnchor && target.classList.contains("mem") && (c || a === "settings")) { target.classList.add("hit"); setTimeout(() => target.classList.remove("hit"), 1600); }
  } else if (!pendingAnchor) window.scrollTo(0, 0);
  pendingAnchor = null; arrivedByNav = false;
}
function switchLang() {
  let best = null;
  for (const el of document.querySelectorAll("#main [data-a]")) { const top = el.getBoundingClientRect().top; if (top <= 120) best = { a: el.dataset.a, off: top }; else { if (!best) best = { a: el.dataset.a, off: top }; break; } }
  pendingAnchor = best;
  const rest = parse().join("/");
  lang = lang === "ja" ? "en" : "ja";
  go(href(rest));
}
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 1300); }
async function copy(text) { try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} ta.remove(); } }

document.addEventListener("click", async e => {
  if (e.target.closest("[data-nav]")) arrivedByNav = true;
  const cp = e.target.closest("[data-copy]");
  if (cp) { await copy(cp.dataset.copy); cp.classList.add("ok"); const o = cp.textContent; cp.textContent = u("copied"); setTimeout(() => { cp.textContent = o; cp.classList.remove("ok"); }, 1100); return; }
  const lk = e.target.closest("[data-link]");
  if (lk) { await copy(location.origin + lk.dataset.link); toast(u("linkCopied")); return; }
  const fill = e.target.closest("[data-fill]");
  if (fill) { const inp = $("#sin"); inp.value = fill.dataset.fill; renderResults(inp.value); inp.focus(); return; }
  const os = e.target.closest("[data-open-search]");
  if (os) { openSearch(os.dataset.openSearch || ""); return; }
  if (e.target.id === "sov") closeSearch();
  if (e.target.closest(".sitem")) closeSearch();
});
document.addEventListener("keydown", e => {
  const open = $("#sov").classList.contains("open");
  if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !open && !/INPUT|TEXTAREA/.test(document.activeElement.tagName))) { e.preventDefault(); openSearch(""); return; }
  if (!open) return;
  if (e.key === "Escape") closeSearch();
  else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(flat.length - 1, sel + 1); mark(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
  else if (e.key === "Enter" && flat[sel]) { e.preventDefault(); closeSearch(); go(href(flat[sel].h)); }
});
$("#sin").addEventListener("input", e => renderResults(e.target.value));
$("#sbtn").addEventListener("click", () => openSearch(""));
$("#langbtn").addEventListener("click", switchLang);
// links inside the docs: switch the view in place (ctrl / middle click and other sites open as usual)
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]");
  if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || a.target || a.hasAttribute("download")) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE) || url.pathname.startsWith(BASE + "_app/")) return;
  e.preventDefault();
  if (url.pathname + url.search !== location.pathname + location.search) go(url.pathname + url.search);
});
window.addEventListener("popstate", render);
render();
