// TaskMaster Pro - Task Management System

class TaskManager {
    constructor() {
        this.tasks = [];
        this.projects = [];
        this.categories = ['Personal', 'Work', 'Shopping', 'Health', 'Learning'];
        this.priorities = ['low', 'medium', 'high', 'urgent'];
        this.statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
        this.listeners = [];
        
        this.loadData();
    }

    // Event System
    addEventListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Task CRUD Operations
    createTask(taskData) {
        const task = {
            id: this.generateId(),
            title: taskData.title || 'Untitled Task',
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'pending',
            category: taskData.category || 'Personal',
            projectId: taskData.projectId || null,
            dueDate: taskData.dueDate || null,
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: taskData.completedAt || null,
            tags: taskData.tags || [],
            subtasks: taskData.subtasks || [],
            attachments: taskData.attachments || [],
            estimatedTime: taskData.estimatedTime || null,
            actualTime: taskData.actualTime || null,
            reminder: taskData.reminder || null,
            notes: taskData.notes || '',
            position: taskData.position || this.tasks.length
        };

        this.tasks.push(task);
        this.saveData();
        this.emit('taskCreated', task);
        return task;
    }

    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        const oldTask = { ...this.tasks[taskIndex] };
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Set completion date if status changed to completed
        if (updates.status === 'completed' && oldTask.status !== 'completed') {
            this.tasks[taskIndex].completedAt = new Date().toISOString();
        } else if (updates.status !== 'completed') {
            this.tasks[taskIndex].completedAt = null;
        }

        this.saveData();
        this.emit('taskUpdated', { task: this.tasks[taskIndex], oldTask });
        return this.tasks[taskIndex];
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        const deletedTask = this.tasks.splice(taskIndex, 1)[0];
        this.saveData();
        this.emit('taskDeleted', deletedTask);
        return deletedTask;
    }

    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }

    getAllTasks() {
        return [...this.tasks];
    }

    // Task Filtering and Searching
    filterTasks(filters = {}) {
        let filteredTasks = [...this.tasks];

        if (filters.status) {
            filteredTasks = filteredTasks.filter(task => task.status === filters.status);
        }

        if (filters.priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
        }

        if (filters.category) {
            filteredTasks = filteredTasks.filter(task => task.category === filters.category);
        }

        if (filters.projectId) {
            filteredTasks = filteredTasks.filter(task => task.projectId === filters.projectId);
        }

        if (filters.dueDate) {
            const filterDate = new Date(filters.dueDate);
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                return taskDate.toDateString() === filterDate.toDateString();
            });
        }

        if (filters.overdue) {
            const now = new Date();
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate || task.status === 'completed') return false;
                return new Date(task.dueDate) < now;
            });
        }

        if (filters.today) {
            const today = new Date();
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                return taskDate.toDateString() === today.toDateString();
            });
        }

        if (filters.upcoming) {
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate || task.status === 'completed') return false;
                const taskDate = new Date(task.dueDate);
                return taskDate > now && taskDate <= nextWeek;
            });
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm) ||
                task.notes.toLowerCase().includes(searchTerm) ||
                task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        return filteredTasks;
    }

    // Task Statistics
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.status === 'completed').length;
        const pending = this.tasks.filter(task => task.status === 'pending').length;
        const inProgress = this.tasks.filter(task => task.status === 'in-progress').length;
        const overdue = this.filterTasks({ overdue: true }).length;
        const today = this.filterTasks({ today: true }).length;
        const upcoming = this.filterTasks({ upcoming: true }).length;

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Priority distribution
        const priorityStats = this.priorities.reduce((acc, priority) => {
            acc[priority] = this.tasks.filter(task => task.priority === priority).length;
            return acc;
        }, {});

        // Category distribution
        const categoryStats = this.categories.reduce((acc, category) => {
            acc[category] = this.tasks.filter(task => task.category === category).length;
            return acc;
        }, {});

        // Weekly completion trend
        const weeklyStats = this.getWeeklyCompletionStats();

        return {
            total,
            completed,
            pending,
            inProgress,
            overdue,
            today,
            upcoming,
            completionRate,
            priorityStats,
            categoryStats,
            weeklyStats
        };
    }

    getWeeklyCompletionStats() {
        const now = new Date();
        const weeklyStats = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateString = date.toDateString();
            
            const completedTasks = this.tasks.filter(task => {
                if (!task.completedAt) return false;
                const completedDate = new Date(task.completedAt);
                return completedDate.toDateString() === dateString;
            }).length;

            weeklyStats.push({
                date: dateString,
                completed: completedTasks,
                day: date.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }

        return weeklyStats;
    }

    // Subtask Management
    addSubtask(taskId, subtaskData) {
        const task = this.getTask(taskId);
        if (!task) throw new Error('Task not found');

        const subtask = {
            id: this.generateId(),
            title: subtaskData.title,
            completed: false,
            createdAt: new Date().toISOString()
        };

        task.subtasks.push(subtask);
        this.updateTask(taskId, { subtasks: task.subtasks });
        return subtask;
    }

    updateSubtask(taskId, subtaskId, updates) {
        const task = this.getTask(taskId);
        if (!task) throw new Error('Task not found');

        const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
        if (subtaskIndex === -1) throw new Error('Subtask not found');

        task.subtasks[subtaskIndex] = { ...task.subtasks[subtaskIndex], ...updates };
        this.updateTask(taskId, { subtasks: task.subtasks });
        return task.subtasks[subtaskIndex];
    }

    deleteSubtask(taskId, subtaskId) {
        const task = this.getTask(taskId);
        if (!task) throw new Error('Task not found');

        const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
        if (subtaskIndex === -1) throw new Error('Subtask not found');

        const deletedSubtask = task.subtasks.splice(subtaskIndex, 1)[0];
        this.updateTask(taskId, { subtasks: task.subtasks });
        return deletedSubtask;
    }

    // Utility Methods
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Data Persistence
    saveData() {
        try {
            localStorage.setItem('taskmaster_tasks', JSON.stringify(this.tasks));
            localStorage.setItem('taskmaster_projects', JSON.stringify(this.projects));
            localStorage.setItem('taskmaster_categories', JSON.stringify(this.categories));
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    loadData() {
        try {
            const tasksData = localStorage.getItem('taskmaster_tasks');
            const projectsData = localStorage.getItem('taskmaster_projects');
            const categoriesData = localStorage.getItem('taskmaster_categories');

            if (tasksData) {
                this.tasks = JSON.parse(tasksData);
            }

            if (projectsData) {
                this.projects = JSON.parse(projectsData);
            }

            if (categoriesData) {
                this.categories = JSON.parse(categoriesData);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.tasks = [];
            this.projects = [];
        }
    }

    // Import/Export
    exportData() {
        return {
            tasks: this.tasks,
            projects: this.projects,
            categories: this.categories,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    importData(data) {
        try {
            if (data.tasks) this.tasks = data.tasks;
            if (data.projects) this.projects = data.projects;
            if (data.categories) this.categories = data.categories;
            
            this.saveData();
            this.emit('dataImported', data);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    clearAllData() {
        this.tasks = [];
        this.projects = [];
        this.categories = ['Personal', 'Work', 'Shopping', 'Health', 'Learning'];
        this.saveData();
        this.emit('dataCleared');
    }
}

// Export for use in other modules
window.TaskManager = TaskManager;
