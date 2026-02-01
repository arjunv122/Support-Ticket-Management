const express = require('express');
const router = express.Router();
const {
    createTicket,
    getMyTickets,
    getAssignedTickets,
    updateTicketStatus,
    reassignTicket,
    getAllTickets
} = require('../Controller/ticketController');
const { protect, requireCustomer, requireAgent } = require('../Middleware/authMiddleware');

// Customer routes
router.post('/', protect, requireCustomer, createTicket);
router.get('/my-tickets', protect, requireCustomer, getMyTickets);

// Agent routes
router.get('/assigned', protect, requireAgent, getAssignedTickets);
router.get('/all', protect, requireAgent, getAllTickets);
router.put('/:id/status', protect, requireAgent, updateTicketStatus);
router.put('/:id/reassign', protect, requireAgent, reassignTicket);

module.exports = router;
