const Ticket = require('../Models/ticketModel');
const User = require('../Models/userModel');

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Customer only)
const createTicket = async (req, res) => {
    try {
        const { title, description } = req.body;

        // Validation
        if (!title || !description) {
            return res.status(400).json({ message: 'Please provide title and description' });
        }

        // Get first available agent to auto-assign
        const agent = await User.findOne({ role: 'AGENT' });

        const ticket = await Ticket.create({
            title,
            description,
            customerId: req.user._id,
            assignedAgentId: agent ? agent._id : null
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get customer's own tickets
// @route   GET /api/tickets/my-tickets
// @access  Private (Customer only)
const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ customerId: req.user._id })
            .populate('assignedAgentId', 'name email')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get tickets assigned to agent
// @route   GET /api/tickets/assigned
// @access  Private (Agent only)
const getAssignedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ assignedAgentId: req.user._id })
            .populate('customerId', 'name email')
            .populate('assignedAgentId', 'name email')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private (Agent only)
const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Validation
        if (!status) {
            return res.status(400).json({ message: 'Please provide status' });
        }

        const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if ticket is assigned to this agent
        if (ticket.assignedAgentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this ticket' });
        }

        ticket.status = status.toUpperCase();
        await ticket.save();

        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Reassign ticket to another agent
// @route   PUT /api/tickets/:id/reassign
// @access  Private (Agent only)
const reassignTicket = async (req, res) => {
    try {
        const { newAgentId } = req.body;

        // Validation
        if (!newAgentId) {
            return res.status(400).json({ message: 'Please provide new agent ID' });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if ticket is assigned to this agent
        if (ticket.assignedAgentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reassign this ticket' });
        }

        // CRITICAL: Check reassignment limit
        if (ticket.reassignmentCount >= 1) {
            return res.status(400).json({
                message: 'Ticket reassignment limit reached. A ticket can only be reassigned once.',
                reassignmentCount: ticket.reassignmentCount
            });
        }

        // Verify new agent exists and has AGENT role
        const newAgent = await User.findById(newAgentId);
        if (!newAgent || newAgent.role !== 'AGENT') {
            return res.status(400).json({ message: 'Invalid agent ID' });
        }

        // Cannot reassign to self
        if (newAgentId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot reassign ticket to yourself' });
        }

        // Update ticket with reassignment
        ticket.assignedAgentId = newAgentId;
        ticket.reassignmentCount += 1;
        ticket.reassignmentHistory.push({
            fromAgentId: req.user._id,
            toAgentId: newAgentId,
            reassignedAt: new Date()
        });

        await ticket.save();

        const updatedTicket = await Ticket.findById(ticket._id)
            .populate('customerId', 'name email')
            .populate('assignedAgentId', 'name email')
            .populate('reassignmentHistory.fromAgentId', 'name email')
            .populate('reassignmentHistory.toAgentId', 'name email');

        res.json({
            message: 'Ticket reassigned successfully',
            ticket: updatedTicket,
            reassignmentCount: updatedTicket.reassignmentCount,
            canReassignAgain: updatedTicket.reassignmentCount < 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all tickets (for agents to see all tickets)
// @route   GET /api/tickets/all
// @access  Private (Agent only)
const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .populate('customerId', 'name email')
            .populate('assignedAgentId', 'name email')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getAssignedTickets,
    updateTicketStatus,
    reassignTicket,
    getAllTickets
};
