// Configuration
const API_BASE_URL = 'http://localhost:5678/webhook';

// Global variables
let currentTasks = [];
let currentCategory = 'all';
let currentEditingTask = null;
let autoRefreshInterval = null;
let searchDebounce = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadChecklist();
});

// Load checklist data
async function loadChecklist() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/security-tasks`);
        const data = await response.json();
        
        currentTasks = data;
        updateProgress(data);
        renderCategoryFilter(data.categories);
        // Render using filters (defaults to show all)
        filterTasks('all');
        hideLoading();
        
    } catch (error) {
        console.error('Error loading checklist:', error);
        hideLoading();
        alert('Error loading checklist. Please check if n8n is running.');
    }
}

// Update progress display
function updateProgress(data) {
    const overallProgress = data.overall_progress || 0;
    const completedTasks = data.completed_tasks || 0;
    const totalTasks = data.total_tasks || 42;
    
    document.getElementById('overallProgress').textContent = `${overallProgress}%`;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('progressFill').style.width = `${overallProgress}%`;
}

// Render category filter buttons
function renderCategoryFilter(categories) {
    const filterContainer = document.getElementById('categoryFilter');
    filterContainer.innerHTML = '';
    if (!categories || !Array.isArray(categories)) return;
    
    // Add "All" button
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = 'All Categories';
    allButton.dataset.category = 'all';
    allButton.onclick = () => filterTasks('all');
    filterContainer.appendChild(allButton);
    
    // Add category buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.innerHTML = `
            <i class="fas fa-${getCategoryIcon(category.name)}"></i>
            ${category.name} (${category.completed_tasks}/${category.total_tasks})
        `;
        button.dataset.category = category.name;
        button.onclick = () => filterTasks(category.name);
        filterContainer.appendChild(button);
    });
}

// Get icon for category
function getCategoryIcon(categoryName) {
    const icons = {
        'Network Security': 'shield-alt',
        'Server & Endpoint': 'server',
        'Windows Patch Management': 'download',
        'Access Management': 'key',
        'Vulnerability Management': 'exclamation-triangle',
        'Backup & Recovery': 'save',
        'Compliance & Monitoring': 'chart-bar'
    };
    return icons[categoryName] || 'tasks';
}

// Filter tasks by category
function filterTasks(category) {
    // category is optional; if provided update currentCategory
    if (category) currentCategory = category;

    // Update active button (buttons have dataset.category)
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.dataset.category === currentCategory || (currentCategory === 'all' && btn.dataset.category === 'all')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Read other filters
    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';
    const rawSearch = document.getElementById('taskSearch')?.value.trim().toLowerCase() || '';
    const search = rawSearch;
    const searchTokens = search.length ? rawSearch.split(/\s+/).filter(Boolean) : [];

    // Render filtered tasks
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';

    const categories = currentTasks.categories || [];
    let anyTaskShown = false;

    categories.forEach(category => {
        if (currentCategory !== 'all' && currentCategory !== category.name) return;

        // filter tasks within this category
        const filteredTasks = (category.tasks || []).filter(task => {
            // priority filter
            if (priority !== 'all' && task.priority !== priority) return false;
            // status filter
            if (status === 'completed' && !task.completed) return false;
            if (status === 'pending' && task.completed) return false;
            // search filter
            if (searchTokens.length) {
                const hay = `${task.name || ''} ${task.description || ''} ${task.automation_method || ''} ${task.notes || ''}`.toLowerCase();
                // require all tokens to be present (AND search). Matches substrings.
                const ok = searchTokens.every(tok => hay.includes(tok));
                if (!ok) return false;
            }
            return true;
        });

        if (filteredTasks.length === 0) return;

        anyTaskShown = true;

        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <i class="fas fa-${getCategoryIcon(category.name)}" style="color: ${category.color}"></i>
                    ${category.name}
                </div>
                <div class="category-progress" style="color: ${category.color}">
                    ${category.progress}% Complete (${category.completed_tasks}/${category.total_tasks})
                </div>
            </div>
            <div class="tasks-list" id="tasks-${category.name.replace(/\s+/g, '-')}"></div>
        `;

        container.appendChild(categorySection);

        const tasksList = categorySection.querySelector('.tasks-list');
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task, category.color);
            tasksList.appendChild(taskElement);
        });
    });

    document.getElementById('noResults').style.display = anyTaskShown ? 'none' : 'block';
}

// Render tasks
function renderTasks(categories) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    if (!categories || !Array.isArray(categories)) return;
    
    categories.forEach(category => {
        if (currentCategory !== 'all' && currentCategory !== category.name) {
            return;
        }
        
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <i class="fas fa-${getCategoryIcon(category.name)}" style="color: ${category.color}"></i>
                    ${category.name}
                </div>
                <div class="category-progress" style="color: ${category.color}">
                    ${category.progress}% Complete (${category.completed_tasks}/${category.total_tasks})
                </div>
            </div>
            <div class="tasks-list" id="tasks-${category.name.replace(/\s+/g, '-')}"></div>
        `;
        
        container.appendChild(categorySection);
        
        // Render tasks for this category
        const tasksList = categorySection.querySelector('.tasks-list');
        category.tasks.forEach(task => {
            const taskElement = createTaskElement(task, category.color);
            tasksList.appendChild(taskElement);
        });
    });
}

// Create task element
function createTaskElement(task, categoryColor) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
    taskDiv.innerHTML = `
        <div class="task-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id}, this.checked)">
        </div>
        <div class="task-content">
            <div class="task-header">
                <div class="task-name ${task.completed ? 'task-completed' : ''}">${task.name}</div>
                <div class="task-priority priority-${task.priority}">${task.priority}</div>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-automation">
                <i class="fas fa-robot"></i> Automation: ${task.automation_method}
            </div>
            ${task.notes ? `<div class="task-notes"><strong>Notes:</strong> ${task.notes}</div>` : ''}
            <div class="task-actions">
                <button class="btn-notes" onclick="openNotesModal(${task.id})">
                    <i class="fas fa-edit"></i> ${task.notes ? 'Edit Notes' : 'Add Notes'}
                </button>
            </div>
        </div>
    `;
    
    return taskDiv;
}

// Toggle task completion
async function toggleTask(taskId, completed) {
    try {
        const response = await fetch(`${API_BASE_URL}/update-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                taskId: taskId,
                completed: completed,
                completedBy: 'web_user'
            })
        });
        
        if (response.ok) {
            // Reload the checklist to get updated data
            loadChecklist();
        } else {
            alert('Error updating task');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Error updating task');
    }
}

// Notes modal functions
function openNotesModal(taskId) {
    currentEditingTask = taskId;
    const task = findTaskById(taskId);
    const textarea = document.getElementById('notesTextarea');
    textarea.value = task?.notes || '';
    document.getElementById('notesModal').style.display = 'block';
}

function closeNotesModal() {
    document.getElementById('notesModal').style.display = 'none';
    currentEditingTask = null;
}

async function saveNotes() {
    if (!currentEditingTask) return;
    
    const notes = document.getElementById('notesTextarea').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/update-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                taskId: currentEditingTask,
                notes: notes,
                completedBy: 'web_user'
            })
        });
        
        if (response.ok) {
            closeNotesModal();
            loadChecklist(); // Reload to show updated notes
        } else {
            alert('Error saving notes');
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        alert('Error saving notes');
    }
}

// Find task by ID
function findTaskById(taskId) {
    if (!currentTasks || !currentTasks.categories) return null;
    for (const category of currentTasks.categories) {
        if (!category || !Array.isArray(category.tasks)) continue;
        const task = category.tasks.find(t => t.id === taskId);
        if (task) return task;
    }
    return null;
}

// Export to CSV
async function exportToCSV() {
    try {
        const response = await fetch(`${API_BASE_URL}/export`);
        const data = await response.json();
        
        // Create download link
        const blob = new Blob([data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('CSV export started', { type: 'success' });
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showToast('Error exporting CSV', { type: 'error' });
    }
}

// Loading functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('tasksContainer').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('tasksContainer').style.display = 'block';
}

// Search box handlers
function searchTasks() {
    // Debounced search to avoid rapid re-renders while typing
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        filterTasks();
        searchDebounce = null;
    }, 180);
}

function clearSearch() {
    const input = document.getElementById('taskSearch');
    if (input) input.value = '';
    filterTasks();
    if (input) input.focus();
}

// Close modal when clicking outside
window.onclick = function(event) {
    // If click outside any open modal, close it
    const modals = ['notesModal', 'automationModal', 'helpModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && event.target === modal) {
            // call respective closer if exists
            if (id === 'notesModal') closeNotesModal();
            if (id === 'automationModal') closeAutomationModal();
            if (id === 'helpModal') closeHelpModal();
        }
    });
};

// Close modals on Escape
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeNotesModal();
        closeAutomationModal();
        closeHelpModal();
    }
});

// ---- Helper UI functions referenced from index.html ----
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    try { localStorage.setItem('darkMode', isDark ? '1' : '0'); } catch (e) {}
}

function showHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.style.display = 'block';
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.style.display = 'none';
}

function showAutomationStatus() {
    const modal = document.getElementById('automationModal');
    if (modal) modal.style.display = 'block';
}

function closeAutomationModal() {
    const modal = document.getElementById('automationModal');
    if (modal) modal.style.display = 'none';
}

async function markAllComplete() {
    if (!confirm('Mark all tasks as complete?')) return;
    try {
        const resp = await fetch(`${API_BASE_URL}/mark-all`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({completedBy:'web_user'}) });
        if (resp.ok) {
            loadChecklist();
            return;
        }
    } catch (e) {
        console.warn('markAllComplete: remote call failed, applying locally', e);
    }
    // Fallback: mark locally
    if (currentTasks && Array.isArray(currentTasks.categories)) {
        currentTasks.categories.forEach(cat => {
            if (Array.isArray(cat.tasks)) cat.tasks.forEach(t => t.completed = true);
        });
        filterTasks();
    }
}

async function resetWeek() {
    if (!confirm('Reset all tasks for the week? This will mark tasks as pending.')) return;
    try {
        const resp = await fetch(`${API_BASE_URL}/reset-week`, { method: 'POST' });
        if (resp.ok) {
            loadChecklist();
            return;
        }
    } catch (e) {
        console.warn('resetWeek: remote call failed, applying locally', e);
    }
    // Fallback: reset locally
    if (currentTasks && Array.isArray(currentTasks.categories)) {
        currentTasks.categories.forEach(cat => {
            if (Array.isArray(cat.tasks)) cat.tasks.forEach(t => { t.completed = false; t.notes = t.notes || ''; });
        });
        filterTasks();
    }
}

function generatePDF() {
    // Simple fallback: print page
    window.print();
    showToast('Print dialog opened', { type: 'info' });
}

function toggleAutoRefresh() {
    const cb = document.getElementById('autoRefresh');
    if (!cb) return;
    if (cb.checked) {
        // start interval
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        autoRefreshInterval = setInterval(loadChecklist, 30000);
    } else {
        if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
    }
}

function toggleCompactView() {
    const container = document.querySelector('.container');
    if (!container) return;
    container.classList.toggle('compact-view');
}

// Small toast helper for user feedback
function showToast(message, opts = {}) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const type = opts.type || 'default';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '8px';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    toast.style.fontWeight = '600';
    toast.style.background = type === 'error' ? '#e53e3e' : (type === 'success' ? '#38a169' : '#4a5568');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
    }, 2400);
    setTimeout(() => { try { container.removeChild(toast); } catch (e) {} }, 2800);
}