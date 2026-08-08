const TABLE = "styliqa_blog_posts";

function supabaseEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
  return { url, anon, service };
}

async function supabaseFetch(pathAndQuery, { useService = false, method = "GET", body } = {}) {
  const { url, anon, service } = supabaseEnv();
  const key = useService ? service : anon;
  if (!url || !key) throw new Error("Supabase is not configured");

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (method === "POST") headers.Prefer = "return=representation";
  if (method === "PATCH" || method === "DELETE") headers.Prefer = "return=minimal";

  const resp = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!resp.ok) {
    const msg = (data && data.message) || (data && data.error) || text || resp.statusText;
    const err = new Error(msg);
    err.status = resp.status;
    throw err;
  }
  return data;
}

async function fetchPublishedPosts() {
  return (
    (await supabaseFetch(
      `${TABLE}?select=*&status=eq.published&order=published_at.desc`,
    )) || []
  );
}

async function fetchPublishedPostBySlug(slug) {
  const rows =
    (await supabaseFetch(
      `${TABLE}?select=*&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`,
    )) || [];
  return rows[0] || null;
}

async function fetchAllPostsAdmin() {
  return (
    (await supabaseFetch(`${TABLE}?select=*&order=created_at.desc`, { useService: true })) || []
  );
}

async function savePostAdmin(input) {
  const row = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt || null,
    content: input.content || null,
    category: input.category || null,
    category_slug: input.categorySlug || null,
    author: input.author || "Styliqa Studio",
    hero_img: input.heroImg || null,
    hero_img_alt: input.heroImgAlt || null,
    read_time: input.readTime || null,
    status: input.status,
    meta_title: input.metaTitle || null,
    meta_description: input.metaDescription || null,
    og_title: input.ogTitle || null,
    og_description: input.ogDescription || null,
    og_image: input.ogImage || null,
    updated_at: new Date().toISOString(),
  };
  if (input.status === "published") {
    row.published_at = new Date().toISOString();
  }

  if (input.id) {
    await supabaseFetch(`${TABLE}?id=eq.${input.id}`, {
      useService: true,
      method: "PATCH",
      body: row,
    });
    return;
  }

  await supabaseFetch(TABLE, { useService: true, method: "POST", body: row });
}

async function deletePostAdmin(id) {
  await supabaseFetch(`${TABLE}?id=eq.${id}`, { useService: true, method: "DELETE" });
}

module.exports = {
  TABLE,
  fetchPublishedPosts,
  fetchPublishedPostBySlug,
  fetchAllPostsAdmin,
  savePostAdmin,
  deletePostAdmin,
};
