// Dynamic sitemap.xml — every published Styliqa blog post is included at request time.
const { SITE_URL } = require("../lib/blog-layout");
const { fetchPublishedPosts } = require("../lib/blog-db");

const STATIC_URLS = [
  { loc: "/", changefreq: "monthly", priority: "1.0" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
];

module.exports = async function handler(req, res) {
  let posts = [];
  try {
    posts = await fetchPublishedPosts();
  } catch (err) {
    console.error("sitemap: failed to fetch blog posts", err);
  }

  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    ...STATIC_URLS.map(
      (u) =>
        `  <url>\n    <loc>${SITE_URL}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    ),
    ...posts.map((p) => {
      const lastmod = (p.updated_at || p.published_at || "").slice(0, 10);
      return `  <url>\n    <loc>${SITE_URL}/blog/${p.slug}</loc>${
        lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""
      }\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
};
