const express = require('express');
const router = express.Router();
const { register, login } = require('../Controller/authController');

router.post('/register', register);
router.post('/login', login);

// Protected routes
const { protect, requireAgent } = require('../Middleware/authMiddleware');
const { getAllAgents } = require('../Controller/authController');
router.get('/agents', protect, requireAgent, getAllAgents);

module.exports = router;
