const Notification = require('../Models/Notification');

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
            
        // Count unread
        const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Marked read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
        res.json({ message: 'All marked read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
