const express = require('express');
const router = express.Router();
const {
    createTicket,
    getMyTickets,
    getAssignedTickets,
    updateTicketStatus,
    reassignTicket,
    getAllTickets,
    addComment,
    getTicketEvents,
    updateTags,
    togglePin
} = require('../Controller/ticketController');
const { protect, requireCustomer, requireAgent } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/uploadMiddleware');

// Customer routes
router.post('/', protect, requireCustomer, upload.array('attachments', 5), createTicket);
router.get('/my-tickets', protect, requireCustomer, getMyTickets);

// Shared: Comments (both customer & agent can reply)
router.post('/:id/comments', protect, addComment);

// Agent routes
router.get('/assigned', protect, requireAgent, getAssignedTickets);
router.get('/all', protect, requireAgent, getAllTickets);
router.get('/:id/events', protect, getTicketEvents);
router.put('/:id/status', protect, requireAgent, updateTicketStatus);
router.put('/:id/reassign', protect, requireAgent, reassignTicket);
router.put('/:id/tags', protect, requireAgent, updateTags);
router.put('/:id/pin', protect, togglePin);

module.exports = router;
