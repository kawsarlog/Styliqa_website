const { requireAdmin } = require("../../lib/admin-auth");
const {
  fetchAllPostsAdmin,
  savePostAdmin,
  deletePostAdmin,
} = require("../../lib/blog-db");

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sendError(res, err) {
  const status = err && err.status >= 400 && err.status < 600 ? err.status : 500;
  // Never leak stack traces; keep message useful for ops (config / SQL / auth).
  const error =
    (err && err.message) ||
    (status === 401 ? "Unauthorized" : status === 503 ? "Service unavailable" : "Server error");
  res.status(status).json({ error });
}

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") {
      const posts = await fetchAllPostsAdmin();
      res.status(200).json({ posts });
      return;
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const title = String(body.title || "").trim();
      if (!title) {
        res.status(400).json({ error: "Title required" });
        return;
      }
      if (body.status === "published" && !String(body.content || "").trim()) {
        res.status(400).json({ error: "Content required to publish" });
        return;
      }
      if (body.status === "published" && !String(body.heroImg || "").trim()) {
        res.status(400).json({ error: "Hero image required to publish" });
        return;
      }

      const slug = String(body.slug || "").trim() || slugify(title);
      await savePostAdmin({
        id: body.id || undefined,
        slug,
        title,
        excerpt: String(body.excerpt || "").trim(),
        content: body.content || "",
        category: String(body.category || "").trim(),
        categorySlug: String(body.categorySlug || "").trim() || slugify(body.category || ""),
        author: String(body.author || "Styliqa Studio").trim() || "Styliqa Studio",
        heroImg: String(body.heroImg || "").trim(),
        heroImgAlt: String(body.heroImgAlt || "").trim(),
        readTime: String(body.readTime || "").trim(),
        status: body.status === "published" ? "published" : "draft",
        metaTitle: String(body.metaTitle || "").trim(),
        metaDescription: String(body.metaDescription || "").trim(),
        ogTitle: String(body.ogTitle || "").trim(),
        ogDescription: String(body.ogDescription || "").trim(),
        ogImage: String(body.ogImage || "").trim(),
      });
      res.status(200).json({ ok: true, slug });
      return;
    }

    if (req.method === "DELETE") {
      const id = parseInt(req.query.id || (req.body && req.body.id), 10);
      if (!id) {
        res.status(400).json({ error: "id required" });
        return;
      }
      await deletePostAdmin(id);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/posts:", err);
    sendError(res, err);
  }
};
