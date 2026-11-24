const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { randomUUID } = require('crypto');

// Local: backend/uploads
// Railway: đặt UPLOAD_DIR=/data/uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '../../uploads');

// Giới hạn số điểm ảnh (rộng x cao) để một ảnh nhỏ nhưng khổ cực lớn
// không làm cạn RAM server. 100 triệu điểm ảnh ≈ ảnh 10000 x 10000.
const MAX_INPUT_PIXELS = 100 * 1000 * 1000;

// Lỗi do người dùng gửi ảnh hỏng / không hợp lệ -> trả 400 thay vì 500
function invalidImageError(message) {
  const error = new Error(message);
  error.code = 'INVALID_IMAGE';
  return error;
}

const INVALID_IMAGE_MESSAGE =
  'Tệp tải lên không phải ảnh JPG, PNG hoặc WebP hợp lệ.';

async function saveDeviceImage(file) {
  if (!file) {
    return null;
  }

  let output;

  try {
    // Kiểm tra nội dung ảnh thực tế, không chỉ dựa vào MIME type
    const metadata = await sharp(file.buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();

    const allowedFormats = ['jpeg', 'png', 'webp'];

    if (!allowedFormats.includes(metadata.format)) {
      throw invalidImageError(INVALID_IMAGE_MESSAGE);
    }

    if ((metadata.width || 0) * (metadata.height || 0) > MAX_INPUT_PIXELS) {
      throw invalidImageError('Ảnh có kích thước quá lớn. Vui lòng chọn ảnh nhỏ hơn.');
    }

    output = await sharp(file.buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    if (err.code === 'INVALID_IMAGE') {
      throw err;
    }

    // sharp không đọc/giải mã được tệp (ảnh hỏng, giả mạo...)
    console.error('Không xử lý được ảnh tải lên:', err.message);
    throw invalidImageError(INVALID_IMAGE_MESSAGE);
  }

  const filename = `${randomUUID()}.webp`;
  const outputPath = path.join(UPLOAD_DIR, filename);

  // Lỗi ghi đĩa vẫn là lỗi máy chủ thật sự (500)
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(outputPath, output);

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
