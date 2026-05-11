const fs = require("fs");
const http = require("http");
const path = require("path");

const port = Number(process.env.PORT || 5173);
const apiTarget = new URL(process.env.API_TARGET || "http://127.0.0.1:5000");
const root = path.join(__dirname, "dist");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.url.startsWith("/api")) {
    const proxyReq = http.request(
      {
        hostname: apiTarget.hostname,
        port: apiTarget.port || 80,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: apiTarget.host,
          origin: `http://127.0.0.1:${port}`
        }
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (error) => {
      console.error("API proxy error", error.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "API proxy failed", detail: error.message }));
    });

    req.pipe(proxyReq);
    return;
  }

  const cleanUrl = decodeURIComponent(req.url.split("?")[0]);
  const requested = cleanUrl === "/" ? "/index.html" : cleanUrl;
  const filePath = path.normalize(path.join(root, requested));
  const safePath = filePath.startsWith(root) ? filePath : path.join(root, "index.html");
  const finalPath = fs.existsSync(safePath) && fs.statSync(safePath).isFile()
    ? safePath
    : path.join(root, "index.html");

  res.setHeader("Content-Type", types[path.extname(finalPath)] || "application/octet-stream");
  fs.createReadStream(finalPath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`FSAMS frontend preview running at http://127.0.0.1:${port}`);
});
