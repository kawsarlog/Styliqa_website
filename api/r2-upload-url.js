// Short-lived R2 PUT URL for admin hero / in-article image uploads.
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("node:crypto");
const { requireAdmin } = require("../lib/admin-auth");

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { filename, contentType } = req.body || {};
  if (!filename || !contentType || !ALLOWED_TYPES.has(contentType)) {
    res.status(400).json({ error: "filename and a supported image contentType are required" });
    return;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    res.status(500).json({ error: "R2 is not configured on the server" });
    return;
  }

  const ext = (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = `styliqa/hero/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
    res.status(200).json({
      uploadUrl,
      publicUrl: `${publicUrl.replace(/\/$/, "")}/${key}`,
    });
  } catch (err) {
    console.error("r2-upload-url: failed to sign URL", err);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
};
