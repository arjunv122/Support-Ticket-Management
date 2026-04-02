const express = require('express');
const router = express.Router();
const { protect, requireAgent } = require('../Middleware/authMiddleware');
const orgController = require('../Controller/organizationController');

router.use(protect);
router.use(requireAgent);

router.route('/')
    .post(orgController.createOrganization)
    .get(orgController.getOrganizations);

router.route('/:id')
    .delete(orgController.deleteOrganization);

module.exports = router;
