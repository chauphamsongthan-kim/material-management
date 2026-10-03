const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // Tối đa 5 MB
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.'));
    }

    cb(null, true);
  },
});

module.exports = upload;