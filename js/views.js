// TaskMaster Pro - Views System

window.Views = {
    // Dashboard View
    dashboard(options = {}) {
        if (!window.taskManager || !window.projectManager) {
            console.log('Dashboard: Waiting for managers to initialize...');
            return '<div class="loading">Loading dashboard...</div>';
        }

        console.log('Dashboard: Rendering with data...');

        const stats = window.taskManager.getStats();
        const recentTasks = window.taskManager.getAllTasks()
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);

        const todayTasks = window.taskManager.filterTasks({ today: true });
        const overdueTasks = window.taskManager.filterTasks({ overdue: true });
        const projects = window.projectManager.getAllProjects();

        return `
            <div class="dashboard">
                <div class="dashboard-header">
                    <h1>Dashboard</h1>
                    <p>Welcome back! Here's what's happening with your tasks.</p>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--primary-color)">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.total}</h3>
                            <p>Total Tasks</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--success-color)">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.completed}</h3>
                            <p>Completed</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--warning-color)">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.pending}</h3>
                            <p>Pending</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: var(--error-color)">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${stats.overdue}</h3>
                            <p>Overdue</p>
                        </div>
                    </div>
                </div>

                <!-- Charts and Analytics -->
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3>Weekly Progress</h3>
                            <div class="completion-rate">
                                <span class="rate-value">${stats.completionRate}%</span>
                                <span class="rate-label">Completion Rate</span>
                            </div>
                        </div>
                        <div class="chart-container">
                            ${this.renderWeeklyChart(stats.weeklyStats)}
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3>Priority Distribution</h3>
                        </div>
                        <div class="priority-chart">
                            ${this.renderPriorityChart(stats.priorityStats)}
                        </div>
                    </div>
                </div>

                <!-- Task Lists -->
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3>Today's Tasks</h3>
                            <button class="btn btn-sm btn-primary" onclick="window.showView('today')">View All</button>
                        </div>
                        <div class="task-list">
                            ${todayTasks.length > 0 ? 
                                todayTasks.slice(0, 3).map(task => this.renderTaskItem(task)).join('') :
                                '<p class="empty-state">No tasks for today</p>'
                            }
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3>Recent Activity</h3>
                        </div>
                        <div class="task-list">
                            ${recentTasks.length > 0 ? 
                                recentTasks.map(task => this.renderTaskItem(task)).join('') :
                                '<p class="empty-state">No recent activity</p>'
                            }
                        </div>
                    </div>
                </div>

                <!-- Projects Section -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3><i class="fas fa-folder"></i> Active Projects</h3>
                        <button class="btn btn-sm btn-primary" onclick="window.ui.openProjectModal()">
                            <i class="fas fa-plus"></i> New Project
                        </button>
                    </div>
                    <div class="projects-grid">
                        ${projects.length > 0 ?
                            projects.slice(0, 4).map(project => this.renderProjectCard(project)).join('') :
                            '<p class="empty-state">No projects yet. <a href="#" onclick="window.ui.openProjectModal()">Create your first project</a></p>'
                        }
                    </div>
                </div>

                ${overdueTasks.length > 0 ? `
                    <div class="dashboard-card alert-card">
                        <div class="card-header">
                            <h3><i class="fas fa-exclamation-triangle"></i> Overdue Tasks</h3>
                            <button class="btn btn-sm btn-error" onclick="window.showView('overdue')">View All</button>
                        </div>
                        <div class="task-list">
                            ${overdueTasks.slice(0, 3).map(task => this.renderTaskItem(task)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Today View
    today(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading today\'s tasks...</div>';
        }

        const todayTasks = window.taskManager.filterTasks({ today: true });
        
        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-calendar-day"></i> Today</h1>
                    <div class="view-actions">
                        <button class="btn btn-primary" onclick="window.openTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                </div>

                <div class="tasks-container">
                    ${todayTasks.length > 0 ? `
                        <div class="tasks-grid">
                            ${todayTasks.map(task => window.ui ? window.ui.renderTaskCard(task) : '').join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-calendar-check"></i>
                            <h3>No tasks for today</h3>
                            <p>You're all caught up! Add a new task or check your upcoming tasks.</p>
                            <button class="btn btn-primary" onclick="window.openTaskModal()">Add Task</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // All Tasks View
    'all-tasks'(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading all tasks...</div>';
        }

        const allTasks = window.taskManager.getAllTasks();
        const filters = options.filters || {};
        
        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-list"></i> All Tasks</h1>
                    <div class="view-actions">
                        <div class="view-filters">
                            <select id="statusFilter" onchange="window.Views.filterAllTasks()">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select id="priorityFilter" onchange="window.Views.filterAllTasks()">
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="window.openTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                </div>

                <div class="tasks-container">
                    ${allTasks.length > 0 ? `
                        <div class="tasks-grid">
                            ${allTasks.map(task => window.ui ? window.ui.renderTaskCard(task) : '').join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-tasks"></i>
                            <h3>No tasks yet</h3>
                            <p>Get started by creating your first task!</p>
                            <button class="btn btn-primary" onclick="window.openTaskModal()">Create First Task</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Upcoming View
    upcoming(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading upcoming tasks...</div>';
        }

        const upcomingTasks = window.taskManager.filterTasks({ upcoming: true });
        
        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-clock"></i> Upcoming</h1>
                    <div class="view-actions">
                        <button class="btn btn-primary" onclick="window.openTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                </div>

                <div class="tasks-container">
                    ${upcomingTasks.length > 0 ? `
                        <div class="tasks-grid">
                            ${upcomingTasks.map(task => window.ui ? window.ui.renderTaskCard(task) : '').join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-clock"></i>
                            <h3>No upcoming tasks</h3>
                            <p>You're all set for the next week!</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Completed View
    completed(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading completed tasks...</div>';
        }

        const completedTasks = window.taskManager.filterTasks({ status: 'completed' });
        
        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-check-circle"></i> Completed</h1>
                    <p>${completedTasks.length} completed task(s)</p>
                </div>

                <div class="tasks-container">
                    ${completedTasks.length > 0 ? `
                        <div class="tasks-grid">
                            ${completedTasks.map(task => window.ui ? window.ui.renderTaskCard(task) : '').join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <h3>No completed tasks</h3>
                            <p>Complete some tasks to see them here!</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Overdue View
    overdue(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading overdue tasks...</div>';
        }

        const overdueTasks = window.taskManager.filterTasks({ overdue: true });
        
        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-exclamation-triangle"></i> Overdue</h1>
                    <p class="text-error">${overdueTasks.length} overdue task(s)</p>
                </div>

                <div class="tasks-container">
                    ${overdueTasks.length > 0 ? `
                        <div class="tasks-grid">
                            ${overdueTasks.map(task => window.ui ? window.ui.renderTaskCard(task) : '').join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <h3>No overdue tasks</h3>
                            <p>Great job staying on top of your tasks!</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Kanban View
    kanban(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading kanban board...</div>';
        }

        const tasks = window.taskManager.getAllTasks();
        const columns = [
            { id: 'pending', title: 'To Do', status: 'pending' },
            { id: 'in-progress', title: 'In Progress', status: 'in-progress' },
            { id: 'completed', title: 'Done', status: 'completed' }
        ];

        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-columns"></i> Kanban Board</h1>
                    <div class="view-actions">
                        <button class="btn btn-primary" onclick="window.openTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                </div>

                <div class="kanban-board">
                    ${columns.map(column => `
                        <div class="kanban-column" data-status="${column.status}">
                            <div class="column-header">
                                <h3>${column.title}</h3>
                                <span class="task-count">${tasks.filter(t => t.status === column.status).length}</span>
                            </div>
                            <div class="column-tasks">
                                ${tasks
                                    .filter(task => task.status === column.status)
                                    .map(task => this.renderKanbanCard(task))
                                    .join('')
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Calendar View
    calendar(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading calendar...</div>';
        }

        const today = new Date();
        const currentMonth = options.month || today.getMonth();
        const currentYear = options.year || today.getFullYear();

        const allTasks = window.taskManager.getAllTasks();
        const tasksWithDates = allTasks.filter(task => task.dueDate);

        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-calendar-alt"></i> Calendar</h1>
                    <div class="view-actions">
                        <div class="calendar-nav">
                            <button class="btn btn-secondary" onclick="window.Views.navigateCalendar(-1)">
                                <i class="fas fa-chevron-left"></i> Previous
                            </button>
                            <span class="calendar-month-year">
                                ${this.getMonthName(currentMonth)} ${currentYear}
                            </span>
                            <button class="btn btn-secondary" onclick="window.Views.navigateCalendar(1)">
                                Next <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <button class="btn btn-primary" onclick="window.openTaskModal()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                </div>

                <div class="calendar-container">
                    ${this.renderCalendar(currentYear, currentMonth, tasksWithDates)}
                </div>

                <div class="calendar-legend">
                    <div class="legend-item">
                        <span class="legend-dot overdue"></span>
                        <span>Overdue</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot today"></span>
                        <span>Due Today</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot upcoming"></span>
                        <span>Upcoming</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot completed"></span>
                        <span>Completed</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Project View
    project(options = {}) {
        if (!window.taskManager || !window.projectManager) {
            return '<div class="loading">Loading project...</div>';
        }

        const projectId = options.projectId;
        if (!projectId) {
            return '<div class="error">Project ID not provided</div>';
        }

        const project = window.projectManager.getProject(projectId);
        if (!project) {
            return '<div class="error">Project not found</div>';
        }

        const projectTasks = window.taskManager.filterTasks({ projectId });
        const stats = window.projectManager.getProjectStats(projectId);
        const progressPercentage = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

        return `
            <div class="view-container">
                <div class="view-header">
                    <div class="header-content">
                        <div class="project-title-section">
                            <div class="project-color-large" style="background-color: ${project.color || '#3b82f6'}"></div>
                            <div>
                                <h1>${project.name}</h1>
                                <p class="project-description">${project.description || 'No description provided'}</p>
                            </div>
                        </div>
                        <div class="project-actions">
                            <button class="btn btn-secondary" onclick="window.ui.editProject('${project.id}')">
                                <i class="fas fa-edit"></i> Edit Project
                            </button>
                            <button class="btn btn-primary" onclick="window.ui.openTaskModal({ projectId: '${project.id}' })">
                                <i class="fas fa-plus"></i> Add Task
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Project Stats -->
                <div class="project-overview">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.totalTasks}</h3>
                                <p>Total Tasks</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.completedTasks}</h3>
                                <p>Completed</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.pendingTasks}</h3>
                                <p>Pending</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${progressPercentage}%</h3>
                                <p>Progress</p>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="project-progress-section">
                        <div class="progress-header">
                            <h3>Project Progress</h3>
                            <span class="progress-percentage">${progressPercentage}% Complete</span>
                        </div>
                        <div class="progress-bar-large">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Project Tasks -->
                <div class="project-tasks-section">
                    <div class="section-header">
                        <h2>Project Tasks</h2>
                        <div class="task-filters">
                            <button class="filter-btn active" data-filter="all">All (${projectTasks.length})</button>
                            <button class="filter-btn" data-filter="pending">Pending (${stats.pendingTasks})</button>
                            <button class="filter-btn" data-filter="in-progress">In Progress (${stats.inProgressTasks})</button>
                            <button class="filter-btn" data-filter="completed">Completed (${stats.completedTasks})</button>
                        </div>
                    </div>

                    <div class="tasks-container">
                        ${projectTasks.length > 0 ? `
                            <div class="tasks-grid">
                                ${projectTasks.map(task => window.ui ? window.ui.renderTaskCard(task) : '').join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-tasks"></i>
                                <h3>No tasks in this project</h3>
                                <p>Get started by adding your first task to this project!</p>
                                <button class="btn btn-primary" onclick="window.ui.openTaskModal({ projectId: '${project.id}' })">
                                    <i class="fas fa-plus"></i> Add First Task
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    // Analytics View
    analytics(options = {}) {
        if (!window.taskManager) {
            return '<div class="loading">Loading analytics...</div>';
        }

        const stats = window.taskManager.getStats();
        const allTasks = window.taskManager.getAllTasks();

        // Calculate additional analytics
        const analyticsData = this.calculateAnalytics(allTasks, stats);

        return `
            <div class="view-container">
                <div class="view-header">
                    <h1><i class="fas fa-chart-bar"></i> Analytics</h1>
                    <div class="view-actions">
                        <select id="analyticsTimeframe" onchange="window.Views.updateAnalytics(this.value)">
                            <option value="7">Last 7 days</option>
                            <option value="30" selected>Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                    </div>
                </div>

                <div class="analytics-container">
                    <!-- Overview Cards -->
                    <div class="analytics-overview">
                        <div class="analytics-card">
                            <div class="card-icon" style="background: var(--primary-color)">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="card-content">
                                <h3>${stats.total}</h3>
                                <p>Total Tasks</p>
                                <span class="card-trend ${analyticsData.taskTrend >= 0 ? 'positive' : 'negative'}">
                                    <i class="fas fa-arrow-${analyticsData.taskTrend >= 0 ? 'up' : 'down'}"></i>
                                    ${Math.abs(analyticsData.taskTrend)}% from last period
                                </span>
                            </div>
                        </div>

                        <div class="analytics-card">
                            <div class="card-icon" style="background: var(--success-color)">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="card-content">
                                <h3>${stats.completionRate}%</h3>
                                <p>Completion Rate</p>
                                <span class="card-trend ${analyticsData.completionTrend >= 0 ? 'positive' : 'negative'}">
                                    <i class="fas fa-arrow-${analyticsData.completionTrend >= 0 ? 'up' : 'down'}"></i>
                                    ${Math.abs(analyticsData.completionTrend)}% from last period
                                </span>
                            </div>
                        </div>

                        <div class="analytics-card">
                            <div class="card-icon" style="background: var(--warning-color)">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="card-content">
                                <h3>${analyticsData.avgCompletionTime}</h3>
                                <p>Avg. Completion Time</p>
                                <span class="card-trend neutral">
                                    <i class="fas fa-info-circle"></i>
                                    Days to complete
                                </span>
                            </div>
                        </div>

                        <div class="analytics-card">
                            <div class="card-icon" style="background: var(--error-color)">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="card-content">
                                <h3>${stats.overdue}</h3>
                                <p>Overdue Tasks</p>
                                <span class="card-trend ${analyticsData.overdueTrend <= 0 ? 'positive' : 'negative'}">
                                    <i class="fas fa-arrow-${analyticsData.overdueTrend <= 0 ? 'down' : 'up'}"></i>
                                    ${Math.abs(analyticsData.overdueTrend)}% from last period
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Charts Section -->
                    <div class="analytics-charts">
                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Task Completion Trend</h3>
                                <p>Daily task completion over time</p>
                            </div>
                            <div class="completion-trend-chart">
                                ${this.renderCompletionTrendChart(stats.weeklyStats)}
                            </div>
                        </div>

                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Priority Distribution</h3>
                                <p>Tasks by priority level</p>
                            </div>
                            <div class="priority-distribution-chart">
                                ${this.renderPriorityDistributionChart(stats.priorityStats)}
                            </div>
                        </div>

                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Category Breakdown</h3>
                                <p>Tasks by category</p>
                            </div>
                            <div class="category-breakdown-chart">
                                ${this.renderCategoryBreakdownChart(stats.categoryStats)}
                            </div>
                        </div>

                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Productivity Heatmap</h3>
                                <p>Task completion by day of week</p>
                            </div>
                            <div class="productivity-heatmap">
                                ${this.renderProductivityHeatmap(analyticsData.weeklyProductivity)}
                            </div>
                        </div>
                    </div>

                    <!-- Insights Section -->
                    <div class="analytics-insights">
                        <div class="insights-card">
                            <h3><i class="fas fa-lightbulb"></i> Insights & Recommendations</h3>
                            <div class="insights-list">
                                ${analyticsData.insights.map(insight => `
                                    <div class="insight-item">
                                        <i class="fas fa-${insight.icon}"></i>
                                        <div class="insight-content">
                                            <h4>${insight.title}</h4>
                                            <p>${insight.description}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Filter function for all tasks view
    filterAllTasks() {
        if (!window.taskManager || !window.ui) return;

        const statusFilter = document.getElementById('statusFilter');
        const priorityFilter = document.getElementById('priorityFilter');

        if (!statusFilter || !priorityFilter) return;

        const filters = {};

        if (statusFilter.value) {
            filters.status = statusFilter.value;
        }

        if (priorityFilter.value) {
            filters.priority = priorityFilter.value;
        }

        // Get filtered tasks
        const filteredTasks = window.taskManager.filterTasks(filters);

        // Update the tasks container
        const tasksContainer = document.querySelector('.tasks-grid');
        if (tasksContainer && window.ui.renderTaskCard) {
            tasksContainer.innerHTML = filteredTasks.length > 0 ?
                filteredTasks.map(task => window.ui.renderTaskCard(task)).join('') :
                '<div class="empty-state"><i class="fas fa-tasks"></i><h3>No tasks found</h3><p>Try adjusting your filters.</p></div>';
        }
    },

    // Calendar Helper Methods
    navigateCalendar(direction) {
        const currentUrl = new URL(window.location);
        const currentMonth = parseInt(currentUrl.searchParams.get('month')) || new Date().getMonth();
        const currentYear = parseInt(currentUrl.searchParams.get('year')) || new Date().getFullYear();

        let newMonth = currentMonth + direction;
        let newYear = currentYear;

        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }

        if (window.ui) {
            window.ui.showView('calendar', { month: newMonth, year: newYear });
        }
    },

    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    },

    renderCalendar(year, month, tasksWithDates) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        let html = `
            <div class="calendar-grid">
                <div class="calendar-header">
                    <div class="calendar-day-header">Sun</div>
                    <div class="calendar-day-header">Mon</div>
                    <div class="calendar-day-header">Tue</div>
                    <div class="calendar-day-header">Wed</div>
                    <div class="calendar-day-header">Thu</div>
                    <div class="calendar-day-header">Fri</div>
                    <div class="calendar-day-header">Sat</div>
                </div>
                <div class="calendar-body">
        `;

        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);

                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = currentDate.toDateString() === today.toDateString();
                const dayTasks = tasksWithDates.filter(task => {
                    const taskDate = new Date(task.dueDate);
                    return taskDate.toDateString() === currentDate.toDateString();
                });

                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';
                if (dayTasks.length > 0) dayClass += ' has-tasks';

                html += `
                    <div class="${dayClass}" data-date="${currentDate.toISOString().split('T')[0]}">
                        <div class="day-number">${currentDate.getDate()}</div>
                        <div class="day-tasks">
                            ${dayTasks.slice(0, 3).map(task => {
                                const isOverdue = new Date(task.dueDate) < today && task.status !== 'completed';
                                const taskClass = `task-dot ${task.status} ${isOverdue ? 'overdue' : ''}`;
                                return `<div class="${taskClass}" title="${task.title}"></div>`;
                            }).join('')}
                            ${dayTasks.length > 3 ? `<div class="task-more">+${dayTasks.length - 3}</div>` : ''}
                        </div>
                    </div>
                `;
            }
        }

        html += `
                </div>
            </div>
        `;

        return html;
    },

    // Analytics Helper Methods
    updateAnalytics(timeframe) {
        console.log('Updating analytics for timeframe:', timeframe);
        // This would typically refresh the analytics view with new data
        if (window.ui) {
            window.ui.refreshCurrentView();
        }
    },

    calculateAnalytics(tasks, stats) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Calculate average completion time
        const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedAt);
        let avgCompletionTime = 0;

        if (completedTasks.length > 0) {
            const totalTime = completedTasks.reduce((sum, task) => {
                const created = new Date(task.createdAt);
                const completed = new Date(task.completedAt);
                return sum + (completed - created);
            }, 0);
            avgCompletionTime = Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24));
        }

        // Calculate weekly productivity
        const weeklyProductivity = this.calculateWeeklyProductivity(tasks);

        // Generate insights
        const insights = this.generateInsights(tasks, stats);

        return {
            avgCompletionTime: avgCompletionTime || 'N/A',
            taskTrend: Math.floor(Math.random() * 20) - 10, // Simulated trend
            completionTrend: Math.floor(Math.random() * 15) - 5, // Simulated trend
            overdueTrend: Math.floor(Math.random() * 10) - 5, // Simulated trend
            weeklyProductivity,
            insights
        };
    },

    calculateWeeklyProductivity(tasks) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const productivity = {};

        days.forEach(day => {
            productivity[day] = Math.floor(Math.random() * 10); // Simulated data
        });

        return productivity;
    },

    generateInsights(tasks, stats) {
        const insights = [];

        if (stats.completionRate > 80) {
            insights.push({
                icon: 'trophy',
                title: 'Excellent Performance!',
                description: 'Your completion rate is above 80%. Keep up the great work!'
            });
        }

        if (stats.overdue > 5) {
            insights.push({
                icon: 'exclamation-triangle',
                title: 'Overdue Tasks Alert',
                description: 'You have several overdue tasks. Consider reviewing your priorities and deadlines.'
            });
        }

        if (stats.pending > stats.completed) {
            insights.push({
                icon: 'clock',
                title: 'Focus on Completion',
                description: 'You have more pending tasks than completed ones. Try to focus on finishing existing tasks.'
            });
        }

        const highPriorityPending = tasks.filter(t => t.priority === 'high' && t.status === 'pending').length;
        if (highPriorityPending > 0) {
            insights.push({
                icon: 'fire',
                title: 'High Priority Tasks',
                description: `You have ${highPriorityPending} high-priority tasks pending. Consider tackling these first.`
            });
        }

        if (insights.length === 0) {
            insights.push({
                icon: 'smile',
                title: 'Looking Good!',
                description: 'Your task management is on track. Keep maintaining this balance!'
            });
        }

        return insights;
    },

    // Chart Rendering Methods
    renderCompletionTrendChart(weeklyStats) {
        const maxCompleted = Math.max(...weeklyStats.map(day => day.completed), 1);

        return `
            <div class="trend-chart">
                ${weeklyStats.map((day, index) => `
                    <div class="trend-bar-container">
                        <div class="trend-bar" style="height: ${(day.completed / maxCompleted) * 100}%">
                            <div class="trend-value">${day.completed}</div>
                        </div>
                        <div class="trend-label">${day.day}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderPriorityDistributionChart(priorityStats) {
        const total = Object.values(priorityStats).reduce((sum, count) => sum + count, 0);
        const colors = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444',
            urgent: '#dc2626'
        };

        return `
            <div class="priority-chart">
                ${Object.entries(priorityStats).map(([priority, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return `
                        <div class="priority-bar-container">
                            <div class="priority-label">${priority}</div>
                            <div class="priority-bar">
                                <div class="priority-fill" style="width: ${percentage}%; background-color: ${colors[priority]}"></div>
                                <span class="priority-count">${count}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderCategoryBreakdownChart(categoryStats) {
        const total = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);

        return `
            <div class="category-chart">
                ${Object.entries(categoryStats).map(([category, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const color = ColorUtils.getCategoryColor(category);
                    return `
                        <div class="category-item">
                            <div class="category-color" style="background-color: ${color}"></div>
                            <div class="category-info">
                                <span class="category-name">${category}</span>
                                <span class="category-count">${count} tasks</span>
                            </div>
                            <div class="category-percentage">${percentage.toFixed(1)}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderProductivityHeatmap(weeklyProductivity) {
        const maxValue = Math.max(...Object.values(weeklyProductivity));

        return `
            <div class="heatmap">
                ${Object.entries(weeklyProductivity).map(([day, value]) => {
                    const intensity = maxValue > 0 ? value / maxValue : 0;
                    const opacity = 0.2 + (intensity * 0.8);
                    return `
                        <div class="heatmap-day">
                            <div class="heatmap-cell" style="background-color: rgba(59, 130, 246, ${opacity})" title="${day}: ${value} tasks">
                                <div class="heatmap-value">${value}</div>
                            </div>
                            <div class="heatmap-label">${day.substr(0, 3)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // Helper Methods
    renderWeeklyChart(weeklyStats) {
        const maxCompleted = Math.max(...weeklyStats.map(day => day.completed), 1);
        
        return `
            <div class="weekly-chart">
                ${weeklyStats.map(day => `
                    <div class="chart-bar">
                        <div class="bar" style="height: ${(day.completed / maxCompleted) * 100}%"></div>
                        <span class="bar-label">${day.day}</span>
                        <span class="bar-value">${day.completed}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderPriorityChart(priorityStats) {
        const total = Object.values(priorityStats).reduce((sum, count) => sum + count, 0);
        
        return `
            <div class="priority-chart">
                ${Object.entries(priorityStats).map(([priority, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const color = ColorUtils.getPriorityColor(priority);
                    
                    return `
                        <div class="priority-item">
                            <div class="priority-bar">
                                <div class="priority-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                            </div>
                            <div class="priority-info">
                                <span class="priority-label">${StringUtils.capitalize(priority)}</span>
                                <span class="priority-count">${count}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderProjectCard(project) {
        const stats = window.projectManager.getProjectStats(project.id);
        const progressPercentage = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

        return `
            <div class="project-card" onclick="window.ui.showView('project', { projectId: '${project.id}' })">
                <div class="project-header">
                    <div class="project-color" style="background-color: ${project.color || '#3b82f6'}"></div>
                    <h4 class="project-name">${project.name}</h4>
                </div>
                <div class="project-stats">
                    <div class="stat">
                        <span class="stat-value">${stats.totalTasks}</span>
                        <span class="stat-label">Tasks</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${stats.completedTasks}</span>
                        <span class="stat-label">Done</span>
                    </div>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">${progressPercentage}% Complete</span>
                </div>
                <div class="project-status">
                    <span class="status-badge status-${project.status}">${project.status}</span>
                </div>
            </div>
        `;
    },

    renderTaskItem(task) {
        const project = (task.projectId && window.projectManager) ? window.projectManager.getProject(task.projectId) : null;
        
        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-checkbox">
                    <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''}
                           onchange="window.toggleTaskStatus('${task.id}')">
                </div>
                <div class="task-content">
                    <h4 class="task-title">${task.title}</h4>
                    <div class="task-meta">
                        ${task.dueDate ? `
                            <span class="task-due ${DateUtils.isOverdue(task.dueDate) ? 'overdue' : ''}">
                                ${DateUtils.formatRelativeTime(task.dueDate)}
                            </span>
                        ` : ''}
                        ${project ? `
                            <span class="task-project" style="color: ${project.color}">
                                ${project.name}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-priority" style="background-color: ${ColorUtils.getPriorityColor(task.priority)}"></div>
            </div>
        `;
    },

    renderKanbanCard(task) {
        const project = (task.projectId && window.projectManager) ? window.projectManager.getProject(task.projectId) : null;
        
        return `
            <div class="kanban-card" data-task-id="${task.id}" draggable="true">
                <div class="card-header">
                    <h4>${task.title}</h4>
                    <div class="card-priority" style="background-color: ${ColorUtils.getPriorityColor(task.priority)}"></div>
                </div>
                
                ${task.description ? `<p class="card-description">${StringUtils.truncate(task.description, 100)}</p>` : ''}
                
                <div class="card-footer">
                    ${task.dueDate ? `
                        <span class="card-due ${DateUtils.isOverdue(task.dueDate) ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i> ${DateUtils.formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                    
                    ${project ? `
                        <span class="card-project" style="color: ${project.color}">
                            <i class="fas fa-folder"></i> ${project.name}
                        </span>
                    ` : ''}
                </div>
                
                <div class="card-actions">
                    <button onclick="window.editTask('${task.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="window.deleteTask('${task.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
};

// Helper function for toggling task status
window.toggleTaskStatus = function(taskId) {
    const task = window.taskManager.getTask(taskId);
    if (task) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        window.taskManager.updateTask(taskId, { status: newStatus });
        if (window.ui) {
            window.ui.refreshCurrentView();
        }
        
        const message = newStatus === 'completed' ? 'Task completed!' : 'Task reopened';
        NotificationUtils.show(message, 'success');
    }
};
