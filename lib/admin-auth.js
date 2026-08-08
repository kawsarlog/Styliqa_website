const crypto = require("node:crypto");

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getAdminToken(req) {
  return req.headers["x-admin-token"] || "";
}

function requireAdmin(req, res) {
  const token = getAdminToken(req);
  const expectedHash = (process.env.VITE_ADMIN_TOKEN_HASH || process.env.ADMIN_TOKEN_HASH || "").trim();
  if (!token || !expectedHash || sha256Hex(token) !== expectedHash) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = { sha256Hex, getAdminToken, requireAdmin };
