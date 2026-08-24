// --- STATE MANAGEMENT ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Work', 'Study', 'Personal'];
let currentView = 'dashboard';
let currentCategory = 'all';
let searchQuery = '';

// Sample Data if Empty
if (tasks.length === 0) {
    const sampleTasks = [
        { id: Date.now() + 1, title: "Complete Java DSA Practice", desc: "Practice arrays and strings for placement preparation.", date: "2026-08-25", time: "17:00", priority: "High", category: "Study", status: "todo", completed: false },
        { id: Date.now() + 2, title: "Finish Web Development Project", desc: "Build TaskFlow SaaS project.", date: "2026-08-24", time: "23:00", priority: "Medium", category: "Work", status: "inprogress", completed: false },
        { id: Date.now() + 3, title: "Submit College Assignment", desc: "Operating systems report submission.", date: "2026-08-24", time: "10:00", priority: "High", category: "Study", status: "completed", completed: true },
        { id: Date.now() + 4, title: "Update LinkedIn Profile", desc: "Add new projects and certificates.", date: "2026-08-30", time: "18:00", priority: "Low", category: "Personal", status: "todo", completed: false }
    ];
    tasks = sampleTasks;
    saveTasks();
}

// --- DOM ELEMENTS ---
const viewContainer = document.getElementById('viewContainer');
const pageTitle = document.getElementById('pageTitle');
const taskForm = document.getElementById('taskForm');
const sidebar = document.getElementById('sidebar');
const toastEl = document.getElementById('liveToast');
const toastInstance = new bootstrap.Toast(toastEl);

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderView();
    renderCustomLists();
    initTheme();
});

// --- NAVIGATION & ROUTING ---
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        if (e.target.closest('.add-list-btn')) return;
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const target = e.target.closest('.nav-link');
        target.classList.add('active');
        
        currentView = target.dataset.view;
        pageTitle.innerText = target.innerText.trim();
        
        if (window.innerWidth < 768) sidebar.classList.remove('show');
        renderView();
    });
});

// --- CORE FUNCTIONS ---
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderView() {
    let filteredTasks = filterTasks(tasks);
    
    if (searchQuery) {
        filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.desc.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (currentView === 'dashboard') {
        renderDashboard();
    } else if (currentView === 'calendar') {
        renderCalendar();
    } else if (currentView === 'kanban') {
        renderKanban();
    } else {
        renderListView(filteredTasks);
    }
}

// --- VIEW RENDERS ---

function renderDashboard() {
    const stats = calculateStats();
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    viewContainer.innerHTML = `
        <div class="row g-4 mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 class="fw-bold mb-1">Good Morning! 👋</h2>
                        <p class="text-muted">Stay organized and get things done.</p>
                    </div>
                    <button class="btn btn-primary btn-lg rounded-pill px-4" data-bs-toggle="modal" data-bs-target="#taskModal" onclick="prepareModal()">
                        <i class="fas fa-plus me-2"></i> Add Task
                    </button>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-5">
            ${renderStatCard('Total Tasks', stats.total, 'fa-tasks', 'primary')}
            ${renderStatCard('In Progress', stats.inprogress, 'fa-spinner', 'warning')}
            ${renderStatCard('Completed', stats.completed, 'fa-check-circle', 'success')}
            ${renderStatCard('Overdue', stats.overdue, 'fa-exclamation-triangle', 'danger')}
        </div>

        <div class="row g-4">
            <div class="col-md-8">
                <div class="stat-card h-100">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="fw-bold mb-0">Recent Tasks</h5>
                        <button class="btn btn-sm btn-light" onclick="setView('all')">View All</button>
                    </div>
                    <div id="recentTasksList">
                        ${renderTaskItems(tasks.slice(-4).reverse())}
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card h-100">
                    <h5 class="fw-bold mb-4">Today's Progress</h5>
                    <div class="text-center mb-4">
                        <div class="display-4 fw-bold text-primary">${progress}%</div>
                        <p class="text-muted">${stats.completed} / ${stats.total} Tasks Completed</p>
                    </div>
                    <div class="progress" style="height: 12px; border-radius: 10px;">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${progress}%"></div>
                    </div>
                    <div class="mt-4">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Study</span>
                            <span>${calculateCategoryProgress('Study')}%</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Work</span>
                            <span>${calculateCategoryProgress('Work')}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-12">
                 <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary active" onclick="setView('all')"><i class="fas fa-list me-1"></i> List</button>
                    <button class="btn btn-outline-primary" onclick="setView('kanban')"><i class="fas fa-columns me-1"></i> Board</button>
                    <button class="btn btn-outline-primary" onclick="setView('calendar')"><i class="fas fa-calendar me-1"></i> Calendar</button>
                </div>
            </div>
        </div>
    `;
}

function renderStatCard(title, count, icon, color) {
    return `
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-icon bg-${color} bg-opacity-10 text-${color}">
                    <i class="fas ${icon}"></i>
                </div>
                <h3 class="fw-bold mb-1">${count}</h3>
                <p class="text-muted mb-0 small fw-medium">${title}</p>
            </div>
        </div>
    `;
}

function renderListView(tasksToRender) {
    viewContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="d-flex gap-2">
                <select class="form-select form-select-sm" style="width: 150px;" id="sortSelect" onchange="sortTasks(this.value)">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="due">Due Date</option>
                    <option value="priority">Priority</option>
                </select>
            </div>
            <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#taskModal" onclick="prepareModal()">
                <i class="fas fa-plus me-1"></i> Add Task
            </button>
        </div>
        <div class="task-list-container">
            ${tasksToRender.length > 0 ? renderTaskItems(tasksToRender) : renderEmptyState()}
        </div>
    `;
}

function renderTaskItems(tasksArr) {
    return tasksArr.map(task => {
        const isOverdue = new Date(task.date) < new Date().setHours(0,0,0,0) && !task.completed;
        return `
            <div class="task-card ${task.completed ? 'completed' : ''}">
                <div class="d-flex align-items-start gap-3">
                    <div class="form-check pt-1">
                        <input class="form-check-input" type="checkbox" ${task.completed ? 'checked' : ''} 
                            onclick="toggleTaskStatus(${task.id})">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="task-title fw-bold mb-1">${task.title}</h6>
                            <span class="badge badge-${task.priority.toLowerCase()} mb-2">${task.priority}</span>
                        </div>
                        <p class="text-muted small mb-3">${task.desc}</p>
                        <div class="d-flex flex-wrap gap-3 align-items-center">
                            <span class="small text-muted"><i class="far fa-calendar me-1"></i> ${task.date}</span>
                            <span class="small text-muted"><i class="far fa-clock me-1"></i> ${task.time}</span>
                            <span class="small badge bg-light text-dark border">${task.category}</span>
                            ${isOverdue ? '<span class="badge bg-danger">OVERDUE</span>' : ''}
                            <div class="ms-auto">
                                <button class="btn btn-sm text-primary" onclick="editTask(${task.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm text-danger" onclick="confirmDelete(${task.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- KANBAN VIEW ---
function renderKanban() {
    const columns = [
        { id: 'todo', title: 'TO DO', color: 'secondary' },
        { id: 'inprogress', title: 'IN PROGRESS', color: 'warning' },
        { id: 'completed', title: 'COMPLETED', color: 'success' }
    ];

    viewContainer.innerHTML = `
        <div class="kanban-container">
            ${columns.map(col => `
                <div class="kanban-column" ondragover="allowDrop(event)" ondrop="drop(event, '${col.id}')">
                    <div class="kanban-header">
                        <h6 class="fw-bold mb-0">${col.title}</h6>
                        <span class="badge bg-white text-dark rounded-pill">${tasks.filter(t => t.status === col.id).length}</span>
                    </div>
                    <div class="kanban-tasks" id="${col.id}">
                        ${tasks.filter(t => t.status === col.id).map(task => `
                            <div class="task-card p-3 mb-2" draggable="true" ondragstart="drag(event, ${task.id})">
                                <h6 class="fw-bold small mb-2">${task.title}</h6>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge badge-${task.priority.toLowerCase()}" style="font-size: 0.6rem;">${task.priority}</span>
                                    <span class="text-muted" style="font-size: 0.7rem;">${task.date}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// --- CALENDAR VIEW ---
function renderCalendar() {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = date.toLocaleString('default', { month: 'long' });

    let calendarHtml = `
        <div class="stat-card">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold mb-0">${monthName} ${year}</h4>
            </div>
            <div class="calendar-grid">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                    <div class="calendar-day-header">${day}</div>
                `).join('')}
                ${Array(firstDay).fill('').map(() => `<div class="calendar-day bg-light"></div>`).join('')}
                ${Array.from({length: daysInMonth}, (_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayTasks = tasks.filter(t => t.date === dateStr);
                    return `
                        <div class="calendar-day">
                            <div class="fw-bold mb-1">${dayNum}</div>
                            ${dayTasks.map(t => `<div class="small text-truncate" style="font-size: 0.65rem;"><span class="task-dot badge-${t.priority.toLowerCase()}"></span>${t.title}</div>`).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    viewContainer.innerHTML = calendarHtml;
}

// --- TASK ACTIONS ---
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const taskData = {
        id: taskId ? parseInt(taskId) : Date.now(),
        title: document.getElementById('taskTitle').value,
        desc: document.getElementById('taskDesc').value,
        date: document.getElementById('taskDate').value,
        time: document.getElementById('taskTime').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value,
        status: document.getElementById('taskStatus').value,
        completed: document.getElementById('taskStatus').value === 'completed'
    };

    if (taskId) {
        const index = tasks.findIndex(t => t.id === parseInt(taskId));
        tasks[index] = taskData;
        showToast("Task updated successfully");
    } else {
        tasks.push(taskData);
        showToast("Task created successfully");
    }

    saveTasks();
    bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
    renderView();
});

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    task.status = task.completed ? 'completed' : 'todo';
    saveTasks();
    renderView();
    showToast(task.completed ? "Task marked as completed" : "Task moved to Active");
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderView();
    showToast("Task deleted successfully");
    bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    document.getElementById('taskModalLabel').innerText = "Edit Task";
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDesc').value = task.desc;
    document.getElementById('taskDate').value = task.date;
    document.getElementById('taskTime').value = task.time;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('saveTaskBtn').innerText = "Save Changes";
    
    new bootstrap.Modal(document.getElementById('taskModal')).show();
}

// --- UTILITIES ---
function calculateStats() {
    const now = new Date().setHours(0,0,0,0);
    return {
        total: tasks.length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        completed: tasks.filter(t => t.completed).length,
        overdue: tasks.filter(t => new Date(t.date) < now && !t.completed).length
    };
}

function filterTasks(arr) {
    const now = new Date().setHours(0,0,0,0);
    const todayStr = new Date().toISOString().split('T')[0];

    if (currentView === 'today') return arr.filter(t => t.date === todayStr);
    if (currentView === 'upcoming') return arr.filter(t => new Date(t.date) > now);
    if (currentView === 'completed') return arr.filter(t => t.completed);
    if (categories.includes(currentView)) return arr.filter(t => t.category === currentView);
    return arr;
}

function sortTasks(criteria) {
    if (criteria === 'due') tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (criteria === 'newest') tasks.sort((a, b) => b.id - a.id);
    if (criteria === 'priority') {
        const pMap = { 'High': 1, 'Medium': 2, 'Low': 3 };
        tasks.sort((a, b) => pMap[a.priority] - pMap[b.priority]);
    }
    renderView();
}

function showToast(msg) {
    document.getElementById('toastMessage').innerText = msg;
    toastInstance.show();
}

function renderEmptyState() {
    return `
        <div class="text-center py-5">
            <i class="fas fa-clipboard-check text-muted mb-3" style="font-size: 3rem;"></i>
            <h4>No tasks found</h4>
            <p class="text-muted">You're all caught up or try a different search.</p>
        </div>
    `;
}

// --- DRAG & DROP ---
function drag(ev, id) { ev.dataTransfer.setData("taskId", id); }
function allowDrop(ev) { ev.preventDefault(); }
function drop(ev, status) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.id == id);
    task.status = status;
    task.completed = status === 'completed';
    saveTasks();
    renderView();
}

// --- THEME & SEARCH ---
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon me-2"></i> Dark Mode' : '<i class="fas fa-sun me-2"></i> Light Mode';
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun me-2"></i> Light Mode' : '<i class="fas fa-moon me-2"></i> Dark Mode';
}

document.getElementById('globalSearch').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderView();
});

// Sidebar Mobile Toggle
document.getElementById('openSidebar').addEventListener('click', () => sidebar.classList.add('show'));
document.getElementById('closeSidebar').addEventListener('click', () => sidebar.classList.remove('show'));

function setView(view) {
    currentView = view;
    renderView();
}

function prepareModal() {
    taskForm.reset();
    document.getElementById('taskId').value = "";
    document.getElementById('taskModalLabel').innerText = "Create New Task";
    document.getElementById('saveTaskBtn').innerText = "Create Task";
}

function confirmDelete(id) {
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
    document.getElementById('confirmDeleteBtn').onclick = () => deleteTask(id);
}

function renderCustomLists() {
    const listContainer = document.getElementById('custom-lists');
    listContainer.innerHTML = categories.map(cat => `
        <a href="#" class="nav-link" data-view="${cat}">
            <i class="fas fa-list-ul"></i> ${cat}
        </a>
    `).join('');
    
    // Re-attach event listeners to new links
    listContainer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            currentView = e.target.closest('.nav-link').dataset.view;
            pageTitle.innerText = currentView;
            renderView();
        });
    });
}

document.getElementById('saveListBtn').addEventListener('click', () => {
    const name = document.getElementById('newListInput').value.trim();
    if (name && !categories.includes(name)) {
        categories.push(name);
        localStorage.setItem('categories', JSON.stringify(categories));
        renderCustomLists();
        bootstrap.Modal.getInstance(document.getElementById('newListModal')).hide();
    }
});

function calculateCategoryProgress(cat) {
    const catTasks = tasks.filter(t => t.category === cat);
    if (catTasks.length === 0) return 0;
    const completed = catTasks.filter(t => t.completed).length;
    return Math.round((completed / catTasks.length) * 100);
}