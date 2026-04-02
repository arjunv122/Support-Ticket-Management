const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const { getMyNotifications, markAsRead, markAllAsRead } = require('../Controller/notificationController');

router.get('/my-notifications', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);

module.exports = router;
