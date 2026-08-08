const {
  SITE_URL,
  escapeHtml,
  formatDate,
  isoDate,
  stripScripts,
  normalizeAssetUrl,
  absoluteUrl,
  chrome,
} = require("../lib/blog-layout");
const { fetchPublishedPosts, fetchPublishedPostBySlug } = require("../lib/blog-db");

function resolveSlug(req) {
  if (req.query.slug) return String(req.query.slug).replace(/\.html$/i, "");
  const url = req.url || "";
  const match = url.match(/\/blog\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]).replace(/\.html$/i, "") : "";
}

module.exports = async function handler(req, res) {
  const slug = resolveSlug(req);
  if (!slug || slug === "index") {
    res.writeHead(302, { Location: "/blog" });
    res.end();
    return;
  }

  let post = null;
  let siblings = [];
  try {
    post = await fetchPublishedPostBySlug(slug);
    if (post) siblings = await fetchPublishedPosts();
  } catch (err) {
    console.error("blog-post: fetch failed", err);
  }

  if (!post) {
    const html = chrome({
      title: "Article not found | Styliqa",
      description: "This journal note could not be found.",
      canonical: `${SITE_URL}/blog`,
      robots: "noindex, follow",
      activeNav: "blog",
      body: `<main id="main" class="blog-index" style="padding-top:calc(var(--nav-h) + 4rem)">
  <div class="section-inner" style="text-align:center;max-width:40rem;margin-inline:auto">
    <h1 class="section-title">Article not found</h1>
    <p style="margin-top:1rem;color:var(--muted)">That note may have moved or is no longer published.</p>
    <a href="/blog" class="btn btn--brand" style="margin-top:1.5rem">Back to the Journal</a>
  </div>
</main>`,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(404).send(html);
    return;
  }

  const titleTag = post.meta_title || `${post.title} | Styliqa`;
  const description =
    post.meta_description ||
    post.excerpt ||
    "Practical notes on fashion tech packs, patterns, and production from Styliqa.";
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const ogTitle = post.og_title || post.title;
  const ogDescription = post.og_description || description;
  const heroImg = normalizeAssetUrl(post.hero_img);
  const ogImage = absoluteUrl(
    normalizeAssetUrl(post.og_image) ||
      heroImg ||
      "/assets/img/og/og-blog-index.png"
  );
  const published = isoDate(post.published_at);
  const modified = isoDate(post.updated_at || post.published_at);
  const author = post.author || "Styliqa Studio";
  const contentHtml = stripScripts(post.content || "");

  const idx = siblings.findIndex((p) => p.slug === post.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const shortCrumb =
    post.title.length > 42 ? `${post.title.slice(0, 40)}…` : post.title;

  const body = `<main id="main">
<nav class="breadcrumb section-inner" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/blog">Blog</a></li>
    <li aria-current="page">${escapeHtml(shortCrumb)}</li>
  </ol>
</nav>

<header class="article-header">
  <div class="section-inner">
    ${post.category ? `<span class="article-header__tag">${escapeHtml(post.category)}</span>` : ""}
    <h1>${escapeHtml(post.title)}</h1>
    <p class="article-header__meta">
      <span>${escapeHtml(author)}</span>
      ${published ? `<span>·</span><time datetime="${escapeHtml(published)}">${escapeHtml(formatDate(post.published_at))}</time>` : ""}
      ${post.read_time ? `<span>·</span><span>${escapeHtml(post.read_time)}</span>` : ""}
    </p>
  </div>
</header>

${
  heroImg
    ? `<img src="${escapeHtml(heroImg)}" alt="${escapeHtml(post.hero_img_alt || post.title)}" class="article-cover" width="1200" height="630">`
    : ""
}

<article class="article">
  <div class="section-inner article__body">
    ${contentHtml}
  </div>

  <div class="article__cta section-inner">
    <h2>Ready to take a style into production?</h2>
    <p>Styliqa builds flat sketches, full tech packs, and graded production files for men's, women's, and kids' apparel.</p>
    <a href="/#contact" class="btn btn--brand">Start a Project</a>
  </div>

  <nav class="article__nav section-inner" aria-label="More articles">
    ${prev ? `<a href="/blog/${escapeHtml(prev.slug)}" class="text-link">← ${escapeHtml(prev.title)}</a>` : `<a href="/blog" class="text-link">← All articles</a>`}
    ${next ? `<a href="/blog/${escapeHtml(next.slug)}" class="text-link">Next: ${escapeHtml(next.title)} →</a>` : `<a href="/blog" class="text-link">All articles →</a>`}
  </nav>
</article>
</main>`;

  const html = chrome({
    title: titleTag,
    description,
    canonical,
    activeNav: "blog",
    og: {
      type: "article",
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      image: ogImage,
      publishedTime: published,
      modifiedTime: modified,
      section: post.category || undefined,
    },
    twitter: {
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
    },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description,
        image: ogImage,
        datePublished: published,
        dateModified: modified,
        author: { "@type": "Organization", name: author, url: `${SITE_URL}/` },
        publisher: {
          "@type": "Organization",
          name: "Styliqa",
          logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/img/logo.jpg` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: canonical },
        ],
      },
    ],
    body,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
  res.status(200).send(html);
};
