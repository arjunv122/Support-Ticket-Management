const mongoose = require('mongoose');

const ticketEventSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // The user (agent or customer) who triggered the event
    },
    action: {
        type: String,
        enum: ['CREATED', 'STATUS_CHANGED', 'REASSIGNED', 'PRIORITY_CHANGED', 'COMMENT_ADDED'],
        required: true
    },
    systemGenerated: {
        type: Boolean,
        default: false // Set to true if a macro or auto-routing engine triggered it
    },
    oldValue: {
        type: String,
        default: null
    },
    newValue: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Index for fast querying by ticket
ticketEventSchema.index({ ticket: 1, createdAt: -1 });

module.exports = mongoose.model('TicketEvent', ticketEventSchema);
