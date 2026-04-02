const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user receiving the notification
    message: { type: String, required: true },
    type: { type: String, enum: ['ASSIGNMENT', 'MENTION', 'SLA_BREACH', 'SYSTEM'], default: 'SYSTEM' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
