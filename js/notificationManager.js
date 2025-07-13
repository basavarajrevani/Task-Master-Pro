// TaskMaster Pro - Notification Management System

class NotificationManager {
    constructor(taskManager, ui) {
        this.taskManager = taskManager;
        this.ui = ui;
        this.notifications = [];
        this.lastCheck = Date.now();
        
        this.init();
    }

    init() {
        // Load existing notifications from storage
        this.loadNotifications();
        
        // Listen for task events
        this.taskManager.addEventListener('taskCreated', (task) => {
            this.onTaskCreated(task);
        });

        this.taskManager.addEventListener('taskUpdated', (data) => {
            this.onTaskUpdated(data.task, data.oldTask);
        });

        this.taskManager.addEventListener('taskDeleted', (task) => {
            this.onTaskDeleted(task);
        });

        // Update UI badge initially
        this.updateNotificationBadge();
    }

    checkAndUpdateNotifications() {
        const now = new Date();
        const tasks = this.taskManager.getAllTasks();
        let newNotifications = [];

        tasks.forEach(task => {
            if (task.status === 'completed' || !task.dueDate) return;

            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate.getTime() - now.getTime();
            const minutesDiff = timeDiff / (1000 * 60);
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

            // Check for various notification triggers
            const notifications = this.checkTaskNotifications(task, now, minutesDiff, hoursDiff, daysDiff);
            newNotifications.push(...notifications);
        });

        // Add new notifications
        newNotifications.forEach(notification => {
            this.addNotification(notification);
        });

        // Clean up old notifications (older than 24 hours)
        this.cleanupOldNotifications();

        // Update UI
        this.updateNotificationBadge();
        this.saveNotifications();
    }

    checkTaskNotifications(task, now, minutesDiff, hoursDiff, daysDiff) {
        const notifications = [];
        const taskId = task.id;

        // Due in 15 minutes
        if (minutesDiff > 0 && minutesDiff <= 15 && !this.hasNotification(taskId, 'due_15min')) {
            notifications.push({
                id: `${taskId}_due_15min`,
                taskId: taskId,
                type: 'due_15min',
                title: 'Task Due Soon!',
                message: `"${task.title}" is due in ${Math.round(minutesDiff)} minutes`,
                timestamp: now.toISOString(),
                priority: 'high',
                icon: 'clock',
                color: '#f59e0b'
            });
        }

        // Due in 1 hour
        if (hoursDiff > 0 && hoursDiff <= 1 && !this.hasNotification(taskId, 'due_1hour')) {
            notifications.push({
                id: `${taskId}_due_1hour`,
                taskId: taskId,
                type: 'due_1hour',
                title: 'Task Due in 1 Hour',
                message: `"${task.title}" is due in about 1 hour`,
                timestamp: now.toISOString(),
                priority: 'medium',
                icon: 'clock',
                color: '#3b82f6'
            });
        }

        // Due tomorrow
        if (daysDiff > 0 && daysDiff <= 1 && !this.hasNotification(taskId, 'due_tomorrow')) {
            notifications.push({
                id: `${taskId}_due_tomorrow`,
                taskId: taskId,
                type: 'due_tomorrow',
                title: 'Task Due Tomorrow',
                message: `"${task.title}" is due tomorrow`,
                timestamp: now.toISOString(),
                priority: 'low',
                icon: 'calendar',
                color: '#10b981'
            });
        }

        // Overdue
        if (minutesDiff < 0 && !this.hasNotification(taskId, 'overdue')) {
            const overdueDays = Math.abs(Math.floor(daysDiff));
            const overdueHours = Math.abs(Math.floor(hoursDiff % 24));
            
            let overdueText = '';
            if (overdueDays > 0) {
                overdueText = `${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
            } else if (overdueHours > 0) {
                overdueText = `${overdueHours} hour${overdueHours > 1 ? 's' : ''}`;
            } else {
                overdueText = `${Math.abs(Math.floor(minutesDiff))} minute${Math.abs(Math.floor(minutesDiff)) > 1 ? 's' : ''}`;
            }

            notifications.push({
                id: `${taskId}_overdue`,
                taskId: taskId,
                type: 'overdue',
                title: 'Task Overdue!',
                message: `"${task.title}" is overdue by ${overdueText}`,
                timestamp: now.toISOString(),
                priority: 'urgent',
                icon: 'exclamation-triangle',
                color: '#ef4444'
            });
        }

        return notifications;
    }

    onTaskCreated(task) {
        if (task.dueDate) {
            this.addNotification({
                id: `${task.id}_created`,
                taskId: task.id,
                type: 'created',
                title: 'New Task Created',
                message: `"${task.title}" has been created${task.dueDate ? ` with due date ${DateUtils.formatDate(task.dueDate)}` : ''}`,
                timestamp: new Date().toISOString(),
                priority: 'info',
                icon: 'plus-circle',
                color: '#10b981'
            });
        }
    }

    onTaskUpdated(task, oldTask) {
        // Task completed
        if (task.status === 'completed' && oldTask.status !== 'completed') {
            this.addNotification({
                id: `${task.id}_completed`,
                taskId: task.id,
                type: 'completed',
                title: 'Task Completed! 🎉',
                message: `"${task.title}" has been marked as completed`,
                timestamp: new Date().toISOString(),
                priority: 'success',
                icon: 'check-circle',
                color: '#10b981'
            });

            // Remove deadline notifications for completed task
            this.removeTaskNotifications(task.id, ['due_15min', 'due_1hour', 'due_tomorrow', 'overdue']);
        }

        // Due date changed
        if (task.dueDate !== oldTask.dueDate && task.dueDate) {
            this.addNotification({
                id: `${task.id}_due_changed`,
                taskId: task.id,
                type: 'due_changed',
                title: 'Due Date Updated',
                message: `"${task.title}" due date changed to ${DateUtils.formatDate(task.dueDate)}`,
                timestamp: new Date().toISOString(),
                priority: 'info',
                icon: 'calendar',
                color: '#3b82f6'
            });

            // Remove old deadline notifications
            this.removeTaskNotifications(task.id, ['due_15min', 'due_1hour', 'due_tomorrow', 'overdue']);
        }

        // Priority changed to urgent
        if (task.priority === 'urgent' && oldTask.priority !== 'urgent') {
            this.addNotification({
                id: `${task.id}_urgent`,
                taskId: task.id,
                type: 'urgent',
                title: 'High Priority Task',
                message: `"${task.title}" has been marked as urgent priority`,
                timestamp: new Date().toISOString(),
                priority: 'high',
                icon: 'fire',
                color: '#ef4444'
            });
        }
    }

    onTaskDeleted(task) {
        // Remove all notifications for deleted task
        this.notifications = this.notifications.filter(n => n.taskId !== task.id);
        this.updateNotificationBadge();
        this.saveNotifications();
    }

    addNotification(notification) {
        // Check if notification already exists
        if (this.notifications.find(n => n.id === notification.id)) {
            return;
        }

        this.notifications.unshift(notification);

        // Show desktop notification if enabled
        this.showDesktopNotification(notification);

        // Show in-app notification
        this.showInAppNotification(notification);

        // Limit to 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.updateNotificationBadge();
        this.saveNotifications();
    }

    showDesktopNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const desktopNotification = new Notification(notification.title, {
                body: notification.message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✅</text></svg>',
                tag: notification.id,
                requireInteraction: notification.priority === 'urgent'
            });

            desktopNotification.onclick = () => {
                window.focus();
                if (notification.taskId) {
                    // Open task details or navigate to task
                    const task = this.taskManager.getTask(notification.taskId);
                    if (task && this.ui) {
                        this.ui.editTask(notification.taskId);
                    }
                }
                desktopNotification.close();
            };

            // Auto close after 5 seconds for non-urgent notifications
            if (notification.priority !== 'urgent') {
                setTimeout(() => {
                    desktopNotification.close();
                }, 5000);
            }
        }
    }

    showInAppNotification(notification) {
        const type = this.getNotificationDisplayType(notification.priority);
        NotificationUtils.show(notification.message, type, 5000);
    }

    getNotificationDisplayType(priority) {
        switch (priority) {
            case 'urgent': return 'error';
            case 'high': return 'warning';
            case 'success': return 'success';
            case 'info': return 'info';
            default: return 'info';
        }
    }

    hasNotification(taskId, type) {
        return this.notifications.some(n => n.taskId === taskId && n.type === type);
    }

    removeTaskNotifications(taskId, types) {
        this.notifications = this.notifications.filter(n => 
            !(n.taskId === taskId && types.includes(n.type))
        );
    }

    cleanupOldNotifications() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.notifications = this.notifications.filter(n => 
            new Date(n.timestamp) > oneDayAgo
        );
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const unreadCount = this.getUnreadCount();
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    getUnreadCount() {
        // Count notifications from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.notifications.filter(n => 
            new Date(n.timestamp) > oneDayAgo
        ).length;
    }

    getNotifications() {
        return [...this.notifications];
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationBadge();
            this.saveNotifications();
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationBadge();
        this.saveNotifications();
    }

    saveNotifications() {
        try {
            localStorage.setItem('taskmaster_notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    }

    loadNotifications() {
        try {
            const saved = localStorage.getItem('taskmaster_notifications');
            if (saved) {
                this.notifications = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.notifications = [];
        }
    }
}

// Export for use in other modules
window.NotificationManager = NotificationManager;
