const Notification = require('../Models/Notification');

class NotificationService {
    static async sendNotification(userId, message, type = 'SYSTEM', ticketId = null) {
        try {
            if (!userId) return;
            const notif = new Notification({ userId, message, type, ticketId });
            await notif.save();
        } catch (error) {
            console.error('Failed to dispatch notification:', error);
        }
    }
}

module.exports = NotificationService;
