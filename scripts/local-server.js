/**
 * Local preview server (static + /blog API handlers).
 * Usage: node scripts/local-server.js
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 5544;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

const blogIndex = require(path.join(ROOT, "api", "blog-index.js"));
const blogPost = require(path.join(ROOT, "api", "blog-post.js"));
const postsApi = require(path.join(ROOT, "api", "posts.js"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function vercelRes(nodeRes) {
  const headers = {};
  let statusCode = 200;
  return {
    setHeader(k, v) {
      headers[k] = v;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    send(body) {
      nodeRes.writeHead(statusCode, headers);
      nodeRes.end(typeof body === "string" || Buffer.isBuffer(body) ? body : String(body));
    },
    json(obj) {
      headers["Content-Type"] = "application/json; charset=utf-8";
      nodeRes.writeHead(statusCode, headers);
      nodeRes.end(JSON.stringify(obj));
    },
    end(body) {
      nodeRes.writeHead(statusCode, headers);
      nodeRes.end(body);
    },
  };
}

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^([/\\])+/, "");
  const full = path.join(ROOT, cleaned);
  if (!full.startsWith(ROOT)) return null;
  return full;
}

function serveStatic(req, res, urlPath) {
  let filePath = safeJoin(urlPath === "/" ? "/index.html" : urlPath);
  if (!filePath) {
    res.writeHead(400);
    res.end("Bad path");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (pathname === "/blog") {
      await blogIndex({ method: req.method, url: req.url, query: {} }, vercelRes(res));
      return;
    }

    const postMatch = pathname.match(/^\/blog\/([^/]+)$/);
    if (postMatch) {
      await blogPost(
        { method: req.method, url: req.url, query: { slug: postMatch[1] } },
        vercelRes(res),
      );
      return;
    }

    if (pathname === "/api/posts") {
      await postsApi(
        {
          method: req.method,
          url: req.url,
          query: Object.fromEntries(url.searchParams.entries()),
        },
        vercelRes(res),
      );
      return;
    }

    serveStatic(req, res, pathname === "/" ? "/index.html" : pathname);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(String(err && err.message ? err.message : err));
    }
  }
});

server.listen(PORT, () => {
  console.log(`Styliqa local: http://localhost:${PORT}`);
  console.log(`Blog list:     http://localhost:${PORT}/blog`);
});
