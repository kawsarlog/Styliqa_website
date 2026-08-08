(() => {
  const TOKEN_KEY = "styliqa_admin_token";
  const cfg = window.STYLIQA || {};

  const loginView = document.getElementById("loginView");
  const dashView = document.getElementById("dashView");
  const tokenInput = document.getElementById("tokenInput");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const formPanel = document.getElementById("formPanel");
  const formTitle = document.getElementById("formTitle");
  const postsList = document.getElementById("postsList");
  const postCount = document.getElementById("postCount");
  const postStats = document.getElementById("postStats");
  const toastEl = document.getElementById("toast");
  const categoryList = document.getElementById("categoryList");
  const heroPreview = document.getElementById("heroPreview");
  const heroPreviewImg = document.getElementById("heroPreviewImg");
  const saveBtn = document.getElementById("saveBtn");

  let token = "";
  let posts = [];
  let editingId = null;
  let status = "draft";
  let quill = null;
  let saving = false;
  let uploading = false;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("is-on"), 2800);
  }

  async function sha256Hex(input) {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function checkToken(value) {
    const expected = (cfg.adminTokenHash || "").trim();
    if (!expected || !value) return false;
    return (await sha256Hex(value)) === expected;
  }

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /** Rewrite dead styliqa.studio hosts + bare assets/ paths to root-relative URLs. */
  function normalizeAssetUrl(url) {
    if (!url) return url;
    let s = String(url).trim();
    const m = s.match(/^https?:\/\/(?:www\.)?styliqa\.(?:studio|com)(\/.*)?$/i);
    if (m) s = m[1] || "/";
    if (/^assets\//i.test(s)) s = `/${s}`;
    return s;
  }

  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(options.headers || {}),
    };
    const resp = await fetch(path, { ...options, headers });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data.error || `Request failed (${resp.status})`;
      if (resp.status === 401) throw new Error("Unauthorized — check admin token / VITE_ADMIN_TOKEN_HASH");
      if (resp.status === 503) throw new Error(msg);
      throw new Error(msg);
    }
    return data;
  }

  function setAuthed(ok) {
    loginView.hidden = ok;
    dashView.hidden = !ok;
  }

  function syncStatusUi() {
    document.querySelectorAll(".status-toggle button").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.status === status);
    });
    saveBtn.textContent = status === "published" ? "Publish" : "Save draft";
  }

  function readForm() {
    return {
      id: editingId || undefined,
      title: document.getElementById("fTitle").value,
      slug: document.getElementById("fSlug").value,
      category: document.getElementById("fCategory").value,
      categorySlug: document.getElementById("fCategorySlug").value,
      readTime: document.getElementById("fReadTime").value,
      heroImg: document.getElementById("fHeroUrl").value,
      heroImgAlt: document.getElementById("fHeroAlt").value,
      excerpt: document.getElementById("fExcerpt").value,
      content: quill ? quill.root.innerHTML : "",
      status,
      metaTitle: document.getElementById("fMetaTitle").value,
      metaDescription: document.getElementById("fMetaDesc").value,
      ogTitle: document.getElementById("fOgTitle").value,
      ogDescription: document.getElementById("fOgDesc").value,
      ogImage: document.getElementById("fOgImage").value,
    };
  }

  function clearForm() {
    editingId = null;
    status = "draft";
    formTitle.textContent = "New post";
    ["fTitle", "fSlug", "fCategory", "fCategorySlug", "fReadTime", "fHeroAlt", "fExcerpt", "fMetaTitle", "fMetaDesc", "fOgTitle", "fOgDesc", "fOgImage"].forEach((id) => {
      document.getElementById(id).value = "";
    });
    document.getElementById("fHeroUrl").value = "";
    document.getElementById("fHeroFile").value = "";
    heroPreview.hidden = true;
    if (quill) quill.setText("");
    syncStatusUi();
  }

  function openNew() {
    clearForm();
    formPanel.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(row) {
    editingId = row.id;
    status = row.status === "published" ? "published" : "draft";
    formTitle.textContent = "Edit post";
    document.getElementById("fTitle").value = row.title || "";
    document.getElementById("fSlug").value = row.slug || "";
    document.getElementById("fCategory").value = row.category || "";
    document.getElementById("fCategorySlug").value = row.category_slug || "";
    document.getElementById("fReadTime").value = row.read_time || "";
    const hero = normalizeAssetUrl(row.hero_img) || "";
    const og = normalizeAssetUrl(row.og_image) || "";
    document.getElementById("fHeroUrl").value = hero;
    document.getElementById("fHeroAlt").value = row.hero_img_alt || "";
    document.getElementById("fExcerpt").value = row.excerpt || "";
    document.getElementById("fMetaTitle").value = row.meta_title || "";
    document.getElementById("fMetaDesc").value = row.meta_description || "";
    document.getElementById("fOgTitle").value = row.og_title || "";
    document.getElementById("fOgDesc").value = row.og_description || "";
    document.getElementById("fOgImage").value = og;
    if (hero) {
      heroPreviewImg.src = hero;
      heroPreview.hidden = false;
    } else {
      heroPreview.hidden = true;
    }
    if (quill) quill.root.innerHTML = row.content || "";
    syncStatusUi();
    formPanel.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function refreshCategories() {
    const map = new Map();
    for (const p of posts) {
      if (!p.category) continue;
      map.set(p.category.trim().toLowerCase(), p.category);
    }
    categoryList.innerHTML = [...map.values()]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `<option value="${name.replace(/"/g, "&quot;")}"></option>`)
      .join("");
  }

  function renderPosts() {
    postCount.textContent = `(${posts.length})`;
    const pub = posts.filter((p) => p.status === "published").length;
    const drafts = posts.length - pub;
    postStats.textContent = `${pub} published · ${drafts} drafts`;
    refreshCategories();

    if (!posts.length) {
      postsList.innerHTML = `<p class="muted" style="margin-top:1.25rem">No posts yet. Click "New post" to write your first article.</p>`;
      return;
    }

    postsList.innerHTML = posts
      .map((p) => {
        const hero = normalizeAssetUrl(p.hero_img);
        const thumb = hero ? `<img src="${escapeHtml(hero)}" alt="">` : "";
        return `<div class="post-row" data-id="${p.id}">
          <div class="post-row__thumb">${thumb}</div>
          <div style="min-width:0;flex:1">
            <div class="post-row__title">${escapeHtml(p.title)}</div>
            <div class="post-row__meta">
              <span class="pill ${p.status === "published" ? "pill--pub" : "pill--draft"}">${p.status === "published" ? "Published" : "Draft"}</span>
              ${p.category ? `<span>${escapeHtml(p.category)}</span>` : ""}
              <span>/blog/${escapeHtml(p.slug)}</span>
              ${p.published_at ? `<span>· ${formatDate(p.published_at)}</span>` : ""}
            </div>
          </div>
          <div class="row">
            ${p.status === "published" ? `<a class="btn btn--ghost" href="/blog/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">View</a>` : ""}
            <button type="button" class="btn btn--ghost" data-edit="${p.id}">Edit</button>
            <button type="button" class="btn btn--danger" data-del="${p.id}">Delete</button>
          </div>
        </div>`;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadPosts() {
    const data = await api("/api/admin/posts");
    posts = data.posts || [];
    renderPosts();
  }

  async function uploadImage(file) {
    const sign = await api("/api/r2-upload-url", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const put = await fetch(sign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("Image upload to storage failed");
    return sign.publicUrl;
  }

  async function uploadAndEmbed(file) {
    const range = quill.getSelection(true);
    const insertAt = range ? range.index : quill.getLength();
    const url = await uploadImage(file);
    quill.insertEmbed(insertAt, "image", url, "user");
    quill.setSelection(insertAt + 1, 0, "user");
  }

  function initQuill() {
    const toolbar = [
      [{ header: [2, 3, false] }],
      ["bold", "italic", "underline", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ];

    quill = new Quill("#editor", {
      theme: "snow",
      modules: {
        toolbar: {
          container: toolbar,
          handlers: {
            image() {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.click();
              input.onchange = () => {
                const file = input.files && input.files[0];
                if (file) uploadAndEmbed(file).catch((err) => toast(err.message || "Upload failed"));
              };
            },
          },
        },
      },
    });

    const root = quill.root;
    root.addEventListener(
      "paste",
      (e) => {
        const items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              e.stopImmediatePropagation();
              uploadAndEmbed(file).catch((err) => toast(err.message || "Upload failed"));
            }
            return;
          }
        }
      },
      true,
    );
    root.addEventListener(
      "drop",
      (e) => {
        const file = [...((e.dataTransfer && e.dataTransfer.files) || [])].find((f) => f.type.startsWith("image/"));
        if (file) {
          e.preventDefault();
          e.stopImmediatePropagation();
          uploadAndEmbed(file).catch((err) => toast(err.message || "Upload failed"));
        }
      },
      true,
    );
  }

  loginBtn.addEventListener("click", async () => {
    const value = tokenInput.value.trim();
    if (!value) {
      toast("Token required");
      return;
    }
    loginBtn.disabled = true;
    try {
      const ok = await checkToken(value);
      if (!ok) {
        toast("Invalid admin token");
        return;
      }
      token = value;
      localStorage.setItem(TOKEN_KEY, token);
      setAuthed(true);
      if (!quill) initQuill();
      await loadPosts();
      toast("Welcome back");
    } catch (err) {
      toast(err.message || "Login failed");
    } finally {
      loginBtn.disabled = false;
    }
  });

  tokenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    token = "";
    posts = [];
    formPanel.hidden = true;
    setAuthed(false);
  });

  document.getElementById("newBtn").addEventListener("click", openNew);
  document.getElementById("cancelBtn").addEventListener("click", () => {
    formPanel.hidden = true;
    clearForm();
  });
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadPosts().catch((err) => toast(err.message || "Refresh failed"));
  });

  document.querySelectorAll(".status-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      status = btn.dataset.status;
      syncStatusUi();
    });
  });

  document.getElementById("fHeroFile").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || uploading) return;
    uploading = true;
    try {
      const url = await uploadImage(file);
      document.getElementById("fHeroUrl").value = url;
      heroPreviewImg.src = url;
      heroPreview.hidden = false;
      toast("Image uploaded");
    } catch (err) {
      toast(err.message || "Upload failed");
    } finally {
      uploading = false;
    }
  });

  document.getElementById("fCategory").addEventListener("change", (e) => {
    const value = e.target.value.trim();
    const match = posts.find((p) => (p.category || "").toLowerCase() === value.toLowerCase());
    if (match && match.category_slug) {
      document.getElementById("fCategorySlug").value = match.category_slug;
    }
  });

  saveBtn.addEventListener("click", async () => {
    if (saving) return;
    const form = readForm();
    if (!form.title.trim()) {
      toast("Title required");
      return;
    }
    if (form.status === "published" && !form.content.replace(/<[^>]+>/g, "").trim()) {
      toast("Content required to publish");
      return;
    }
    if (form.status === "published" && !form.heroImg.trim()) {
      toast("Hero image required to publish");
      return;
    }
    saving = true;
    saveBtn.disabled = true;
    try {
      await api("/api/admin/posts", { method: "POST", body: JSON.stringify(form) });
      toast(form.status === "published" ? "Post published" : "Draft saved");
      formPanel.hidden = true;
      clearForm();
      await loadPosts();
    } catch (err) {
      toast(err.message || "Save failed");
    } finally {
      saving = false;
      saveBtn.disabled = false;
    }
  });

  postsList.addEventListener("click", async (e) => {
    const editId = e.target.closest("[data-edit]")?.getAttribute("data-edit");
    const delId = e.target.closest("[data-del]")?.getAttribute("data-del");
    if (editId) {
      const row = posts.find((p) => String(p.id) === String(editId));
      if (row) openEdit(row);
      return;
    }
    if (delId) {
      if (!confirm("Delete this post? This cannot be undone.")) return;
      try {
        await api(`/api/admin/posts?id=${encodeURIComponent(delId)}`, { method: "DELETE" });
        posts = posts.filter((p) => String(p.id) !== String(delId));
        renderPosts();
        toast("Post deleted");
      } catch (err) {
        toast(err.message || "Delete failed");
      }
    }
  });

  // Auto-login from saved token
  (async () => {
    const saved = localStorage.getItem(TOKEN_KEY) || "";
    if (!saved) return;
    if (!(await checkToken(saved))) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    token = saved;
    tokenInput.value = saved;
    setAuthed(true);
    initQuill();
    try {
      await loadPosts();
    } catch (err) {
      toast(err.message || "Failed to load posts");
    }
  })();
})();
