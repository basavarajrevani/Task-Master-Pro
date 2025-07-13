// TaskMaster Pro - Main Application Entry Point

class TaskMasterApp {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.startTime = Date.now();
        
        // Initialize managers
        this.storageManager = new StorageManager();
        this.taskManager = new TaskManager();
        this.projectManager = new ProjectManager(this.taskManager);
        this.ui = new UIManager(this.taskManager, this.projectManager, this.storageManager);
        
        this.init();
    }

    async init() {
        try {
            console.log('TaskMaster Pro: Starting initialization...');

            // Check if user came from landing page
            this.checkLandingPageVisit();

            // Show loading screen
            this.showLoadingScreen();

            // Initialize data (only clear sample data on first run)
            await this.initializeAppData();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize service worker for offline support
            await this.initServiceWorker();

            // Initialize notifications
            this.initNotifications();

            // Setup auto-save
            this.initAutoSave();

            // Hide loading screen and show app
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showApp();
                this.isInitialized = true;

                console.log('TaskMaster Pro: Initialization complete!');

                // Initialize the UI and load the default view
                this.initializeUI();



                // Show welcome message for new users
                this.showWelcomeMessage();
            }, 800);

        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application');
        }
    }

    checkLandingPageVisit() {
        // Check if user came directly to app.html without visiting landing page
        const hasVisitedLanding = sessionStorage.getItem('visited_landing');
        const referrer = document.referrer;

        // If user hasn't visited landing page and didn't come from our landing page
        if (!hasVisitedLanding && !referrer.includes('index.html') && !referrer.includes(window.location.origin)) {
            // Check if this is their first time (no existing data)
            const hasExistingData = localStorage.getItem('taskmaster_tasks') ||
                                  localStorage.getItem('taskmaster_projects') ||
                                  localStorage.getItem('taskmaster_sample_data_added');

            // If no existing data, show a welcome modal suggesting they visit the landing page
            if (!hasExistingData) {
                setTimeout(() => {
                    this.showLandingPageSuggestion();
                }, 1000);
            }
        }

        // Mark that they've now seen the app
        sessionStorage.setItem('visited_app', 'true');
    }

    showLandingPageSuggestion() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal landing-suggestion-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-rocket"></i> Welcome to TaskMaster Pro!</h2>
                    </div>
                    <div class="modal-body">
                        <p>It looks like you jumped straight into the app! 🎉</p>
                        <p>Would you like to see our landing page first to learn about all the amazing features TaskMaster Pro offers?</p>
                        <div style="margin: 1.5rem 0;">
                            <div style="display: flex; gap: 1rem; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem;">
                                <i class="fas fa-info-circle" style="color: var(--primary-color); font-size: 1.25rem;"></i>
                                <div>
                                    <strong>Pro Tip:</strong> The landing page showcases all features, testimonials, and gives you a complete overview of what you can accomplish!
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-play"></i> Start Using App
                        </button>
                        <button class="btn btn-primary" onclick="window.location.href='index.html'">
                            <i class="fas fa-home"></i> Visit Landing Page
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-remove after 10 seconds if no action
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('hidden');
        }
    }

    initializeUI() {
        // Ensure UI is properly initialized and load default view
        if (this.ui) {
            // Load the default view (dashboard)
            this.ui.showView('dashboard');

            // Update sidebar with current data
            this.ui.updateSidebar();

            console.log('TaskMaster Pro: UI initialized and dashboard loaded');

            // Add a fallback check to ensure dashboard loads
            setTimeout(() => {
                const mainContent = document.getElementById('mainContent');
                if (mainContent && (mainContent.innerHTML.includes('Loading') || mainContent.innerHTML.trim() === '')) {
                    console.log('TaskMaster Pro: Fallback dashboard load');
                    this.ui.showView('dashboard');
                }
            }, 1000);
        }
    }

    setupEventListeners() {
        // Task manager events
        this.taskManager.addEventListener('taskCreated', (task) => {
            this.ui.updateSidebar();
        });

        this.taskManager.addEventListener('taskUpdated', (data) => {
            this.ui.updateSidebar();
        });

        this.taskManager.addEventListener('taskDeleted', (task) => {
            this.ui.updateSidebar();
        });

        // Project manager events
        this.projectManager.addEventListener('projectCreated', (project) => {
            this.ui.updateSidebar();
        });

        this.projectManager.addEventListener('projectUpdated', (data) => {
            this.ui.updateSidebar();
        });

        this.projectManager.addEventListener('projectDeleted', (project) => {
            this.ui.updateSidebar();
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.taskManager.saveData();
            this.projectManager.saveData();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboardShortcuts(e);
        });

        // Online/offline status
        window.addEventListener('online', () => {
            NotificationUtils.show('You are back online', 'success');
        });

        window.addEventListener('offline', () => {
            NotificationUtils.show('You are offline. Changes will be saved locally.', 'warning');
        });
    }

    handleGlobalKeyboardShortcuts(e) {
        // Ctrl/Cmd + Shift + ?: Show help
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
            e.preventDefault();
            this.showKeyboardShortcuts();
        }

        // Ctrl/Cmd + ,: Open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            this.ui.openModal('settings');
        }
    }

    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl/Cmd + N', action: 'Create new task' },
            { key: 'Ctrl/Cmd + F', action: 'Focus search' },
            { key: 'Ctrl/Cmd + ,', action: 'Open settings' },
            { key: 'Ctrl/Cmd + Shift + ?', action: 'Show keyboard shortcuts' },
            { key: '1-6', action: 'Quick navigation between views' },
            { key: 'Esc', action: 'Close modals and dialogs' }
        ];

        const helpContent = shortcuts.map(s => 
            `<div class="shortcut-item">
                <kbd>${s.key}</kbd>
                <span>${s.action}</span>
            </div>`
        ).join('');

        NotificationUtils.show(`
            <div class="shortcuts-help">
                <h4>Keyboard Shortcuts</h4>
                ${helpContent}
            </div>
        `, 'info', 10000);
    }

    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    initNotifications() {
        const settings = this.storageManager.getSettings();

        // Always enable notifications for the bell icon
        settings.notifications = settings.notifications || {};
        settings.notifications.enabled = true;
        this.storageManager.saveSettings(settings);

        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    settings.notifications.permission = permission;
                    this.storageManager.saveSettings(settings);
                });
            }
        }

        // Initialize notification manager
        this.notificationManager = new NotificationManager(this.taskManager, this.ui);

        // Set up notification checking
        this.checkNotifications();
        setInterval(() => this.checkNotifications(), 30000); // Check every 30 seconds
    }

    checkNotifications() {
        if (this.notificationManager) {
            this.notificationManager.checkAndUpdateNotifications();
        }
    }

    showTaskNotification(task, message) {
        const settings = this.storageManager.getSettings();

        if (settings.notifications?.desktop) {
            new Notification(`TaskMaster Pro - ${message}`, {
                body: task.title,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✅</text></svg>',
                tag: `task-${task.id}`,
                requireInteraction: true
            });
        }

        NotificationUtils.show(`${message}: ${task.title}`, 'warning', 5000);
    }

    initAutoSave() {
        const settings = this.storageManager.getSettings();

        if (!settings.autoSave) return;

        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.taskManager.getAllTasks().length > 0) {
                this.taskManager.saveData();
                this.projectManager.saveData();
            }
        }, 30000);
    }

    async initializeAppData() {
        console.log('TaskMaster Pro: Initializing app data...');

        // Check if this is the first run
        const isFirstRun = !localStorage.getItem('taskmaster_initialized');

        if (isFirstRun) {
            console.log('TaskMaster Pro: First run detected, clearing any existing sample data...');

            // Clear all existing tasks and projects only on first run
            this.taskManager.clearAllData();
            this.projectManager.clearAllData();

            // Clear sample data flags
            localStorage.removeItem('taskmaster_sample_data_added');
            localStorage.removeItem('taskmaster_welcomed');

            // Clear any other sample-related data
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('sample') || key.includes('demo'))) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Mark as initialized
            localStorage.setItem('taskmaster_initialized', 'true');
            localStorage.setItem('taskmaster_init_date', new Date().toISOString());

            console.log('TaskMaster Pro: First run initialization completed');
        } else {
            console.log('TaskMaster Pro: Existing installation detected, preserving user data');
        }
    }

    // Method to manually reset the app (can be called from console)
    async resetApp() {
        if (confirm('Are you sure you want to reset TaskMaster Pro? This will delete ALL your tasks and data permanently!')) {
            console.log('TaskMaster Pro: Manual reset initiated...');

            // Clear all data
            this.taskManager.clearAllData();
            this.projectManager.clearAllData();

            // Clear all localStorage
            localStorage.clear();

            // Reload the page
            window.location.reload();
        }
    }

    cleanupSampleProjects() {
        // Remove sample projects if they exist
        const projects = this.projectManager.getAllProjects();
        const sampleProjectNames = ['Website Redesign', 'Marketing Campaign'];

        projects.forEach(project => {
            if (sampleProjectNames.includes(project.name)) {
                console.log('Removing sample project:', project.name);
                this.projectManager.deleteProject(project.id);
            }
        });
    }

    showWelcomeMessage() {
        const isFirstTime = !localStorage.getItem('taskmaster_welcomed');

        if (isFirstTime) {
            setTimeout(() => {
                NotificationUtils.show(
                    'Welcome to TaskMaster Pro! 🎉 Your productivity journey starts here.',
                    'success',
                    5000
                );
                localStorage.setItem('taskmaster_welcomed', 'true');
            }, 2000);
        }
    }

    showError(message) {
        NotificationUtils.show(message, 'error');
        console.error('App Error:', message);
    }

    // Public API
    getStats() {
        return {
            version: this.version,
            uptime: Date.now() - this.startTime,
            tasks: this.taskManager.getStats(),
            storage: this.storageManager.getStorageInfo()
        };
    }


}

// Global error handlers
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error || e.message || 'Unknown error');
    if (window.NotificationUtils) {
        NotificationUtils.show('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason || 'Unknown rejection');
    if (window.NotificationUtils) {
        NotificationUtils.show('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing TaskMaster Pro...');

    try {
        // Create app instance
        window.app = new TaskMasterApp();

        // Make managers globally available immediately after creation
        window.taskManager = window.app.taskManager;
        window.projectManager = window.app.projectManager;
        window.storageManager = window.app.storageManager;
        window.ui = window.app.ui;

        // Make reset function globally available
        window.resetApp = () => window.app.resetApp();

        console.log('TaskMaster Pro: Global objects initialized');
    } catch (error) {
        console.error('Failed to initialize TaskMaster Pro:', error);

        // Show error message to user
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Inter, sans-serif;">
                <h1 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Initialization Error</h1>
                <p style="color: #6b7280; margin-bottom: 2rem; text-align: center;">
                    TaskMaster Pro failed to initialize. Please refresh the page to try again.
                </p>
                <button onclick="window.location.reload()" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                    Refresh Page
                </button>
            </div>
        `;
    }
});

// Global helper functions for HTML event handlers
window.toggleTaskStatus = function(taskId) {
    if (!window.taskManager) return;

    const task = window.taskManager.getTask(taskId);
    if (task) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        window.taskManager.updateTask(taskId, { status: newStatus });

        if (window.ui) {
            window.ui.refreshCurrentView();
        }

        const message = newStatus === 'completed' ? 'Task completed!' : 'Task reopened';
        if (window.NotificationUtils) {
            window.NotificationUtils.show(message, 'success');
        }
    }
};

window.editTask = function(taskId) {
    if (window.ui) {
        window.ui.editTask(taskId);
    }
};

window.deleteTask = function(taskId) {
    if (window.ui) {
        window.ui.deleteTask(taskId);
    }
};

window.openTaskModal = function(taskData = null) {
    if (window.ui) {
        window.ui.openTaskModal(taskData);
    }
};

window.openProjectModal = function(projectData = null) {
    if (window.ui) {
        window.ui.openProjectModal(projectData);
    }
};

window.showView = function(viewName, options = {}) {
    if (window.ui) {
        window.ui.showView(viewName, options);
    }
};



// Export for debugging
window.TaskMasterApp = TaskMasterApp;
