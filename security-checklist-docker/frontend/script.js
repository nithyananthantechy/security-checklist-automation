// Configuration - Using the specific URLs provided for each n8n webhook
const GET_TASKS_URL = 'http://localhost:5678/webhook/security-tasks';
const EXPORT_CSV_URL = 'http://localhost:5678/webhook/export';
const UPDATE_TASK_URL = 'http://localhost:5678/webhook/update-task';
const GET_PROGRESS_URL = 'http://localhost:5678/webhook/progress';
const MARK_ALL_COMPLETE_URL = 'http://localhost:5678/webhook-test/mark-all-complete'; // Assuming a new webhook for this action
// Removed: const RESET_WEEK_URL = 'http://localhost:5678/webhook-test/reset-week'; // This will now be client-side
const AUTOMATION_STATUS_URL = 'http://localhost:5678/webhook/automation-status'; // New webhook for automation status

// Global variables
let currentTasks = [];
let currentCategory = 'all';
let currentEditingTask = null; // Stores the ID of the task being edited
let autoRefreshInterval = null;
let searchDebounce = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
    loadChecklist();
    loadProgress(); // Load progress stats separately

    // Initialize auto-refresh and compact view based on local storage
    if (localStorage.getItem('autoRefresh') === 'true') {
        const autoRefreshCheckbox = document.getElementById('autoRefresh');
        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.checked = true;
            toggleAutoRefresh(true); // Pass true to indicate initial load
        }
    }
    if (localStorage.getItem('compactView') === 'true') {
        const compactViewCheckbox = document.getElementById('compactView');
        if (compactViewCheckbox) {
            compactViewCheckbox.checked = true;
            toggleCompactView(true); // Pass true to indicate initial load
        }
    }
});

// Load checklist data
async function loadChecklist() {
    try {
        showLoading();
        const response = await fetch(GET_TASKS_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        const data = await response.json();
        
        currentTasks = data;
        renderCategoryFilter(data.categories);
        filterTasks('all');
        hideLoading();
        
    } catch (error) {
        console.error('Error loading checklist:', error);
        hideLoading();
        alert(`Error loading checklist. Please check if n8n is running and the security-tasks webhook URL is correct. Details: ${error.message}`);
    }
}

// Load progress stats
async function loadProgress() {
    try {
        const response = await fetch(GET_PROGRESS_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        const data = await response.json();
        updateProgress(data);
    } catch (error) {
        console.error('Error loading progress stats:', error);
        // Don't show a blocking alert for this, just log it.
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
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
}

// Render category filter buttons
function renderCategoryFilter(categories) {
    const filterContainer = document.getElementById('categoryFilter');
    if (!filterContainer) return;
    filterContainer.innerHTML = '';
    if (!categories || !Array.isArray(categories)) return;
    
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = 'All Categories';
    allButton.onclick = () => filterTasks('all');
    filterContainer.appendChild(allButton);
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        // Display completed/total tasks next to category name
        button.innerHTML = `${category.name} (${category.completed_tasks || 0}/${category.total_tasks || 0})`;
        button.onclick = () => filterTasks(category.name);
        filterContainer.appendChild(button);
    });
}

// Filter tasks by category
function filterTasks(category) {
    if (category) currentCategory = category;

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.startsWith(currentCategory) || (currentCategory === 'all' && btn.textContent.startsWith('All Categories')));
    });

    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';
    const searchTokens = (document.getElementById('taskSearch')?.value.trim().toLowerCase() || '').split(/\s+/).filter(Boolean);

    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    let anyTaskShown = false;

    (currentTasks.categories || []).forEach(cat => {
        if (currentCategory !== 'all' && currentCategory !== cat.name) return;

        const filteredTasks = (cat.tasks || []).filter(task => {
            if (priority !== 'all' && task.priority !== priority) return false;
            if (status === 'completed' && !task.completed) return false;
            if (status === 'pending' && task.completed) return false;
            if (searchTokens.length) {
                const hay = `${task.name || ''} ${task.description || ''}`.toLowerCase();
                return searchTokens.every(tok => hay.includes(tok));
            }
            return true;
        });

        if (filteredTasks.length > 0) {
            anyTaskShown = true;
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            categorySection.innerHTML = `<div class="category-header"><h2 class="category-title">${cat.name}</h2><div class="category-progress">${cat.progress}%</div></div>`;
            const tasksList = document.createElement('div');
            tasksList.className = 'tasks-list';
            filteredTasks.forEach(task => tasksList.appendChild(createTaskElement(task)));
            categorySection.appendChild(tasksList);
            container.appendChild(categorySection);
        }
    });

    document.getElementById('noResults').style.display = anyTaskShown ? 'none' : 'block';
}

// Create task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
    taskDiv.innerHTML = `
        <div class="task-checkbox"><input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id}, this.checked)"></div>
        <div class="task-content">
            <div class="task-header">
                <div class="task-name">${task.name}</div>
                <div class="task-priority priority-${task.priority}">${task.priority}</div>
            </div>
            <p class="task-description">${task.description}</p>
            ${task.notes && task.notes.trim() !== '' ? `<div class="task-notes-display"><i class="fas fa-sticky-note"></i> ${task.notes}</div>` : ''}
            <div class="task-actions">
                <button class="btn-secondary btn-notes" onclick="openNotesModal(${task.id})">
                    <i class="fas fa-edit"></i> ${task.notes && task.notes.trim() !== '' ? 'Edit Notes' : 'Add Notes'}
                </button>
            </div>
        </div>`;
    return taskDiv;
}

// Toggle task completion
async function toggleTask(taskId, completed) {
    try {
        await fetch(UPDATE_TASK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, completed, completedBy: 'web_user' })
        });
        // Re-load both checklist and progress for updated stats
        loadChecklist();
        loadProgress();
    } catch (error) {
        console.error('Error updating task status:', error);
        alert(`Error updating task status. Check console for details. Details: ${error.message}`);
    }
}

// Notes modal functions
function openNotesModal(taskId) {
    currentEditingTask = taskId;
    const task = findTaskById(taskId);
    if (!task) {
        console.error('Task not found for ID:', taskId);
        alert('Error: Task details could not be loaded.');
        return;
    }

    document.getElementById('notesTextarea').value = task.notes || '';
    document.getElementById('taskPreview').innerHTML = `<strong>${task.name}</strong><br>${task.description}`;
    document.getElementById('notesModal').style.display = 'block';
    updateCharCount(); // Initialize character count
    document.getElementById('notesTextarea').addEventListener('input', updateCharCount);
}

function closeNotesModal() {
    document.getElementById('notesModal').style.display = 'none';
    currentEditingTask = null;
    document.getElementById('notesTextarea').removeEventListener('input', updateCharCount);
}

async function saveNotes() {
    if (!currentEditingTask) return;
    
    const notes = document.getElementById('notesTextarea').value;
    
    try {
        const response = await fetch(UPDATE_TASK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: currentEditingTask, notes: notes, completedBy: 'web_user' })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        closeNotesModal();
        loadChecklist(); // Reload to show updated notes
        loadProgress(); // Update progress stats
    } catch (error) {
        console.error('Error saving notes:', error);
        alert(`Error saving notes. Check console for details. Details: ${error.message}`);
    }
}

// Helper to find task by ID
function findTaskById(taskId) {
    for (const category of currentTasks.categories) {
        const task = category.tasks.find(t => t.id === taskId);
        if (task) return task;
    }
    return null;
}

// Character count for notes textarea
function updateCharCount() {
    const textarea = document.getElementById('notesTextarea');
    const charCount = document.getElementById('charCount');
    if (textarea && charCount) {
        charCount.textContent = textarea.value.length;
    }
}

// Export to CSV
async function exportToCSV() {
    try {
        const response = await fetch(EXPORT_CSV_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        const data = await response.json();
        const blob = new Blob([data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert(`Error exporting CSV report. Check console for details. Details: ${error.message}`);
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

// Search and filter helpers
function searchTasks() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(filterTasks, 300);
}

function clearFilters() {
    document.getElementById('priorityFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('taskSearch').value = '';
    filterTasks();
}

// --- MODAL FUNCTIONS ---
function showHelp() {
    document.getElementById('helpModal').style.display = 'block';
}
function closeHelpModal() {
    document.getElementById('helpModal').style.display = 'none';
}

async function showAutomationStatus() {
    const modalBody = document.getElementById('automationModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i> Loading Automation Status...</p>';
    document.getElementById('automationModal').style.display = 'block';

    try {
        const response = await fetch(AUTOMATION_STATUS_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        const data = await response.json(); // Expecting an array of automation items

        if (data && data.length > 0) {
            modalBody.innerHTML = `
                <div class="automation-list">
                    ${data.map(item => `
                        <div class="automation-item">
                            <i class="fas fa-${item.icon || 'robot'}"></i>
                            <div class="automation-info">
                                <span class="automation-name">${item.name}</span>
                                <span class="automation-details">${item.details || ''}</span>
                            </div>
                            <span class="automation-status status-${item.status.toLowerCase()}">${item.status}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            modalBody.innerHTML = '<p class="text-center">No automation status data available.</p>';
        }

    } catch (error) {
        console.error('Error loading automation status:', error);
        modalBody.innerHTML = `<p class="text-center text-error">Error loading automation status. <br>Details: ${error.message}</p>`;
    }
}

function closeAutomationModal() {
    document.getElementById('automationModal').style.display = 'none';
}

// --- ACTION BUTTONS ---
async function markAllComplete() {
    if (!confirm('Are you sure you want to mark all tasks as complete?')) return;
    try {
        const response = await fetch(MARK_ALL_COMPLETE_URL, { // Using dedicated webhook URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completedBy: 'web_user' })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        loadChecklist();
        loadProgress();
    } catch (error) {
        console.error('Error marking all tasks complete:', error);
        alert(`Error marking all tasks complete. Check console for details. Details: ${error.message}`);
    }
}
async function resetWeek() {
    if (!confirm('Are you sure you want to reset all tasks for the week? This will mark all tasks as pending.')) return;
    // Client-side reset: simply reload data, assuming n8n provides the fresh state
    loadChecklist();
    loadProgress();
    alert('Checklist reset initiated. Please ensure your n8n backend is configured to provide a fresh state on data load.');
}

// --- VIEW OPTIONS ---
function toggleAutoRefresh(initialLoad = false) {
    const cb = document.getElementById('autoRefresh');
    if (!cb) return;

    if (cb.checked) {
        if (!initialLoad) localStorage.setItem('autoRefresh', 'true');
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        autoRefreshInterval = setInterval(() => {
            loadChecklist();
            loadProgress();
        }, 30000); // Refresh every 30 seconds
    } else {
        if (!initialLoad) localStorage.setItem('autoRefresh', 'false');
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }
}

function toggleCompactView(initialLoad = false) {
    const container = document.querySelector('main.container');
    if (!container) return;

    if (document.getElementById('compactView').checked) {
        if (!initialLoad) localStorage.setItem('compactView', 'true');
        container.classList.add('compact-view');
    } else {
        if (!initialLoad) localStorage.setItem('compactView', 'false');
        container.classList.remove('compact-view');
    }
}

// --- MISC HELPERS ---
function generatePDF() { window.print(); }
function clearSearch() { document.getElementById('taskSearch').value = ''; filterTasks(); }
