// TaskMaster Pro - Storage Management

class StorageManager {
    constructor() {
        this.storageKey = 'taskmaster_pro';
        this.settingsKey = 'taskmaster_settings';
        this.backupKey = 'taskmaster_backup';
    }

    // Settings Management
    getSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            defaultView: 'dashboard',
            autoSave: true,
            notifications: {
                enabled: true,
                desktop: true,
                sound: false,
                reminders: true
            },
            taskDefaults: {
                priority: 'medium',
                category: 'Personal',
                estimatedTime: null
            },
            ui: {
                sidebarCollapsed: false,
                taskViewMode: 'list',
                showCompletedTasks: true,
                compactMode: false
            },
            productivity: {
                dailyGoal: 5,
                workingHours: {
                    start: '09:00',
                    end: '17:00'
                },
                breakReminders: true
            }
        };
    }

    // Data Export/Import
    exportData() {
        try {
            const tasks = JSON.parse(localStorage.getItem('taskmaster_tasks') || '[]');
            const projects = JSON.parse(localStorage.getItem('taskmaster_projects') || '[]');
            const categories = JSON.parse(localStorage.getItem('taskmaster_categories') || '[]');
            const settings = this.getSettings();

            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                data: {
                    tasks,
                    projects,
                    categories,
                    settings
                }
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }

    importData(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            if (!importData.data) {
                throw new Error('Invalid data format');
            }

            // Backup current data before import
            this.createBackup();

            const { tasks, projects, categories, settings } = importData.data;

            if (tasks) {
                localStorage.setItem('taskmaster_tasks', JSON.stringify(tasks));
            }

            if (projects) {
                localStorage.setItem('taskmaster_projects', JSON.stringify(projects));
            }

            if (categories) {
                localStorage.setItem('taskmaster_categories', JSON.stringify(categories));
            }

            if (settings) {
                this.saveSettings(settings);
            }

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Backup Management
    createBackup() {
        try {
            const backupData = this.exportData();
            const backups = this.getBackups();
            
            const newBackup = {
                id: Date.now(),
                date: new Date().toISOString(),
                data: backupData
            };

            backups.push(newBackup);

            // Keep only last 5 backups
            if (backups.length > 5) {
                backups.splice(0, backups.length - 5);
            }

            localStorage.setItem(this.backupKey, JSON.stringify(backups));
            return newBackup.id;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return null;
        }
    }

    getBackups() {
        try {
            const backups = localStorage.getItem(this.backupKey);
            return backups ? JSON.parse(backups) : [];
        } catch (error) {
            console.error('Failed to load backups:', error);
            return [];
        }
    }

    restoreBackup(backupId) {
        try {
            const backups = this.getBackups();
            const backup = backups.find(b => b.id === backupId);
            
            if (!backup) {
                throw new Error('Backup not found');
            }

            return this.importData(backup.data);
        } catch (error) {
            console.error('Failed to restore backup:', error);
            return false;
        }
    }

    deleteBackup(backupId) {
        try {
            const backups = this.getBackups();
            const filteredBackups = backups.filter(b => b.id !== backupId);
            localStorage.setItem(this.backupKey, JSON.stringify(filteredBackups));
            return true;
        } catch (error) {
            console.error('Failed to delete backup:', error);
            return false;
        }
    }

    // Storage Information
    getStorageInfo() {
        try {
            let totalSize = 0;
            let itemCount = 0;

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('taskmaster_')) {
                    totalSize += localStorage[key].length;
                    itemCount++;
                }
            }

            const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
            const usagePercentage = Math.round((totalSize / maxSize) * 100);

            return {
                totalSize,
                itemCount,
                usagePercentage,
                maxSize,
                available: maxSize - totalSize
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return {
                totalSize: 0,
                itemCount: 0,
                usagePercentage: 0,
                maxSize: 0,
                available: 0
            };
        }
    }

    // Clear Data
    clearAllData() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('taskmaster_'));
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    // Data Validation
    validateData(data) {
        try {
            if (!data || typeof data !== 'object') {
                return { valid: false, error: 'Invalid data format' };
            }

            if (!data.version) {
                return { valid: false, error: 'Missing version information' };
            }

            if (!data.data) {
                return { valid: false, error: 'Missing data section' };
            }

            const { tasks, projects, categories } = data.data;

            // Validate tasks
            if (tasks && !Array.isArray(tasks)) {
                return { valid: false, error: 'Tasks must be an array' };
            }

            if (tasks) {
                for (let task of tasks) {
                    if (!task.id || !task.title) {
                        return { valid: false, error: 'Invalid task format' };
                    }
                }
            }

            // Validate projects
            if (projects && !Array.isArray(projects)) {
                return { valid: false, error: 'Projects must be an array' };
            }

            // Validate categories
            if (categories && !Array.isArray(categories)) {
                return { valid: false, error: 'Categories must be an array' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Migration
    migrateData(fromVersion, toVersion) {
        try {
            console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
            
            // Add migration logic here for future versions
            switch (fromVersion) {
                case '0.9.0':
                    // Migration logic for 0.9.0 to 1.0.0
                    break;
                default:
                    console.log('No migration needed');
            }

            return true;
        } catch (error) {
            console.error('Failed to migrate data:', error);
            return false;
        }
    }

    // Sync Status (for future cloud sync feature)
    getSyncStatus() {
        return {
            enabled: false,
            lastSync: null,
            pending: 0,
            conflicts: 0
        };
    }
}

// Utility Functions
function downloadFile(content, filename, contentType = 'application/json') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

// Export for use in other modules
window.StorageManager = StorageManager;
window.downloadFile = downloadFile;
window.readFile = readFile;
