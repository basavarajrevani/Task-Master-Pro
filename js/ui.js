// TaskMaster Pro - UI Management System

class UIManager {
    constructor(taskManager, projectManager, storageManager) {
        this.taskManager = taskManager;
        this.projectManager = projectManager;
        this.storageManager = storageManager;
        this.currentView = 'dashboard';
        this.currentViewOptions = {};
        this.settings = this.storageManager.getSettings();
        this.modals = new Map();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModals();
        this.applyTheme();

        // Don't load view immediately - wait for full initialization
        console.log('UIManager: Basic initialization complete');
    }

    // Event Listeners
    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Search functionality
        const searchInput = document.getElementById('globalSearch');
        const searchClear = document.getElementById('searchClear');
        
        searchInput.addEventListener('input', PerformanceUtils.debounce((e) => {
            this.handleSearch(e.target.value);
            searchClear.classList.toggle('visible', e.target.value.length > 0);
        }, 300));

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.classList.remove('visible');
            this.handleSearch('');
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) {
                    this.showView(view);
                }
            });
        });

        // Quick add button
        document.getElementById('quickAddBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Notifications button
        document.getElementById('notificationsBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationPanel();
        });

        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');

        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
            this.closeNotificationPanel();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openModal('settings');
        });

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.importData();
        });



        // Add project button
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.openProjectModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Modal overlay
        document.getElementById('modalOverlay').addEventListener('click', () => {
            this.closeAllModals();
        });
    }

    // Modal Management
    setupModals() {
        this.modals.set('task', {
            element: document.getElementById('taskModal'),
            form: document.getElementById('taskForm'),
            title: document.getElementById('taskModalTitle'),
            close: document.getElementById('taskModalClose')
        });

        this.modals.set('project', {
            element: document.getElementById('projectModal'),
            form: document.getElementById('projectForm'),
            title: document.getElementById('projectModalTitle'),
            close: document.getElementById('projectModalClose')
        });

        this.modals.set('settings', {
            element: document.getElementById('settingsModal'),
            close: document.getElementById('settingsModalClose')
        });

        // Setup close buttons
        this.modals.forEach(modal => {
            if (modal.close) {
                modal.close.addEventListener('click', () => {
                    this.closeModal(modal.element);
                });
            }
        });
    }

    openModal(modalName, data = {}, options = {}) {
        const modal = this.modals.get(modalName);
        if (!modal) return;

        // Setup modal content based on type
        switch (modalName) {
            case 'task':
                this.setupTaskModal(data, options);
                break;
            case 'project':
                this.setupProjectModal(data);
                break;
            case 'settings':
                this.setupSettingsModal();
                break;
        }

        // Show modal
        document.getElementById('modalOverlay').classList.remove('hidden');
        document.getElementById('modalOverlay').classList.add('show');
        modal.element.classList.remove('hidden');
        modal.element.classList.add('show');

        // Focus first input
        const firstInput = modal.element.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    closeModal(modalElement) {
        modalElement.classList.remove('show');
        document.getElementById('modalOverlay').classList.remove('show');
        
        setTimeout(() => {
            modalElement.classList.add('hidden');
            document.getElementById('modalOverlay').classList.add('hidden');
        }, 300);
    }

    closeAllModals() {
        this.modals.forEach(modal => {
            if (!modal.element.classList.contains('hidden')) {
                this.closeModal(modal.element);
            }
        });
    }

    // Task Modal
    openTaskModal(taskDataOrOptions = null) {
        // Check if this is task data (for editing) or options (for creating)
        let taskData = null;
        let options = {};

        if (taskDataOrOptions) {
            // If it has an 'id' property, it's task data for editing
            if (taskDataOrOptions.id) {
                taskData = taskDataOrOptions;
            } else {
                // Otherwise, it's options for creating a new task
                options = taskDataOrOptions;
            }
        }

        this.openModal('task', taskData, options);
    }

    setupTaskModal(taskData = null, options = {}) {
        const modal = this.modals.get('task');
        const isEdit = !!taskData;
        
        modal.title.textContent = isEdit ? 'Edit Task' : 'Add New Task';
        
        // Create form content
        modal.form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="taskTitle">Title *</label>
                    <input type="text" id="taskTitle" name="title" required 
                           value="${taskData?.title || ''}" placeholder="Enter task title">
                </div>
                
                <div class="form-group">
                    <label for="taskPriority">Priority</label>
                    <select id="taskPriority" name="priority">
                        <option value="low" ${taskData?.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${taskData?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${taskData?.priority === 'high' ? 'selected' : ''}>High</option>
                        <option value="urgent" ${taskData?.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="taskCategory">Category</label>
                    <select id="taskCategory" name="category">
                        ${this.taskManager.categories.map(cat => 
                            `<option value="${cat}" ${taskData?.category === cat ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="taskProject">Project</label>
                    <select id="taskProject" name="projectId">
                        <option value="">No Project</option>
                        ${this.projectManager ? this.projectManager.getActiveProjects().map(project => {
                            // Check if this project should be selected (from taskData for editing, or options for new task)
                            const isSelected = taskData?.projectId === project.id || (!taskData && options.projectId === project.id);
                            return `<option value="${project.id}" ${isSelected ? 'selected' : ''}>${project.name}</option>`;
                        }).join('') : ''}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="taskDueDate">Due Date</label>
                    <input type="datetime-local" id="taskDueDate" name="dueDate" 
                           value="${taskData?.dueDate ? new Date(taskData.dueDate).toISOString().slice(0, 16) : ''}">
                </div>
                
                <div class="form-group">
                    <label for="taskStatus">Status</label>
                    <select id="taskStatus" name="status">
                        <option value="pending" ${taskData?.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${taskData?.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${taskData?.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${taskData?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                
                <div class="form-group form-group-full">
                    <label for="taskDescription">Description</label>
                    <textarea id="taskDescription" name="description" rows="3" 
                              placeholder="Enter task description">${taskData?.description || ''}</textarea>
                </div>
                
                <div class="form-group form-group-full">
                    <label for="taskTags">Tags (comma separated)</label>
                    <input type="text" id="taskTags" name="tags" 
                           value="${taskData?.tags?.join(', ') || ''}" 
                           placeholder="tag1, tag2, tag3">
                </div>
                
                <div class="form-group form-group-full">
                    <label for="taskNotes">Notes</label>
                    <textarea id="taskNotes" name="notes" rows="2" 
                              placeholder="Additional notes">${taskData?.notes || ''}</textarea>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="ui.closeAllModals()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Update Task' : 'Create Task'}
                </button>
            </div>
        `;

        // Handle form submission
        modal.form.onsubmit = (e) => {
            e.preventDefault();
            this.handleTaskSubmit(taskData);
        };
    }

    handleTaskSubmit(existingTask = null) {
        const modal = this.modals.get('task');
        const formData = new FormData(modal.form);
        
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            category: formData.get('category'),
            projectId: formData.get('projectId') || null,
            status: formData.get('status'),
            dueDate: formData.get('dueDate') || null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            notes: formData.get('notes')
        };

        try {
            if (existingTask) {
                this.taskManager.updateTask(existingTask.id, taskData);
                NotificationUtils.show('Task updated successfully', 'success');
            } else {
                this.taskManager.createTask(taskData);
                NotificationUtils.show('Task created successfully', 'success');
            }
            
            this.closeAllModals();
            this.refreshCurrentView();
        } catch (error) {
            NotificationUtils.show('Failed to save task: ' + error.message, 'error');
        }
    }

    // Project Modal
    openProjectModal(projectData = null) {
        this.openModal('project', projectData);
    }

    setupProjectModal(projectData = null) {
        const modal = this.modals.get('project');
        const isEdit = !!projectData;
        
        modal.title.textContent = isEdit ? 'Edit Project' : 'Add New Project';
        
        modal.form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="projectName">Name *</label>
                    <input type="text" id="projectName" name="name" required 
                           value="${projectData?.name || ''}" placeholder="Enter project name">
                </div>
                
                <div class="form-group">
                    <label for="projectColor">Color</label>
                    <input type="color" id="projectColor" name="color" 
                           value="${projectData?.color || '#3b82f6'}">
                </div>
                
                <div class="form-group">
                    <label for="projectPriority">Priority</label>
                    <select id="projectPriority" name="priority">
                        <option value="low" ${projectData?.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${projectData?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${projectData?.priority === 'high' ? 'selected' : ''}>High</option>
                        <option value="urgent" ${projectData?.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="projectStatus">Status</label>
                    <select id="projectStatus" name="status">
                        <option value="planning" ${projectData?.status === 'planning' ? 'selected' : ''}>Planning</option>
                        <option value="active" ${projectData?.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="on-hold" ${projectData?.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                        <option value="completed" ${projectData?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="projectStartDate">Start Date</label>
                    <input type="date" id="projectStartDate" name="startDate" 
                           value="${projectData?.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : ''}">
                </div>
                
                <div class="form-group">
                    <label for="projectEndDate">End Date</label>
                    <input type="date" id="projectEndDate" name="endDate" 
                           value="${projectData?.endDate ? new Date(projectData.endDate).toISOString().split('T')[0] : ''}">
                </div>
                
                <div class="form-group form-group-full">
                    <label for="projectDescription">Description</label>
                    <textarea id="projectDescription" name="description" rows="3" 
                              placeholder="Enter project description">${projectData?.description || ''}</textarea>
                </div>
                
                <div class="form-group form-group-full">
                    <label for="projectTags">Tags (comma separated)</label>
                    <input type="text" id="projectTags" name="tags" 
                           value="${projectData?.tags?.join(', ') || ''}" 
                           placeholder="tag1, tag2, tag3">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="ui.closeAllModals()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Update Project' : 'Create Project'}
                </button>
            </div>
        `;

        // Handle form submission
        modal.form.onsubmit = (e) => {
            e.preventDefault();
            this.handleProjectSubmit(projectData);
        };
    }

    handleProjectSubmit(existingProject = null) {
        const modal = this.modals.get('project');
        const formData = new FormData(modal.form);
        
        const projectData = {
            name: formData.get('name'),
            description: formData.get('description'),
            color: formData.get('color'),
            priority: formData.get('priority'),
            status: formData.get('status'),
            startDate: formData.get('startDate') || null,
            endDate: formData.get('endDate') || null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };

        try {
            if (existingProject) {
                this.projectManager.updateProject(existingProject.id, projectData);
                NotificationUtils.show('Project updated successfully', 'success');
            } else {
                this.projectManager.createProject(projectData);
                NotificationUtils.show('Project created successfully', 'success');
            }
            
            this.closeAllModals();
            this.updateSidebar();
            this.refreshCurrentView();
        } catch (error) {
            NotificationUtils.show('Failed to save project: ' + error.message, 'error');
        }
    }

    // Settings Modal
    setupSettingsModal() {
        const modal = this.modals.get('settings');
        const modalBody = modal.element.querySelector('.modal-body');

        modalBody.innerHTML = `
            <div class="settings-tabs">
                <button class="settings-tab active" data-tab="general">General</button>
                <button class="settings-tab" data-tab="appearance">Appearance</button>
                <button class="settings-tab" data-tab="notifications">Notifications</button>
                <button class="settings-tab" data-tab="data">Data</button>
            </div>

            <div class="settings-content">
                <div class="settings-panel active" data-panel="general">
                    <h3>General Settings</h3>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.autoSave ? 'checked' : ''} data-setting="autoSave">
                            Auto-save changes
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>Default view:</label>
                        <select data-setting="defaultView">
                            <option value="dashboard" ${this.settings.defaultView === 'dashboard' ? 'selected' : ''}>Dashboard</option>
                            <option value="all-tasks" ${this.settings.defaultView === 'all-tasks' ? 'selected' : ''}>All Tasks</option>
                            <option value="today" ${this.settings.defaultView === 'today' ? 'selected' : ''}>Today</option>
                        </select>
                    </div>
                </div>

                <div class="settings-panel" data-panel="appearance">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <label>Theme:</label>
                        <select data-setting="theme">
                            <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>Auto</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.ui?.compactMode ? 'checked' : ''} data-setting="ui.compactMode">
                            Compact mode
                        </label>
                    </div>
                </div>

                <div class="settings-panel" data-panel="notifications">
                    <h3>Notifications</h3>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.notifications?.enabled ? 'checked' : ''} data-setting="notifications.enabled">
                            Enable notifications
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.notifications?.desktop ? 'checked' : ''} data-setting="notifications.desktop">
                            Desktop notifications
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.notifications?.sound ? 'checked' : ''} data-setting="notifications.sound">
                            Sound notifications
                        </label>
                    </div>
                </div>

                <div class="settings-panel" data-panel="data">
                    <h3>Data Management</h3>
                    <div class="setting-item">
                        <button class="btn btn-secondary" onclick="ui.exportData()">Export Data</button>
                        <button class="btn btn-secondary" onclick="ui.importData()">Import Data</button>
                    </div>
                    <div class="setting-item">
                        <button class="btn btn-error" onclick="ui.clearAllData()">Clear All Data</button>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="ui.closeAllModals()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="ui.saveSettings()">Save Settings</button>
            </div>
        `;

        // Setup tab switching
        modalBody.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                modalBody.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                modalBody.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                modalBody.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
            });
        });
    }

    saveSettings() {
        const modal = this.modals.get('settings');
        const inputs = modal.element.querySelectorAll('[data-setting]');

        inputs.forEach(input => {
            const settingPath = input.dataset.setting;
            const value = input.type === 'checkbox' ? input.checked : input.value;

            // Handle nested settings
            if (settingPath.includes('.')) {
                const [parent, child] = settingPath.split('.');
                if (!this.settings[parent]) this.settings[parent] = {};
                this.settings[parent][child] = value;
            } else {
                this.settings[settingPath] = value;
            }
        });

        this.storageManager.saveSettings(this.settings);
        this.applyTheme();
        NotificationUtils.show('Settings saved successfully', 'success');
        this.closeAllModals();
    }

    // Theme Management
    toggleTheme() {
        const currentTheme = this.settings.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        this.settings.theme = newTheme;
        this.storageManager.saveSettings(this.settings);
        this.applyTheme();

        NotificationUtils.show(`Switched to ${newTheme} theme`, 'success');
    }

    applyTheme() {
        let theme = this.settings.theme || 'light';

        // Handle auto theme
        if (theme === 'auto') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        document.documentElement.setAttribute('data-theme', theme);

        // Update theme toggle icon
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Sidebar Management
    toggleSidebar() {
        const app = document.querySelector('.app-container');

        // For mobile/tablet view
        if (window.innerWidth <= 1024) {
            app.classList.toggle('sidebar-open');

            // Add overlay for mobile
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.addEventListener('click', () => this.closeSidebar());
                document.body.appendChild(overlay);
            }

            if (app.classList.contains('sidebar-open')) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            } else {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        } else {
            // For desktop view
            app.classList.toggle('sidebar-collapsed');
        }

        this.settings.ui = this.settings.ui || {};
        this.settings.ui.sidebarCollapsed = app.classList.contains('sidebar-collapsed');
        this.storageManager.saveSettings(this.settings);
    }

    closeSidebar() {
        const app = document.querySelector('.app-container');
        const overlay = document.querySelector('.sidebar-overlay');

        app.classList.remove('sidebar-open');
        if (overlay) {
            overlay.classList.remove('show');
        }
        document.body.style.overflow = '';
    }

    handleWindowResize() {
        const app = document.querySelector('.app-container');
        const overlay = document.querySelector('.sidebar-overlay');

        // If window is resized to desktop size, close mobile sidebar
        if (window.innerWidth > 1024) {
            app.classList.remove('sidebar-open');
            if (overlay) {
                overlay.classList.remove('show');
            }
            document.body.style.overflow = '';
        }
    }

    updateSidebar() {
        this.updateNavigationBadges();
        this.updateProjectsList();
    }

    updateNavigationBadges() {
        const stats = this.taskManager.getStats();

        document.getElementById('todayBadge').textContent = stats.today;
        document.getElementById('upcomingBadge').textContent = stats.upcoming;
        document.getElementById('allTasksBadge').textContent = stats.total;
        document.getElementById('completedBadge').textContent = stats.completed;
        document.getElementById('overdueBadge').textContent = stats.overdue;
    }

    updateProjectsList() {
        const projectsList = document.getElementById('projectsList');
        if (!this.projectManager) {
            projectsList.innerHTML = '<div class="loading">Loading projects...</div>';
            return;
        }

        const projects = this.projectManager.getActiveProjects();

        projectsList.innerHTML = projects.map(project => {
            const stats = this.projectManager.getProjectStats(project.id);
            return `
                <a href="#" class="nav-item project-item" data-project="${project.id}">
                    <div class="project-color" style="background-color: ${project.color}"></div>
                    <span>${project.name}</span>
                    <span class="nav-badge">${stats ? stats.totalTasks : 0}</span>
                </a>
            `;
        }).join('');

        // Add event listeners to project items
        projectsList.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = item.dataset.project;
                this.showView('project', { projectId });
            });
        });
    }

    // View Management
    showView(viewName, options = {}) {
        this.currentView = viewName;
        this.currentViewOptions = options;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Load view content
        this.loadViewContent(viewName, options);
    }

    loadViewContent(viewName, options = {}) {
        const mainContent = document.getElementById('mainContent');

        if (!mainContent) {
            console.error('Main content element not found');
            return;
        }

        try {
            // Check if managers are available
            if (!this.taskManager || !this.projectManager) {
                mainContent.innerHTML = `<div class="loading">Initializing ${viewName}...</div>`;

                // Retry after a short delay
                setTimeout(() => {
                    if (this.taskManager && this.projectManager) {
                        this.loadViewContent(viewName, options);
                    }
                }, 500);
                return;
            }

            if (window.Views && window.Views[viewName]) {
                const content = window.Views[viewName](options);
                mainContent.innerHTML = content;

                // Setup any event listeners for the new content
                this.setupViewEventListeners(viewName);

                console.log(`View loaded: ${viewName}`);
            } else {
                console.warn(`View not found: ${viewName}`);
                mainContent.innerHTML = `<div class="view-placeholder">View "${viewName}" not found</div>`;
            }
        } catch (error) {
            console.error('Error loading view:', error);
            mainContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading View</h3>
                    <p>There was an error loading this view. Please try again.</p>
                    <button class="btn btn-primary" onclick="window.ui.refreshCurrentView()">Retry</button>
                </div>
            `;
        }
    }

    setupViewEventListeners(viewName) {
        // Setup specific event listeners based on the view
        if (viewName === 'kanban') {
            this.setupKanbanEventListeners();
        } else if (viewName === 'project') {
            this.setupProjectViewEventListeners();
        }

        // Setup common event listeners for all views
        this.setupTaskCardEventListeners();
    }

    setupKanbanEventListeners() {
        // Add drag and drop functionality for kanban cards
        const kanbanCards = document.querySelectorAll('.kanban-card');
        kanbanCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.taskId);
            });
        });

        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;

                if (taskId && newStatus) {
                    try {
                        this.taskManager.updateTask(taskId, { status: newStatus });
                        this.refreshCurrentView();
                        NotificationUtils.show('Task status updated', 'success');
                    } catch (error) {
                        NotificationUtils.show('Failed to update task status', 'error');
                    }
                }
            });
        });
    }

    setupTaskCardEventListeners() {
        // Setup event listeners for task cards
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            // Double click to edit
            card.addEventListener('dblclick', () => {
                const taskId = card.dataset.taskId;
                if (taskId) {
                    this.editTask(taskId);
                }
            });
        });
    }

    refreshCurrentView() {
        this.showView(this.currentView, this.currentViewOptions);
        this.updateSidebar();
    }

    // Search
    handleSearch(query) {
        if (!query.trim()) {
            this.refreshCurrentView();
            return;
        }

        const results = this.taskManager.filterTasks({ search: query });
        this.showSearchResults(results, query);
    }

    showSearchResults(results, query) {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="search-results">
                <h2>Search Results for "${query}"</h2>
                <p>${results.length} task(s) found</p>
                <div class="tasks-list">
                    ${results.map(task => this.renderTaskCard(task)).join('')}
                </div>
            </div>
        `;
    }

    // Task Rendering
    renderTaskCard(task) {
        const project = (task.projectId && this.projectManager) ? this.projectManager.getProject(task.projectId) : null;
        const priorityColor = ColorUtils.getPriorityColor(task.priority);
        const statusColor = ColorUtils.getStatusColor(task.status);

        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-priority" style="background-color: ${priorityColor}"></div>
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-actions">
                        <button class="task-action-btn" onclick="editTask('${task.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn" onclick="deleteTask('${task.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}

                <div class="task-meta">
                    <span class="task-status" style="color: ${statusColor}">
                        <i class="fas fa-circle"></i> ${StringUtils.capitalize(task.status)}
                    </span>

                    ${task.dueDate ? `
                        <span class="task-due-date ${DateUtils.isOverdue(task.dueDate) ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i> ${DateUtils.formatRelativeTime(task.dueDate)}
                        </span>
                    ` : ''}

                    ${project ? `
                        <span class="task-project" style="color: ${project.color}">
                            <i class="fas fa-folder"></i> ${project.name}
                        </span>
                    ` : ''}
                </div>

                ${task.tags.length > 0 ? `
                    <div class="task-tags">
                        ${task.tags.map(tag => `<span class="task-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Task Actions
    editTask(taskId) {
        const task = this.taskManager.getTask(taskId);
        if (task) {
            this.openTaskModal(task);
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                this.taskManager.deleteTask(taskId);
                NotificationUtils.show('Task deleted successfully', 'success');
                this.refreshCurrentView();
            } catch (error) {
                NotificationUtils.show('Failed to delete task: ' + error.message, 'error');
            }
        }
    }

    setupProjectViewEventListeners() {
        // Setup filter buttons for project view
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');

                // Filter tasks based on selection
                const filter = e.target.dataset.filter;
                this.filterProjectTasks(filter);
            });
        });
    }

    filterProjectTasks(filter) {
        const taskCards = document.querySelectorAll('.task-card');

        taskCards.forEach(card => {
            const taskId = card.dataset.taskId;
            const task = this.taskManager.getTask(taskId);

            if (!task) return;

            let shouldShow = true;

            switch (filter) {
                case 'pending':
                    shouldShow = task.status === 'pending';
                    break;
                case 'in-progress':
                    shouldShow = task.status === 'in-progress';
                    break;
                case 'completed':
                    shouldShow = task.status === 'completed';
                    break;
                case 'all':
                default:
                    shouldShow = true;
                    break;
            }

            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    editProject(projectId) {
        const project = this.projectManager.getProject(projectId);
        if (!project) {
            NotificationUtils.show('Project not found', 'error');
            return;
        }

        // Open project modal with existing data
        this.openProjectModal(project);
    }

    // Data Management
    exportData() {
        try {
            // Try PDF export first, fallback to print if it fails
            this.exportToPDF().catch(() => {
                console.log('PDF export failed, using print fallback');
                this.exportViaPrint();
            });
        } catch (error) {
            console.log('Export error, using print fallback');
            this.exportViaPrint();
        }
    }

    async exportToPDF() {
        try {
            // Load jsPDF library dynamically
            if (!window.jspdf) {
                await this.loadJsPDF();
            }

            // Get jsPDF constructor
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Set up document
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;

            // Title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('TaskMaster Pro - Export Report', 20, yPosition);
            yPosition += 15;

            // Date
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
            yPosition += 20;

            // Get data
            const stats = this.taskManager.getStats();
            const allTasks = this.taskManager.getAllTasks();
            const projects = this.projectManager.getAllProjects();

            // Statistics section
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Statistics', 20, yPosition);
            yPosition += 10;

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Total Tasks: ${stats.total}`, 20, yPosition);
            yPosition += 6;
            doc.text(`Completed: ${stats.completed}`, 20, yPosition);
            yPosition += 6;
            doc.text(`Pending: ${stats.pending}`, 20, yPosition);
            yPosition += 6;
            doc.text(`In Progress: ${stats.inProgress}`, 20, yPosition);
            yPosition += 15;

            // Projects section
            if (projects.length > 0) {
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('Projects', 20, yPosition);
                yPosition += 10;

                projects.forEach(project => {
                    if (yPosition > pageHeight - 30) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(project.name, 20, yPosition);
                    yPosition += 6;

                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    if (project.description) {
                        doc.text(`Description: ${project.description}`, 25, yPosition);
                        yPosition += 5;
                    }
                    doc.text(`Status: ${project.status}`, 25, yPosition);
                    yPosition += 5;
                    doc.text(`Tasks: ${project.taskIds ? project.taskIds.length : 0}`, 25, yPosition);
                    yPosition += 10;
                });

                yPosition += 10;
            }

            // Tasks section
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Tasks', 20, yPosition);
            yPosition += 10;

            allTasks.forEach((task, index) => {
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Task title
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${task.title}`, 20, yPosition);
                yPosition += 6;

                // Task details
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                if (task.description) {
                    doc.text(`Description: ${task.description}`, 25, yPosition);
                    yPosition += 5;
                }

                doc.text(`Status: ${task.status}`, 25, yPosition);
                yPosition += 5;
                doc.text(`Priority: ${task.priority}`, 25, yPosition);
                yPosition += 5;
                doc.text(`Category: ${task.category}`, 25, yPosition);
                yPosition += 5;

                if (task.dueDate) {
                    doc.text(`Due Date: ${new Date(task.dueDate).toLocaleDateString()}`, 25, yPosition);
                    yPosition += 5;
                }

                if (task.projectId) {
                    const project = this.projectManager.getProject(task.projectId);
                    if (project) {
                        doc.text(`Project: ${project.name}`, 25, yPosition);
                        yPosition += 5;
                    }
                }

                if (task.tags && task.tags.length > 0) {
                    doc.text(`Tags: ${task.tags.join(', ')}`, 25, yPosition);
                    yPosition += 5;
                }

                yPosition += 8;
            });

            // Save the PDF
            const filename = `TaskMaster-Pro-Export-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            NotificationUtils.show('Data exported to PDF successfully!', 'success');

        } catch (error) {
            console.error('PDF Export Error:', error);
            throw error; // Re-throw to trigger fallback
        }
    }

    exportViaPrint() {
        try {
            // Create a printable version of the data
            const stats = this.taskManager.getStats();
            const allTasks = this.taskManager.getAllTasks();
            const projects = this.projectManager.getAllProjects();

            // Create a new window with printable content
            const printWindow = window.open('', '_blank');
            const printContent = this.generatePrintableContent(stats, allTasks, projects);

            printWindow.document.write(printContent);
            printWindow.document.close();

            // Wait for content to load, then print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    // Close the window after printing (user can cancel)
                    printWindow.onafterprint = () => {
                        printWindow.close();
                    };
                }, 500);
            };

            NotificationUtils.show('Print dialog opened', 'info');

        } catch (error) {
            console.error('Print Export Error:', error);
            NotificationUtils.show('Failed to export data for printing', 'error');
        }
    }

    generatePrintableContent(stats, allTasks, projects) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>TaskMaster Pro - Export Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1, h2 { color: #333; }
                    .stats { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .task { margin: 15px 0; padding: 10px; border-left: 3px solid #3b82f6; }
                    .task-title { font-weight: bold; margin-bottom: 5px; }
                    .task-details { font-size: 0.9em; color: #666; }
                    .project { margin: 15px 0; padding: 10px; border-left: 3px solid #10b981; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>TaskMaster Pro - Export Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>

                <div class="stats">
                    <h2>Statistics</h2>
                    <p>Total Tasks: ${stats.total}</p>
                    <p>Completed: ${stats.completed}</p>
                    <p>Pending: ${stats.pending}</p>
                    <p>In Progress: ${stats.inProgress}</p>
                </div>

                ${projects.length > 0 ? `
                    <h2>Projects</h2>
                    ${projects.map(project => `
                        <div class="project">
                            <div class="task-title">${project.name}</div>
                            <div class="task-details">
                                ${project.description ? `Description: ${project.description}<br>` : ''}
                                Status: ${project.status}<br>
                                Tasks: ${project.taskIds ? project.taskIds.length : 0}
                            </div>
                        </div>
                    `).join('')}
                ` : ''}

                <h2>Tasks</h2>
                ${allTasks.map((task, index) => `
                    <div class="task">
                        <div class="task-title">${index + 1}. ${task.title}</div>
                        <div class="task-details">
                            ${task.description ? `Description: ${task.description}<br>` : ''}
                            Status: ${task.status}<br>
                            Priority: ${task.priority}<br>
                            Category: ${task.category}<br>
                            ${task.dueDate ? `Due Date: ${new Date(task.dueDate).toLocaleDateString()}<br>` : ''}
                            ${task.tags && task.tags.length > 0 ? `Tags: ${task.tags.join(', ')}<br>` : ''}
                        </div>
                    </div>
                `).join('')}
            </body>
            </html>
        `;
    }

    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.jspdf) {
                resolve();
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load jsPDF');
                reject(new Error('Failed to load jsPDF library'));
            };

            document.head.appendChild(script);
        });
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.processImportedData(data);
                    } catch (error) {
                        NotificationUtils.show('Invalid file format', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    processImportedData(data) {
        try {
            let importedCount = 0;

            // Import tasks
            if (data.tasks && Array.isArray(data.tasks)) {
                data.tasks.forEach(taskData => {
                    this.taskManager.createTask(taskData);
                    importedCount++;
                });
            }

            // Import projects
            if (data.projects && Array.isArray(data.projects)) {
                data.projects.forEach(projectData => {
                    this.projectManager.createProject(projectData);
                });
            }

            // Import settings
            if (data.settings) {
                this.storageManager.saveSettings(data.settings);
            }

            NotificationUtils.show(`Successfully imported ${importedCount} tasks`, 'success');
            this.refreshCurrentView();

        } catch (error) {
            console.error('Import error:', error);
            NotificationUtils.show('Failed to import data: ' + error.message, 'error');
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.taskManager.clearAllData();
            this.projectManager.clearAllData();
            this.storageManager.clearAllData();
            NotificationUtils.show('All data cleared successfully', 'success');
            this.refreshCurrentView();
        }
    }

    // Notification Management
    openNotificationPanel() {
        const name = input.value.trim();

        if (!name) {
            NotificationUtils.show('Please enter a collaborator name', 'warning');
            return;
        }

        try {
            this.taskManager.addCollaborator(taskId, name);
            input.value = '';

            // Refresh the collaborators list
            const task = this.taskManager.getTask(taskId);
            document.getElementById('collaboratorsList').innerHTML = this.renderCollaboratorsList(task);

            NotificationUtils.show(`Added ${name} as collaborator`, 'success');
        } catch (error) {
            NotificationUtils.show('Failed to add collaborator: ' + error.message, 'error');
        }
    }

    removeCollaborator(taskId, collaboratorName) {
        if (confirm(`Remove ${collaboratorName} as collaborator?`)) {
            try {
                this.taskManager.removeCollaborator(taskId, collaboratorName);

                // Refresh the collaborators list
                const task = this.taskManager.getTask(taskId);
                document.getElementById('collaboratorsList').innerHTML = this.renderCollaboratorsList(task);

                NotificationUtils.show(`Removed ${collaboratorName} as collaborator`, 'success');
            } catch (error) {
                NotificationUtils.show('Failed to remove collaborator: ' + error.message, 'error');
            }
        }
    }

    getUserName() {
        return this.settings.userName || localStorage.getItem('taskmaster_username') || '';
    }

    openImportSharedModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-share-alt"></i> Import Shared Task</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="import-options">
                        <div class="import-option">
                            <h3><i class="fas fa-link"></i> Import from Share Link</h3>
                            <p>Paste a TaskMaster Pro share link to import a task.</p>
                            <div class="form-group">
                                <label for="shareLink">Share Link:</label>
                                <textarea id="shareLink" placeholder="Paste the share link here..." rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="importerName">Your Name (optional):</label>
                                <input type="text" id="importerName" placeholder="Enter your name" value="${this.getUserName()}">
                            </div>
                            <button class="btn btn-primary" onclick="importFromShareLink()">
                                <i class="fas fa-download"></i> Import Task
                            </button>
                        </div>

                        <div class="import-option">
                            <h3><i class="fas fa-file-import"></i> Import from File</h3>
                            <p>Select a task file (.json) that was exported from TaskMaster Pro.</p>
                            <input type="file" id="taskFileInput" accept=".json" style="display: none;">
                            <button class="btn btn-secondary" onclick="document.getElementById('taskFileInput').click()">
                                <i class="fas fa-upload"></i> Choose File
                            </button>
                            <div id="fileImportResult" style="margin-top: 1rem; display: none;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Setup file input handler
        const fileInput = modal.querySelector('#taskFileInput');
        fileInput.addEventListener('change', (e) => {
            this.handleTaskFileImport(e.target.files[0]);
        });

        // Focus on the share link input
        setTimeout(() => {
            const linkInput = modal.querySelector('#shareLink');
            if (linkInput) linkInput.focus();
        }, 100);
    }

    importFromShareLink() {
        try {
            const shareLink = document.getElementById('shareLink').value.trim();
            const importerName = document.getElementById('importerName').value.trim() || 'Anonymous';

            if (!shareLink) {
                NotificationUtils.show('Please paste a share link', 'warning');
                return;
            }

            // Extract share data from URL
            let shareData;
            try {
                const url = new URL(shareLink);
                shareData = url.searchParams.get('share');
            } catch (error) {
                // If it's not a full URL, assume it's just the encoded data
                shareData = shareLink;
            }

            if (!shareData) {
                NotificationUtils.show('Invalid share link format', 'error');
                return;
            }

            // Import the task
            const importedTask = this.taskManager.importSharedTask(shareData, importerName);

            // Close modal and show success
            document.querySelector('.modal').remove();
            NotificationUtils.show(`Task "${importedTask.title}" imported successfully!`, 'success');

            // Refresh the current view
            this.refreshCurrentView();

        } catch (error) {
            NotificationUtils.show('Failed to import task: ' + error.message, 'error');
        }
    }

    handleTaskFileImport(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importerName = document.getElementById('importerName').value.trim() || 'Anonymous';
                const importedTask = this.taskManager.importTaskFromFile(e.target.result, importerName);

                // Show success message
                const resultDiv = document.getElementById('fileImportResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div class="import-success">
                        <i class="fas fa-check-circle"></i>
                        Task "${importedTask.title}" imported successfully!
                    </div>
                `;

                // Close modal after a delay
                setTimeout(() => {
                    document.querySelector('.modal').remove();
                    this.refreshCurrentView();
                }, 2000);

            } catch (error) {
                const resultDiv = document.getElementById('fileImportResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div class="import-error">
                        <i class="fas fa-exclamation-circle"></i>
                        Failed to import: ${error.message}
                    </div>
                `;
            }
        };

        reader.readAsText(file);
    }

    // Data Management
    exportData() {
        try {
            // Try PDF export first, fallback to print if it fails
            this.exportToPDF().catch(() => {
                console.log('PDF export failed, using print fallback');
                this.exportViaPrint();
            });
        } catch (error) {
            console.log('Export error, using print fallback');
            this.exportViaPrint();
        }
    }

    async exportToPDF() {
        try {
            // Load jsPDF library dynamically
            if (!window.jspdf) {
                await this.loadJsPDF();
            }

            // Get jsPDF constructor
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Set up document
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;

            // Title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('TaskMaster Pro - Task Export', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // Export date
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Exported on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;

            // Get data
            const stats = this.taskManager.getStats();
            const allTasks = this.taskManager.getAllTasks();
            const projects = this.projectManager.getAllProjects();

            // Statistics Section
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Statistics', 20, yPosition);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Total Tasks: ${stats.total}`, 20, yPosition);
            yPosition += 5;
            doc.text(`Completed: ${stats.completed}`, 20, yPosition);
            yPosition += 5;
            doc.text(`Pending: ${stats.pending}`, 20, yPosition);
            yPosition += 5;
            doc.text(`In Progress: ${stats.inProgress}`, 20, yPosition);
            yPosition += 5;
            doc.text(`Overdue: ${stats.overdue}`, 20, yPosition);
            yPosition += 5;
            doc.text(`Completion Rate: ${stats.completionRate}%`, 20, yPosition);
            yPosition += 15;

            // Projects Section
            if (projects.length > 0) {
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('Projects', 20, yPosition);
                yPosition += 10;

                projects.forEach(project => {
                    if (yPosition > pageHeight - 30) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(project.name, 20, yPosition);
                    yPosition += 6;

                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    if (project.description) {
                        doc.text(`Description: ${project.description}`, 25, yPosition);
                        yPosition += 5;
                    }
                    doc.text(`Status: ${project.status}`, 25, yPosition);
                    yPosition += 5;
                    doc.text(`Priority: ${project.priority}`, 25, yPosition);
                    yPosition += 8;
                });
                yPosition += 10;
            }

            // Tasks Section
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Tasks', 20, yPosition);
            yPosition += 10;

            allTasks.forEach((task, index) => {
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Task title
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${task.title}`, 20, yPosition);
                yPosition += 6;

                // Task details
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                if (task.description) {
                    const description = task.description.length > 80 ?
                        task.description.substring(0, 80) + '...' : task.description;
                    doc.text(`Description: ${description}`, 25, yPosition);
                    yPosition += 5;
                }

                doc.text(`Status: ${task.status}`, 25, yPosition);
                yPosition += 5;
                doc.text(`Priority: ${task.priority}`, 25, yPosition);
                yPosition += 5;
                doc.text(`Category: ${task.category}`, 25, yPosition);
                yPosition += 5;

                if (task.dueDate) {
                    doc.text(`Due Date: ${new Date(task.dueDate).toLocaleDateString()}`, 25, yPosition);
                    yPosition += 5;
                }

                if (task.projectId && this.projectManager) {
                    const project = this.projectManager.getProject(task.projectId);
                    if (project) {
                        doc.text(`Project: ${project.name}`, 25, yPosition);
                        yPosition += 5;
                    }
                }

                if (task.tags && task.tags.length > 0) {
                    doc.text(`Tags: ${task.tags.join(', ')}`, 25, yPosition);
                    yPosition += 5;
                }

                yPosition += 8;
            });

            // Save the PDF
            const filename = `TaskMaster-Pro-Export-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            NotificationUtils.show('Data exported to PDF successfully!', 'success');

        } catch (error) {
            console.error('PDF Export Error:', error);
            throw error; // Re-throw to trigger fallback
        }
    }

    exportViaPrint() {
        try {
            // Create a printable version of the data
            const stats = this.taskManager.getStats();
            const allTasks = this.taskManager.getAllTasks();
            const projects = this.projectManager.getAllProjects();

            // Create a new window with printable content
            const printWindow = window.open('', '_blank');
            const printContent = this.generatePrintableContent(stats, allTasks, projects);

            printWindow.document.write(printContent);
            printWindow.document.close();

            // Wait for content to load, then print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    // Close the window after printing (user can cancel)
                    printWindow.onafterprint = () => {
                        printWindow.close();
                    };
                }, 500);
            };

            NotificationUtils.show('Print dialog opened. You can save as PDF from the print options.', 'info', 7000);

        } catch (error) {
            console.error('Print Export Error:', error);
            NotificationUtils.show('Failed to export data: ' + error.message, 'error');
        }
    }

    generatePrintableContent(stats, tasks, projects) {
        const today = new Date().toLocaleDateString();

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>TaskMaster Pro Export - ${today}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #3b82f6;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #3b82f6;
                        margin: 0;
                    }
                    .section {
                        margin-bottom: 30px;
                        page-break-inside: avoid;
                    }
                    .section h2 {
                        color: #1f2937;
                        border-bottom: 1px solid #e5e7eb;
                        padding-bottom: 5px;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    .stat-item {
                        text-align: center;
                        padding: 15px;
                        background: #f8fafc;
                        border-radius: 8px;
                    }
                    .stat-number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #3b82f6;
                    }
                    .task-item, .project-item {
                        margin-bottom: 15px;
                        padding: 15px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        page-break-inside: avoid;
                    }
                    .task-title, .project-title {
                        font-weight: bold;
                        color: #1f2937;
                        margin-bottom: 5px;
                    }
                    .task-meta {
                        font-size: 14px;
                        color: #6b7280;
                        margin-bottom: 5px;
                    }
                    .status {
                        display: inline-block;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    .status-completed { background: #d1fae5; color: #065f46; }
                    .status-pending { background: #fef3c7; color: #92400e; }
                    .status-in-progress { background: #dbeafe; color: #1e40af; }
                    .status-cancelled { background: #fee2e2; color: #991b1b; }
                    .priority {
                        display: inline-block;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                        margin-left: 10px;
                    }
                    .priority-low { background: #d1fae5; color: #065f46; }
                    .priority-medium { background: #fef3c7; color: #92400e; }
                    .priority-high { background: #fed7d7; color: #c53030; }
                    .priority-urgent { background: #fee2e2; color: #991b1b; }
                    @media print {
                        body { margin: 0; }
                        .section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>TaskMaster Pro - Task Export</h1>
                    <p>Exported on: ${today}</p>
                </div>

                <div class="section">
                    <h2>Statistics</h2>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">${stats.total}</div>
                            <div>Total Tasks</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.completed}</div>
                            <div>Completed</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.pending}</div>
                            <div>Pending</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.inProgress}</div>
                            <div>In Progress</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.overdue}</div>
                            <div>Overdue</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${stats.completionRate}%</div>
                            <div>Completion Rate</div>
                        </div>
                    </div>
                </div>

                ${projects.length > 0 ? `
                <div class="section">
                    <h2>Projects (${projects.length})</h2>
                    ${projects.map(project => `
                        <div class="project-item">
                            <div class="project-title">${project.name}</div>
                            ${project.description ? `<div class="task-meta">Description: ${project.description}</div>` : ''}
                            <div class="task-meta">
                                <span class="status status-${project.status}">${project.status}</span>
                                <span class="priority priority-${project.priority}">${project.priority}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div class="section">
                    <h2>Tasks (${tasks.length})</h2>
                    ${tasks.map((task, index) => {
                        const project = task.projectId && this.projectManager ?
                            this.projectManager.getProject(task.projectId) : null;

                        return `
                            <div class="task-item">
                                <div class="task-title">${index + 1}. ${task.title}</div>
                                ${task.description ? `<div class="task-meta">Description: ${task.description}</div>` : ''}
                                <div class="task-meta">
                                    <span class="status status-${task.status}">${task.status}</span>
                                    <span class="priority priority-${task.priority}">${task.priority}</span>
                                </div>
                                <div class="task-meta">Category: ${task.category}</div>
                                ${task.dueDate ? `<div class="task-meta">Due Date: ${new Date(task.dueDate).toLocaleDateString()}</div>` : ''}
                                ${project ? `<div class="task-meta">Project: ${project.name}</div>` : ''}
                                ${task.tags && task.tags.length > 0 ? `<div class="task-meta">Tags: ${task.tags.join(', ')}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </body>
            </html>
        `;
    }

    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.jspdf) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF library loaded successfully');
                // Wait a moment for the library to initialize
                setTimeout(() => {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        console.log('jsPDF constructor available');
                        resolve();
                    } else {
                        reject(new Error('jsPDF constructor not found after loading'));
                    }
                }, 100);
            };
            script.onerror = () => {
                reject(new Error('Failed to load jsPDF library from CDN'));
            };
            document.head.appendChild(script);
        });
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const content = await readFile(file);
                const success = this.storageManager.importData(content);

                if (success) {
                    NotificationUtils.show('Data imported successfully. Reloading...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    NotificationUtils.show('Failed to import data. Invalid format.', 'error');
                }
            } catch (error) {
                NotificationUtils.show('Failed to import data: ' + error.message, 'error');
            }
        };

        input.click();
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.storageManager.clearAllData();
            window.location.reload();
        }
    }

    // Notification Panel Management
    toggleNotificationPanel() {
        let panel = document.getElementById('notificationPanel');

        if (!panel) {
            panel = this.createNotificationPanel();
            document.body.appendChild(panel);
        }

        if (panel.classList.contains('show')) {
            this.closeNotificationPanel();
        } else {
            this.openNotificationPanel();
        }
    }

    openNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            this.updateNotificationPanelContent();
            panel.classList.add('show');
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('show');
        }
    }

    createNotificationPanel() {
        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';

        panel.innerHTML = `
            <div class="notification-panel-header">
                <h3><i class="fas fa-bell"></i> Notifications</h3>
                <div class="notification-panel-actions">
                    <button class="btn-icon" onclick="ui.markAllNotificationsRead()" title="Mark all as read">
                        <i class="fas fa-check-double"></i>
                    </button>
                    <button class="btn-icon" onclick="ui.clearAllNotifications()" title="Clear all">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon" onclick="ui.closeNotificationPanel()" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="notification-panel-content" id="notificationPanelContent">
                <div class="loading">Loading notifications...</div>
            </div>
        `;

        // Prevent panel from closing when clicked
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        return panel;
    }

    updateNotificationPanelContent() {
        const content = document.getElementById('notificationPanelContent');
        if (!content || !window.app?.notificationManager) return;

        const notifications = window.app.notificationManager.getNotifications();

        if (notifications.length === 0) {
            content.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <h4>No notifications</h4>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }

        content.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon" style="color: ${notification.color}">
                    <i class="fas fa-${notification.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatNotificationTime(notification.timestamp)}</div>
                </div>
                <div class="notification-actions">
                    ${notification.taskId ? `
                        <button class="btn-icon" onclick="ui.openTaskFromNotification('${notification.taskId}')" title="View task">
                            <i class="fas fa-eye"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="ui.dismissNotification('${notification.id}')" title="Dismiss">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatNotificationTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return time.toLocaleDateString();
    }

    openTaskFromNotification(taskId) {
        const task = this.taskManager.getTask(taskId);
        if (task) {
            this.closeNotificationPanel();
            this.editTask(taskId);
        }
    }

    dismissNotification(notificationId) {
        if (window.app?.notificationManager) {
            window.app.notificationManager.markAsRead(notificationId);
            this.updateNotificationPanelContent();
        }
    }

    markAllNotificationsRead() {
        if (window.app?.notificationManager) {
            const notifications = window.app.notificationManager.getNotifications();
            notifications.forEach(n => {
                window.app.notificationManager.markAsRead(n.id);
            });
            this.updateNotificationPanelContent();
        }
    }

    clearAllNotifications() {
        if (confirm('Are you sure you want to clear all notifications?')) {
            if (window.app?.notificationManager) {
                window.app.notificationManager.clearAllNotifications();
                this.updateNotificationPanelContent();
            }
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Ctrl/Cmd + N: New task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.openTaskModal();
        }

        // Ctrl/Cmd + F: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('globalSearch').focus();
        }

        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Number keys for quick navigation
        if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
            const views = ['dashboard', 'today', 'upcoming', 'all-tasks', 'kanban', 'calendar'];
            const viewIndex = parseInt(e.key) - 1;
            if (views[viewIndex]) {
                this.showView(views[viewIndex]);
            }
        }
    }
}

// Export for use in other modules
window.UIManager = UIManager;
