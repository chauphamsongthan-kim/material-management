const express = require('express');
const router = express.Router();

const {
  login,
  changePassword,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', login);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authMiddleware,
  changePassword
);

module.exports = router;