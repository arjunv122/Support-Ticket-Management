const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
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
        fromAgentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        toAgentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reassignedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
