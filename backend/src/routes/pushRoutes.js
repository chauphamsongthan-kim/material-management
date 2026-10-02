
const express = require('express');

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const {
  subscribeToPush,
  linkPushDevice,
  getPushStatus,
  unsubscribeFromPush,
} = require('../controllers/pushController');

router.post('/subscribe', authMiddleware, subscribeToPush);

router.post('/link', authMiddleware, linkPushDevice);

router.get('/status', authMiddleware, getPushStatus);

router.delete('/unsubscribe', authMiddleware, unsubscribeFromPush);

module.exports = router;