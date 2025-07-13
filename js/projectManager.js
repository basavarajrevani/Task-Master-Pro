// TaskMaster Pro - Project Management System

class ProjectManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.projects = [];
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

    // Project CRUD Operations
    createProject(projectData) {
        const project = {
            id: this.generateId(),
            name: projectData.name || 'Untitled Project',
            description: projectData.description || '',
            color: projectData.color || ColorUtils.getCategoryColor(projectData.name || 'Project'),
            status: projectData.status || 'active',
            priority: projectData.priority || 'medium',
            startDate: projectData.startDate || null,
            endDate: projectData.endDate || null,
            createdAt: projectData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: projectData.completedAt || null,
            tags: projectData.tags || [],
            teamMembers: projectData.teamMembers || [],
            progress: projectData.progress || 0,
            budget: projectData.budget || null,
            notes: projectData.notes || '',
            archived: projectData.archived || false
        };

        this.projects.push(project);
        this.saveData();
        this.emit('projectCreated', project);
        return project;
    }

    updateProject(projectId, updates) {
        const projectIndex = this.projects.findIndex(project => project.id === projectId);
        if (projectIndex === -1) {
            throw new Error('Project not found');
        }

        const oldProject = { ...this.projects[projectIndex] };
        this.projects[projectIndex] = {
            ...this.projects[projectIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Set completion date if status changed to completed
        if (updates.status === 'completed' && oldProject.status !== 'completed') {
            this.projects[projectIndex].completedAt = new Date().toISOString();
        } else if (updates.status !== 'completed') {
            this.projects[projectIndex].completedAt = null;
        }

        this.saveData();
        this.emit('projectUpdated', { project: this.projects[projectIndex], oldProject });
        return this.projects[projectIndex];
    }

    deleteProject(projectId) {
        const projectIndex = this.projects.findIndex(project => project.id === projectId);
        if (projectIndex === -1) {
            throw new Error('Project not found');
        }

        const deletedProject = this.projects.splice(projectIndex, 1)[0];
        
        // Remove project from all tasks
        if (this.taskManager) {
            const projectTasks = this.taskManager.filterTasks({ projectId });
            projectTasks.forEach(task => {
                this.taskManager.updateTask(task.id, { projectId: null });
            });
        }

        this.saveData();
        this.emit('projectDeleted', deletedProject);
        return deletedProject;
    }

    getProject(projectId) {
        return this.projects.find(project => project.id === projectId);
    }

    getAllProjects() {
        return [...this.projects];
    }

    getActiveProjects() {
        return this.projects.filter(project => !project.archived && project.status !== 'completed');
    }

    // Project Statistics
    getProjectStats(projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;

        if (!this.taskManager) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                inProgressTasks: 0,
                overdueTasks: 0,
                completionRate: 0,
                estimatedHours: 0,
                actualHours: 0
            };
        }

        const projectTasks = this.taskManager.filterTasks({ projectId });
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
        const pendingTasks = projectTasks.filter(task => task.status === 'pending').length;
        const inProgressTasks = projectTasks.filter(task => task.status === 'in-progress').length;
        const overdueTasks = projectTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
        ).length;

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const estimatedHours = projectTasks.reduce((total, task) => {
            return total + (task.estimatedTime || 0);
        }, 0);

        const actualHours = projectTasks.reduce((total, task) => {
            return total + (task.actualTime || 0);
        }, 0);

        // Update project progress
        if (project.progress !== completionRate) {
            this.updateProject(projectId, { progress: completionRate });
        }

        return {
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            estimatedHours,
            actualHours
        };
    }

    // Project Filtering
    filterProjects(filters = {}) {
        let filteredProjects = [...this.projects];

        if (filters.status) {
            filteredProjects = filteredProjects.filter(project => project.status === filters.status);
        }

        if (filters.priority) {
            filteredProjects = filteredProjects.filter(project => project.priority === filters.priority);
        }

        if (filters.archived !== undefined) {
            filteredProjects = filteredProjects.filter(project => project.archived === filters.archived);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredProjects = filteredProjects.filter(project => 
                project.name.toLowerCase().includes(searchTerm) ||
                project.description.toLowerCase().includes(searchTerm) ||
                project.notes.toLowerCase().includes(searchTerm) ||
                project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        if (filters.teamMember) {
            filteredProjects = filteredProjects.filter(project => 
                project.teamMembers.includes(filters.teamMember)
            );
        }

        return filteredProjects;
    }

    // Project Templates
    createFromTemplate(templateName, projectData = {}) {
        const templates = {
            'web-development': {
                name: 'Web Development Project',
                description: 'A complete web development project template',
                tasks: [
                    { title: 'Project Planning', priority: 'high', category: 'Planning' },
                    { title: 'UI/UX Design', priority: 'high', category: 'Design' },
                    { title: 'Frontend Development', priority: 'medium', category: 'Development' },
                    { title: 'Backend Development', priority: 'medium', category: 'Development' },
                    { title: 'Testing & QA', priority: 'high', category: 'Testing' },
                    { title: 'Deployment', priority: 'medium', category: 'Deployment' },
                    { title: 'Documentation', priority: 'low', category: 'Documentation' }
                ]
            },
            'marketing-campaign': {
                name: 'Marketing Campaign',
                description: 'A comprehensive marketing campaign template',
                tasks: [
                    { title: 'Market Research', priority: 'high', category: 'Research' },
                    { title: 'Target Audience Analysis', priority: 'high', category: 'Research' },
                    { title: 'Content Strategy', priority: 'medium', category: 'Strategy' },
                    { title: 'Creative Development', priority: 'medium', category: 'Creative' },
                    { title: 'Campaign Launch', priority: 'high', category: 'Execution' },
                    { title: 'Performance Monitoring', priority: 'medium', category: 'Analytics' },
                    { title: 'Optimization', priority: 'low', category: 'Optimization' }
                ]
            },
            'product-launch': {
                name: 'Product Launch',
                description: 'A complete product launch project template',
                tasks: [
                    { title: 'Product Development', priority: 'high', category: 'Development' },
                    { title: 'Market Validation', priority: 'high', category: 'Research' },
                    { title: 'Go-to-Market Strategy', priority: 'high', category: 'Strategy' },
                    { title: 'Marketing Materials', priority: 'medium', category: 'Marketing' },
                    { title: 'Sales Training', priority: 'medium', category: 'Training' },
                    { title: 'Launch Event', priority: 'high', category: 'Event' },
                    { title: 'Post-Launch Analysis', priority: 'low', category: 'Analytics' }
                ]
            }
        };

        const template = templates[templateName];
        if (!template) {
            throw new Error('Template not found');
        }

        // Create project
        const project = this.createProject({
            ...template,
            ...projectData,
            name: projectData.name || template.name
        });

        // Create tasks if taskManager is available
        if (this.taskManager && template.tasks) {
            template.tasks.forEach((taskData, index) => {
                this.taskManager.createTask({
                    ...taskData,
                    projectId: project.id,
                    position: index
                });
            });
        }

        return project;
    }

    // Archive/Unarchive
    archiveProject(projectId) {
        return this.updateProject(projectId, { archived: true });
    }

    unarchiveProject(projectId) {
        return this.updateProject(projectId, { archived: false });
    }

    // Utility Methods
    generateId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Data Persistence
    saveData() {
        try {
            localStorage.setItem('taskmaster_projects', JSON.stringify(this.projects));
        } catch (error) {
            console.error('Failed to save projects:', error);
        }
    }

    loadData() {
        try {
            const projectsData = localStorage.getItem('taskmaster_projects');
            if (projectsData) {
                this.projects = JSON.parse(projectsData);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.projects = [];
        }
    }

    // Import/Export
    exportData() {
        return {
            projects: this.projects,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    importData(data) {
        try {
            if (data.projects) {
                this.projects = data.projects;
                this.saveData();
                this.emit('dataImported', data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import projects:', error);
            return false;
        }
    }

    clearAllData() {
        this.projects = [];
        this.saveData();
        this.emit('dataCleared');
    }
}

// Export for use in other modules
window.ProjectManager = ProjectManager;
