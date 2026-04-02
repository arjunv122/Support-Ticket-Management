const express = require('express');
const router = express.Router();
const { register, login, getAllAgents, getProfile, changePassword, getAllCustomers } = require('../Controller/authController');

router.post('/register', register);
router.post('/login', login);

// Protected routes
const { protect, requireAgent } = require('../Middleware/authMiddleware');
router.get('/agents',          protect, requireAgent, getAllAgents);
router.get('/customers',       protect, requireAgent, getAllCustomers);
router.get('/me',              protect, getProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;

