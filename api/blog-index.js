const {
  SITE_URL,
  escapeHtml,
  chrome,
} = require("../lib/blog-layout");
const { fetchPublishedPosts } = require("../lib/blog-db");

module.exports = async function handler(req, res) {
  let posts = [];
  try {
    posts = await fetchPublishedPosts();
  } catch (err) {
    console.error("blog-index: fetch failed", err);
  }

  const cards = posts.length
    ? posts
        .map((p) => {
          const meta = [p.category, p.read_time].filter(Boolean).join(" · ");
          const img = p.hero_img || `${SITE_URL}/assets/img/og/og-blog-index.png`;
          const alt = escapeHtml(p.hero_img_alt || p.title);
          return `<a href="/blog/${escapeHtml(p.slug)}" class="post-card">
        <img src="${escapeHtml(img)}" alt="${alt}" class="post-card__img" loading="lazy" width="1200" height="630">
        <div class="post-card__body">
          ${meta ? `<p class="post-card__meta">${escapeHtml(meta)}</p>` : ""}
          <h3>${escapeHtml(p.title)}</h3>
          ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ""}
          <span class="text-link">Read the article →</span>
        </div>
      </a>`;
        })
        .join("\n")
    : `<p class="blog-index__empty">New journal notes are on the way. Check back soon.</p>`;

  const blogPostLd = posts.map((p) => ({
    "@type": "BlogPosting",
    headline: p.title,
    url: `${SITE_URL}/blog/${p.slug}`,
  }));

  const body = `<main id="main">
<section class="blog-hero">
  <div class="section-inner">
    <p class="blog-hero__kicker">The Styliqa Journal</p>
    <h1>Notes on tech packs, patterns and production.</h1>
    <p>Practical writing from the studio floor: what factories actually need, where size ranges quietly break, and how to avoid the mistakes that turn a five-minute file error into a five-thousand-unit problem.</p>
  </div>
</section>
<section class="blog-index">
  <div class="section-inner">
    <div class="blog-index__grid">
      ${cards}
    </div>
  </div>
</section>
</main>`;

  const html = chrome({
    title: "The Styliqa Journal | Tech Packs & Patterns",
    description:
      "Practical, no-fluff writing on fashion tech packs, pattern grading, and production-ready garment files, from the Styliqa studio.",
    canonical: `${SITE_URL}/blog`,
    activeNav: "blog",
    og: {
      type: "website",
      title: "The Styliqa Journal | Notes on Tech Packs, Patterns & Production",
      description:
        "Practical, no-fluff writing on fashion tech packs, pattern grading, and production-ready garment files, from the Styliqa studio.",
      url: `${SITE_URL}/blog`,
      image: `${SITE_URL}/assets/img/og/og-blog-index.png`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "The Styliqa Journal",
      url: `${SITE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "Styliqa",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/img/logo.jpg` },
      },
      blogPost: blogPostLd,
    },
    body,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
  res.status(200).send(html);
};
