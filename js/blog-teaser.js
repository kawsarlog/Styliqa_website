(() => {
  const grid = document.querySelector(".blog-teaser__grid");
  if (!grid) return;

  const FALLBACK_HTML = grid.innerHTML;
  const TITLE_MAX = 72;
  const EXCERPT_MAX = 140;

  function clipText(value, max) {
    const text = String(value || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    if (text.length <= max) return text;
    const sliced = text.slice(0, max - 1);
    const atWord = sliced.lastIndexOf(" ");
    return `${(atWord > max * 0.6 ? sliced.slice(0, atWord) : sliced).trim()}…`;
  }

  function revealCards(root) {
    const els = root.querySelectorAll("[data-reveal]");
    if (typeof window.StyliqaReveal === "function") {
      window.StyliqaReveal(els);
      return;
    }
    els.forEach((el) => el.classList.add("is-visible"));
  }

  function renderPosts(posts) {
    grid.innerHTML = posts
      .map((p) => {
        const meta = [p.category, p.read_time].filter(Boolean).join(" · ");
        const img = p.hero_img || "/assets/img/og/og-blog-index.png";
        const alt = escapeAttr(p.hero_img_alt || p.title);
        const title = clipText(p.title, TITLE_MAX);
        const excerpt = clipText(p.excerpt, EXCERPT_MAX);
        return `<a href="/blog/${encodeURIComponent(p.slug)}" class="post-row reveal" data-reveal>
        <img src="${escapeAttr(img)}" alt="${alt}" class="post-row__img" loading="lazy" width="640" height="480">
        <div class="post-row__body">
          ${meta ? `<p class="post-row__meta">${escapeHtml(meta)}</p>` : ""}
          <h3 class="post-row__title">${escapeHtml(title)}</h3>
          ${excerpt ? `<p class="post-row__excerpt">${escapeHtml(excerpt)}</p>` : ""}
          <span class="text-link">Read the article →</span>
        </div>
      </a>`;
      })
      .join("");
    revealCards(grid);
  }

  fetch("/api/posts?limit=2")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const posts = (data && data.posts) || [];
      if (!posts.length) return;
      renderPosts(posts);
    })
    .catch(() => {
      if (!grid.querySelector(".post-row")) grid.innerHTML = FALLBACK_HTML;
    });

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }
})();
