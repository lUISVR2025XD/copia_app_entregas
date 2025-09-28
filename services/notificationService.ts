import { Notification } from '../types';

type NotificationListener = (notification: Notification) => void;

class NotificationService {
    private listeners: Set<NotificationListener> = new Set();

    subscribe(listener: NotificationListener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    sendNotification(notification: Notification) {
        console.log("Sending notification:", notification);
        this.listeners.forEach(listener => listener(notification));
    }
}

// Export a singleton instance
export const notificationService = new NotificationService();
