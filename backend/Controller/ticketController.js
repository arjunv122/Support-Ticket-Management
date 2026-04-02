const Ticket = require('../Models/ticketModel');
const User = require('../Models/userModel');
const TicketEvent = require('../Models/TicketEvent');
const RoutingService = require('../Services/RoutingService');
const NotificationService = require('../Services/NotificationService'); // PHASE 6: UI/UX
const path = require('path');

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Customer only)
const createTicket = async (req, res) => {
    try {
        const { title, description, priority, category } = req.body;

        // Validation
        if (!title || !description) {
            return res.status(400).json({ message: 'Please provide title and description' });
        }

        // 🧠 Enterprise Auto-Routing Engine (Workload Balanced)
        const optimalAgentId = await RoutingService.getBestAgentForTicket(category);

        // Handle uploaded file attachments
        const attachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            url: `/uploads/${file.filename}`
        })) : [];

        const ticket = await Ticket.create({
            title,
            description,
            priority: priority || 'MEDIUM',
            category: category || 'GENERAL',
            attachments,
            customerId: req.user._id,
            assignedAgentId: optimalAgentId
        });

        await TicketEvent.create({
            ticket: ticket._id,
            user: req.user._id,
            action: 'CREATED'
        });

        // NOTIFY ASSIGNED AGENT
        if (optimalAgentId) {
            await NotificationService.sendNotification(optimalAgentId, `You have been assigned a new Ticket: ${title}`, 'ASSIGNMENT', ticket._id);
        }

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

        const oldStatus = ticket.status;
        ticket.status = status.toUpperCase();
        await ticket.save();

        if (oldStatus !== ticket.status) {
            await TicketEvent.create({
                ticket: ticket._id,
                user: req.user._id,
                action: 'STATUS_CHANGED',
                oldValue: oldStatus,
                newValue: ticket.status
            });
        }

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

        const oldAgentId = ticket.assignedAgentId;
        // Update ticket with reassignment
        ticket.assignedAgentId = newAgentId;
        ticket.reassignmentCount += 1;
        ticket.reassignmentHistory.push({
            fromAgentId: req.user._id,
            toAgentId: newAgentId,
            reassignedAt: new Date()
        });

        await ticket.save();

        await TicketEvent.create({
            ticket: ticket._id,
            user: req.user._id,
            action: 'REASSIGNED',
            oldValue: oldAgentId ? oldAgentId.toString() : 'None',
            newValue: newAgentId.toString()
        });

        // NOTIFY NEW AGENT
        await NotificationService.sendNotification(newAgentId, `Ticket ${ticket.ticketId || ticket._id} has been reassigned to you.`, 'ASSIGNMENT', ticket._id);

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

// @desc    Add a comment/reply to a ticket
// @route   POST /api/tickets/:id/comments
// @access  Private (Customer who owns ticket OR assigned Agent)
const addComment = async (req, res) => {
    try {
        const { text, isInternal } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Access control: only the customer who owns it or the assigned agent
        const isOwner = ticket.customerId.toString() === req.user._id.toString();
        const isAgent = req.user.role === 'AGENT';
        if (!isOwner && !isAgent) {
            return res.status(403).json({ message: 'Not authorized to comment on this ticket' });
        }

        // Customers cannot post internal notes
        const internal = isAgent && !!isInternal;

        ticket.comments.push({
            authorId: req.user._id,
            authorName: req.user.name,
            authorRole: req.user.role,
            text: text.trim(),
            isInternal: internal
        });

        await ticket.save();

        await TicketEvent.create({
            ticket: ticket._id,
            user: req.user._id,
            action: 'COMMENT_ADDED',
            newValue: internal ? '(Internal Note)' : 'Public Comment'
        });

        // NOTIFY COUNTERPARTY
        const notifyUserId = isOwner ? ticket.assignedAgentId : ticket.customerId;
        if(notifyUserId && !internal) {
            await NotificationService.sendNotification(notifyUserId, `New comment by ${req.user.name} on ${ticket.title}`, 'MENTION', ticket._id);
        }

        const updated = await Ticket.findById(ticket._id)
            .populate('customerId', 'name email')
            .populate('assignedAgentId', 'name email');

        res.status(201).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get audit trail events for a ticket
// @route   GET /api/tickets/:id/events
// @access  Private
const getTicketEvents = async (req, res) => {
    try {
        const events = await TicketEvent.find({ ticket: req.params.id })
            .populate('user', 'name role email')
            .sort({ createdAt: -1 });
        
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update ticket tags
// @route   PUT /api/tickets/:id/tags
// @access  Private (Agent only)
const updateTags = async (req, res) => {
    try {
        const { tags } = req.body;
        if (!Array.isArray(tags)) return res.status(400).json({ message: 'Tags must be an array' });

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.tags = tags;
        await ticket.save();

        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Toggle pin status for current user
// @route   PUT /api/tickets/:id/pin
// @access  Private
const togglePin = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const isPinned = ticket.pinnedBy.includes(req.user._id);
        if (isPinned) {
            ticket.pinnedBy = ticket.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
        } else {
            ticket.pinnedBy.push(req.user._id);
        }

        await ticket.save();
        res.json({ isPinned: !isPinned, ticket });
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
    getAllTickets,
    addComment,
    getTicketEvents,
    updateTags,
    togglePin
};

