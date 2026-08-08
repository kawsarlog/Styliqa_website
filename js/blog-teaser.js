(() => {
  const grid = document.querySelector(".blog-teaser__grid");
  if (!grid) return;

  fetch("/api/posts?limit=2")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const posts = (data && data.posts) || [];
      if (!posts.length) return;
      grid.innerHTML = posts
        .map((p) => {
          const meta = [p.category, p.read_time].filter(Boolean).join(" · ");
          const img = p.hero_img || "assets/img/og/og-blog-index.png";
          const alt = escapeAttr(p.hero_img_alt || p.title);
          return `<a href="/blog/${encodeURIComponent(p.slug)}" class="post-card reveal" data-reveal>
        <img src="${escapeAttr(img)}" alt="${alt}" class="post-card__img" loading="lazy" width="1200" height="630">
        <div class="post-card__body">
          ${meta ? `<p class="post-card__meta">${escapeHtml(meta)}</p>` : ""}
          <h3>${escapeHtml(p.title)}</h3>
          ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ""}
          <span class="text-link">Read the article →</span>
        </div>
      </a>`;
        })
        .join("");

      if (window.StyliqaReveal) window.StyliqaReveal();
      else {
        grid.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
      }
    })
    .catch(() => {
      // Keep static fallback cards if the API is unavailable (local static preview).
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
