(() => {
  "use strict";

  const TABS = ["profile", "works", "contests", "news"];

  const SITE_LABELS = {
    narou: "小説家になろう",
    kakuyomu: "カクヨム",
  };

  // 結果の文字列 → バッジの種類
  function resultKind(result) {
    const r = String(result || "");
    if (!r || /待|選考中|応募済/.test(r)) return "pending";
    if (/落選/.test(r)) return "out";
    if (/最終/.test(r)) return "final";
    if (/賞|佳作|入選|書籍化|受賞/.test(r)) return "win";
    if (/通過/.test(r)) return "pass";
    return "out";
  }
  const KIND_LABELS = {
    win: "受賞",
    final: "最終候補",
    pass: "選考通過",
    out: "落選",
    pending: "結果待ち",
  };

  // ---------- helpers ----------
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? esc(u) : "#");

  const ext = (url) => `href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer"`;

  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  async function loadYaml(path) {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    // CORE_SCHEMA: 2026-03-01 のような日付を Date に変換せず文字列のまま扱う
    return jsyaml.load(await res.text(), { schema: jsyaml.CORE_SCHEMA });
  }

  const X_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';

  // ---------- render ----------
  function renderHeader(p) {
    const name = p.name || "";
    document.getElementById("pen-name").textContent = name;
    document.getElementById("tagline").textContent = p.tagline || "";
    document.getElementById("footer-name").textContent = name;
    document.getElementById("year").textContent = new Date().getFullYear();

    const avatar = document.getElementById("avatar");
    if (p.icon) {
      avatar.innerHTML = `<img src="${esc(p.icon)}" alt="">`;
    } else {
      avatar.textContent = [...name][0] || "?";
    }
  }

  function renderProfile(p) {
    const genres = list(p.genres);
    const links = [];
    if (p.narou) links.push({ label: SITE_LABELS.narou, sub: "マイページ", url: p.narou });
    if (p.kakuyomu) links.push({ label: SITE_LABELS.kakuyomu, sub: "ユーザーページ", url: p.kakuyomu });
    if (p.x) links.push({ label: "X", sub: `@${p.x}`, url: `https://x.com/${p.x}` });
    links.push(...list(p.links));

    document.getElementById("profile").innerHTML = `
      <h2>自己紹介</h2>
      <p class="bio">${esc(p.bio)}</p>
      ${
        genres.length
          ? `<h2>書いているジャンル</h2>
             <ul class="tags">${genres.map((g) => `<li class="tag">${esc(g)}</li>`).join("")}</ul>`
          : ""
      }
      <h2>リンク</h2>
      <ul class="link-list">
        ${links
          .map(
            (l) => `
          <li><a class="link-card" ${ext(l.url)}>
            <span><span class="label">${esc(l.label)}</span>${l.sub ? ` <span class="sub">${esc(l.sub)}</span>` : ""}</span>
            <span class="arrow" aria-hidden="true">↗</span>
          </a></li>`
          )
          .join("")}
      </ul>`;
  }

  function renderWorks(works) {
    const el = document.getElementById("works");
    if (!works.length) {
      el.innerHTML = '<p class="empty">作品はまだ登録されていません。</p>';
      return;
    }
    el.innerHTML = `
      <ul class="work-list">
        ${works
          .map((w) => {
            const meta = [w.status, w.length].filter(Boolean).join(" ・ ");
            const btns = [];
            if (w.narou) btns.push(`<a class="btn btn-primary" ${ext(w.narou)}>${SITE_LABELS.narou}で読む</a>`);
            if (w.kakuyomu) btns.push(`<a class="btn btn-primary" ${ext(w.kakuyomu)}>${SITE_LABELS.kakuyomu}で読む</a>`);
            list(w.links).forEach((l) => btns.push(`<a class="btn" ${ext(l.url)}>${esc(l.label)}</a>`));
            return `
            <li class="work">
              <div class="work-head">
                <h3 class="work-title">${esc(w.title)}</h3>
                ${meta ? `<span class="work-meta">${esc(meta)}</span>` : ""}
              </div>
              ${w.summary ? `<p class="work-summary">${esc(w.summary)}</p>` : ""}
              ${
                list(w.tags).length
                  ? `<ul class="tags">${list(w.tags).map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>`
                  : ""
              }
              ${btns.length ? `<div class="work-links">${btns.join("")}</div>` : ""}
            </li>`;
          })
          .join("")}
      </ul>`;
  }

  function renderContests(contests) {
    const el = document.getElementById("contests");
    if (!contests.length) {
      el.innerHTML = '<p class="empty">公募歴はまだ登録されていません。</p>';
      return;
    }
    const items = contests
      .map((c) => ({ ...c, date: String(c.date ?? ""), kind: resultKind(c.result) }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const count = (kinds) => items.filter((c) => kinds.includes(c.kind)).length;
    const present = Object.keys(KIND_LABELS).filter((k) => count([k]) > 0);

    el.innerHTML = `
      <div class="stats">
        <div class="stat"><div class="stat-num">${items.length}</div><div class="stat-label">応募</div></div>
        <div class="stat"><div class="stat-num">${count(["pass", "final", "win"])}</div><div class="stat-label">選考通過以上</div></div>
        <div class="stat"><div class="stat-num">${count(["win"])}</div><div class="stat-label">受賞</div></div>
      </div>
      <div class="filters" role="group" aria-label="結果で絞り込み">
        <button class="filter" data-kind="all" aria-pressed="true">すべて</button>
        ${present.map((k) => `<button class="filter" data-kind="${k}" aria-pressed="false">${KIND_LABELS[k]}</button>`).join("")}
      </div>
      <ul class="contest-list">
        ${items
          .map(
            (c) => `
          <li class="contest" data-kind="${c.kind}">
            <div class="contest-date">${esc(c.date.replace(/-/g, "."))}</div>
            <div>
              <div class="contest-name">${esc(c.contest)}</div>
              ${c.work ? `<div class="contest-work">応募作：${esc(c.work)}</div>` : ""}
              ${c.note ? `<div class="contest-note">${esc(c.note)}</div>` : ""}
            </div>
            <span class="badge badge-${c.kind}">${esc(c.result || "結果待ち")}</span>
          </li>`
          )
          .join("")}
      </ul>`;

    el.querySelector(".filters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      const kind = btn.dataset.kind;
      el.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      el.querySelectorAll(".contest").forEach((li) => {
        li.hidden = kind !== "all" && li.dataset.kind !== kind;
      });
    });
  }

  function renderNews(news, profile) {
    const items = news
      .map((n) => ({ ...n, date: String(n.date ?? "") }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const xCard = profile.x
      ? `<h2>X（旧Twitter）</h2>
         <div class="x-card">
           <div>
             <div><strong>@${esc(profile.x)}</strong></div>
             <div class="muted">更新のお知らせや近況を投稿しています</div>
           </div>
           <a class="x-btn" ${ext(`https://x.com/${profile.x}`)}>${X_ICON}フォローする</a>
         </div>`
      : "";

    document.getElementById("news").innerHTML = `
      <h2>お知らせ</h2>
      ${
        items.length
          ? `<ul class="news-list">
              ${items
                .map(
                  (n) => `
                <li class="news-item">
                  <div class="news-date">${esc(n.date.replace(/-/g, "."))}</div>
                  <div>${n.url ? `<a ${ext(n.url)}>${esc(n.text)}</a>` : esc(n.text)}</div>
                </li>`
                )
                .join("")}
            </ul>`
          : '<p class="empty">お知らせはまだありません。</p>'
      }
      ${xCard}`;
  }

  // ---------- tabs ----------
  const tabButtons = () => [...document.querySelectorAll(".tab")];

  function showTab(id, { focus = false } = {}) {
    if (!TABS.includes(id)) id = TABS[0];
    tabButtons().forEach((b) => {
      const on = b.dataset.tab === id;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    TABS.forEach((t) => (document.getElementById(t).hidden = t !== id));
  }

  function initTabs() {
    const nav = document.querySelector(".tabs");
    nav.addEventListener("click", (e) => {
      const b = e.target.closest(".tab");
      if (!b) return;
      history.replaceState(null, "", `#${b.dataset.tab}`);
      showTab(b.dataset.tab);
      window.scrollTo({ top: 0 });
    });
    nav.addEventListener("keydown", (e) => {
      const btns = tabButtons();
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      let next = null;
      if (e.key === "ArrowRight") next = (i + 1) % btns.length;
      if (e.key === "ArrowLeft") next = (i - 1 + btns.length) % btns.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = btns.length - 1;
      if (next === null) return;
      e.preventDefault();
      history.replaceState(null, "", `#${btns[next].dataset.tab}`);
      showTab(btns[next].dataset.tab, { focus: true });
    });
    window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
    showTab(location.hash.slice(1));
  }

  // ---------- main ----------
  async function main() {
    initTabs();
    try {
      const [profile, works, contests, news] = await Promise.all([
        loadYaml("data/profile.yml"),
        loadYaml("data/works.yml"),
        loadYaml("data/contests.yml"),
        loadYaml("data/news.yml"),
      ]);
      const p = profile || {};
      renderHeader(p);
      renderProfile(p);
      renderWorks(list(works));
      renderContests(list(contests));
      renderNews(list(news), p);
    } catch (err) {
      console.error(err);
      document.getElementById("load-error").hidden = false;
    }
  }

  main();
})();
