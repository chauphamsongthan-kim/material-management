import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
const port = process.env.PORT || 4173;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Chỉ nén các loại file dạng chữ (ảnh đã được nén sẵn)
const compressibleTypes = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.svg',
  '.webmanifest',
]);

// Bản nén của từng file được giữ trong bộ nhớ (thư mục dist rất nhỏ),
// nên mỗi file chỉ phải nén một lần cho đến khi server khởi động lại.
const compressedCache = new Map();

function pickEncoding(acceptEncoding = '') {
  if (/\bbr\b/.test(acceptEncoding)) return 'br';
  if (/\bgzip\b/.test(acceptEncoding)) return 'gzip';
  return null;
}

function compress(content, encoding) {
  return encoding === 'br'
    ? zlib.brotliCompressSync(content, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
      })
    : zlib.gzipSync(content, { level: 9 });
}

// File trong /assets/ có tên kèm mã băm (Vite) nên cache được rất lâu.
// index.html và sw.js phải luôn kiểm tra lại để người dùng nhận bản mới.
function getCacheControl(urlPath, filePath) {
  const name = path.basename(filePath);

  if (name === 'index.html' || name === 'sw.js') {
    return 'no-cache';
  }

  if (urlPath.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }

  return 'public, max-age=86400';
}

function handleRequest(req, res) {
  let urlPath;

  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    // Địa chỉ sai mã hóa (ví dụ /%): trả 400 thay vì làm sập server
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  // Chặn ký tự NUL (dùng để lách kiểm tra đường dẫn)
  if (urlPath.includes('\0')) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (urlPath === '/') {
    urlPath = '/index.html';
  }

  let filePath = path.join(distPath, urlPath);

  if (filePath !== distPath && !filePath.startsWith(distPath + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': getCacheControl(urlPath, filePath),
      'X-Content-Type-Options': 'nosniff',
    };

    let body = content;

    if (compressibleTypes.has(ext)) {
      headers.Vary = 'Accept-Encoding';

      const encoding = pickEncoding(req.headers['accept-encoding']);

      if (encoding) {
        const cacheKey = `${filePath}:${encoding}`;
        let compressed = compressedCache.get(cacheKey);

        if (!compressed) {
          compressed = compress(content, encoding);
          compressedCache.set(cacheKey, compressed);
        }

        body = compressed;
        headers['Content-Encoding'] = encoding;
      }
    }

    headers['Content-Length'] = body.length;

    res.writeHead(200, headers);
    res.end(body);
  });
}

const server = http.createServer((req, res) => {
  // Bất kỳ lỗi bất ngờ nào cũng chỉ làm hỏng một request, không làm dừng server
  try {
    handleRequest(req, res);
  } catch (error) {
    console.error('Lỗi xử lý request:', error);

    if (!res.headersSent) {
      res.writeHead(500);
    }

    res.end('Internal Server Error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend đang chạy tại port ${port}`);
});
