const SITE_URL = "https://www.styliqa.com";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Rewrite dead placeholder hosts + bare assets/ paths to root-relative URLs. */
function normalizeAssetUrl(url) {
  if (!url) return url;
  let s = String(url).trim();
  const m = s.match(/^https?:\/\/(?:www\.)?styliqa\.(?:studio|com)(\/.*)?$/i);
  if (m) s = m[1] || "/";
  // Bare "assets/..." resolves wrong under /admin and /blog/...
  if (/^assets\//i.test(s)) s = `/${s}`;
  return s;
}

/** Absolute URL for OG/JSON-LD; leaves external URLs alone. */
function absoluteUrl(url) {
  if (!url) return url;
  const s = normalizeAssetUrl(String(url).trim());
  if (/^https?:\/\//i.test(s)) return s;
  return `${SITE_URL}${s.startsWith("/") ? s : `/${s}`}`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isoDate(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function stripScripts(html) {
  return String(html || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

const SOCIAL_ICONS = `
      <a href="https://www.facebook.com/styliqa.studio" target="_blank" rel="noopener" class="social-icon" aria-label="Styliqa on Facebook" title="Facebook">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13.6 21v-7.2h2.2l.3-2.7h-2.5V9.4c0-.8.2-1.3 1.4-1.3h1.3V5.7c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v2.1H9v2.7h2.2V21h2.4z" fill="currentColor"/></svg>
      </a>
      <a href="https://www.instagram.com/styliqa.studio/" target="_blank" rel="noopener" class="social-icon" aria-label="Styliqa on Instagram" title="Instagram">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="15.8" cy="8.2" r="0.9" fill="currentColor"/></svg>
      </a>
      <a href="https://www.pinterest.com/styliqa" target="_blank" rel="noopener" class="social-icon" aria-label="Styliqa on Pinterest" title="Pinterest">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11.3 20c-.1-.9-.2-2.4.05-3.4.2-.9 1.3-5.7 1.3-5.7s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.6 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3 0-4.9 2.2-4.9 4.7 0 .9.3 1.5.7 2 .2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.5.2-1.3-.5-1.9-2-1.9-3.6 0-2.7 2.3-5.9 6.8-5.9 3.6 0 6 2.6 6 5.4 0 3.7-2 6.5-5 6.5-1 0-1.9-.5-2.2-1.2 0 0-.5 2.1-.6 2.5-.2.8-.6 1.5-.9 2.1" fill="currentColor" stroke="none"/></svg>
      </a>
      <a href="https://www.behance.net/styliqa" target="_blank" rel="noopener" class="social-icon" aria-label="Styliqa on Behance" title="Behance">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 6.5v11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12.5" cy="13.7" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 9.3h2.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </a>
      <a href="https://www.fiverr.com/designerisrat" target="_blank" rel="noopener" class="social-icon" aria-label="Styliqa on Fiverr" title="Fiverr">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12.5l2.6 2.6L16.3 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>`;

function chrome({ title, description, canonical, robots = "index, follow", og = {}, twitter = {}, jsonLd = [], body, activeNav = "" }) {
  const ogType = og.type || "website";
  const ogTitle = og.title || title;
  const ogDesc = og.description || description;
  const ogUrl = og.url || canonical;
  const ogImage = absoluteUrl(og.image || "/assets/img/og/og-blog-index.png");
  const twTitle = twitter.title || ogTitle;
  const twDesc = twitter.description || ogDesc;
  const twImage = absoluteUrl(twitter.image || ogImage);

  const ldBlocks = (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    .filter(Boolean)
    .map((obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`)
    .join("\n");

  const blogCurrent = activeNav === "blog" ? ' aria-current="page"' : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${escapeHtml(robots)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta name="theme-color" content="#1a1214">
<link rel="icon" href="/assets/img/logo.jpg" type="image/jpeg">
<link rel="apple-touch-icon" href="/assets/img/logo.jpg">

<meta property="og:type" content="${escapeHtml(ogType)}">
<meta property="og:site_name" content="Styliqa">
<meta property="og:title" content="${escapeHtml(ogTitle)}">
<meta property="og:description" content="${escapeHtml(ogDesc)}">
<meta property="og:url" content="${escapeHtml(ogUrl)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
${og.publishedTime ? `<meta property="article:published_time" content="${escapeHtml(og.publishedTime)}">` : ""}
${og.modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(og.modifiedTime)}">` : ""}
${og.section ? `<meta property="article:section" content="${escapeHtml(og.section)}">` : ""}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(twTitle)}">
<meta name="twitter:description" content="${escapeHtml(twDesc)}">
<meta name="twitter:image" content="${escapeHtml(twImage)}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css?v=20260808b">
${ldBlocks}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<header class="nav" id="nav">
  <div class="nav__inner">
    <a href="/" class="nav__brand" aria-label="Styliqa home">
      <img src="/assets/img/logo.jpg" alt="" class="nav__logo" width="40" height="40">
      <span class="nav__word">Styliqa</span>
    </a>
    <nav class="nav__links" aria-label="Primary">
      <a href="/#about">About</a>
      <a href="/#services">Services</a>
      <a href="/#work">Work</a>
      <a href="/#process">Process</a>
      <a href="/#reviews">Reviews</a>
      <a href="/blog"${blogCurrent}>Blog</a>
      <a href="/#contact">Contact</a>
    </nav>
    <a href="/#contact" class="btn btn--brand btn--sm nav__cta">Book a Consultation</a>
    <button class="nav__burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="mobile-menu" id="mobileMenu">
    <a href="/#about">About</a>
    <a href="/#services">Services</a>
    <a href="/#work">Work</a>
    <a href="/#process">Process</a>
    <a href="/#reviews">Reviews</a>
    <a href="/blog">Blog</a>
    <a href="/#contact">Contact</a>
    <a href="/#contact" class="btn btn--brand btn--sm">Book a Consultation</a>
  </div>
</header>

${body}

<footer class="footer">
  <div class="section-inner footer__inner">
    <a href="/" class="nav__brand">
      <img src="/assets/img/logo.jpg" alt="" class="nav__logo" width="36" height="36">
      <span class="nav__word">Styliqa</span>
    </a>
    <nav class="footer__links" aria-label="Footer">
      <a href="/#about">About</a>
      <a href="/#services">Services</a>
      <a href="/#work">Work</a>
      <a href="/#process">Process</a>
      <a href="/#reviews">Reviews</a>
      <a href="/blog">Blog</a>
      <a href="/#contact">Contact</a>
    </nav>
    <div class="footer__social">
${SOCIAL_ICONS}
    </div>
  </div>
  <address class="footer__address">Flat 10B, House 30/32, Road 10, Uttara Sector 15/B, Dhaka, Bangladesh · <a href="https://www.google.com/maps/search/?api=1&amp;query=Flat+10B%2C+House+30%2F32%2C+Road+10%2C+Uttara+Sector+15%2FB%2C+Dhaka%2C+Bangladesh" target="_blank" rel="noopener">View on map →</a></address>
  <p class="footer__legal">© <span id="year"></span> Styliqa. Fashion design &amp; product development studio.</p>
</footer>

<a class="whatsapp-fab" href="https://wa.me/8801746776301?text=Hi%20Styliqa!%20I%27d%20like%20to%20talk%20about%20a%20project." target="_blank" rel="noopener" aria-label="Chat with Styliqa on WhatsApp">
  <div class="whatsapp-fab__bubble" aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="whatsapp-fab__avatar-wrap">
    <img src="/assets/img/logo.jpg" alt="" class="whatsapp-fab__avatar" width="42" height="42">
    <span class="whatsapp-fab__badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="white" width="11" height="11"><path d="M6.5 4.5c-.3-.7-1-1.1-1.7-.9L3 4.2c-.7.2-1.1.9-.9 1.6.9 3.4 2.8 6.5 5.5 9 2.6 2.6 5.7 4.4 9 5.3.7.2 1.4-.2 1.6-.9l.6-1.8c.2-.7-.2-1.4-.9-1.7l-2.4-1c-.5-.2-1.1-.1-1.5.3l-.9.9c-1.8-1-3.3-2.5-4.3-4.3l.9-.9c.4-.4.5-1 .3-1.5z"/></svg>
    </span>
  </div>
  <div class="whatsapp-fab__text">
    <span class="whatsapp-fab__name">Chat with us</span>
    <span class="whatsapp-fab__sub">on WhatsApp</span>
  </div>
</a>

<script src="/js/script.js"></script>
</body>
</html>`;
}

module.exports = {
  SITE_URL,
  escapeHtml,
  formatDate,
  isoDate,
  stripScripts,
  normalizeAssetUrl,
  absoluteUrl,
  chrome,
};
