const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { randomUUID } = require('crypto');

// Local: backend/uploads
// Railway: đặt UPLOAD_DIR=/data/uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '../../uploads');

async function saveDeviceImage(file) {
  if (!file) {
    return null;
  }

  // Kiểm tra nội dung ảnh thực tế, không chỉ dựa vào MIME type
  const metadata = await sharp(file.buffer).metadata();

  const allowedFormats = ['jpeg', 'png', 'webp'];

  if (!allowedFormats.includes(metadata.format)) {
    throw new Error('Tệp tải lên không phải ảnh JPG, PNG hoặc WebP hợp lệ.');
  }

  const filename = `${randomUUID()}.webp`;
  const outputPath = path.join(UPLOAD_DIR, filename);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(outputPath);

  return {
    filename,
    imageUrl: `/uploads/${filename}`,
    outputPath,
  };
}

async function deleteDeviceImage(imageUrl) {
  if (!imageUrl) {
    return;
  }

  const filename = path.basename(imageUrl);

  // Chỉ cho phép xóa file WebP trong thư mục ảnh thiết bị
  if (!filename.endsWith('.webp')) {
    return;
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

module.exports = {
  UPLOAD_DIR,
  saveDeviceImage,
  deleteDeviceImage,
};