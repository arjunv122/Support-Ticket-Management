const mongoose = require('mongoose');

// Generate a unique human-readable ticket reference ID like TKT-A3X92K
const generateTicketId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
    let id = 'TKT-';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

const commentSchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['CUSTOMER', 'AGENT'], required: true },
    text: { type: String, required: true, trim: true },
    isInternal: { type: Boolean, default: false } // agent-only internal note
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true,
        default: generateTicketId
    },
    title: {
        type: String,
        required: [true, 'Please provide a ticket title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a ticket description'],
        trim: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'OPEN',
        uppercase: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM',
        uppercase: true
    },
    category: {
        type: String,
        enum: ['TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'GENERAL'],
        default: 'GENERAL',
        uppercase: true
    },
    attachments: [{
        filename: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],
    comments: [commentSchema],
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reassignmentCount: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    reassignmentHistory: [{
        fromAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        toAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reassignedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
