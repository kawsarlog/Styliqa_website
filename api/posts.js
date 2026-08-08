// Public JSON feed of published posts (homepage teaser, etc.).
const { normalizeAssetUrl } = require("../lib/blog-layout");
const { fetchPublishedPosts } = require("../lib/blog-db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const limit = Math.min(parseInt(req.query.limit || "12", 10) || 12, 50);
    const posts = await fetchPublishedPosts();
    const slim = posts.slice(0, limit).map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      read_time: p.read_time,
      hero_img: normalizeAssetUrl(p.hero_img),
      hero_img_alt: p.hero_img_alt,
      published_at: p.published_at,
    }));
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).json({ posts: slim });
  } catch (err) {
    console.error("posts: fetch failed", err);
    res.status(500).json({ error: "Failed to load posts" });
  }
};
