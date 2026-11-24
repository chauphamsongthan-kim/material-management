import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

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

    res.writeHead(200, {
      'Content-Type': contentType,
    });

    res.end(content);
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
