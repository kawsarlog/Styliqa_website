const crypto = require("node:crypto");

function sha256Hex(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function getAdminToken(req) {
  const raw = req.headers["x-admin-token"];
  if (Array.isArray(raw)) return String(raw[0] || "").trim();
  return String(raw || "").trim();
}

function getExpectedAdminHash() {
  return (process.env.VITE_ADMIN_TOKEN_HASH || process.env.ADMIN_TOKEN_HASH || "").trim();
}

/**
 * Gate admin API routes. Distinguishes missing server config (503) from
 * bad/missing token (401) so the client can show a useful message.
 */
function requireAdmin(req, res) {
  const expectedHash = getExpectedAdminHash();
  if (!expectedHash) {
    res.status(503).json({
      error: "Admin auth is not configured. Set VITE_ADMIN_TOKEN_HASH on Vercel.",
    });
    return false;
  }

  const token = getAdminToken(req);
  if (!token || sha256Hex(token) !== expectedHash) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = { sha256Hex, getAdminToken, getExpectedAdminHash, requireAdmin };
