// Configuration
const API_BASE_URL = 'http://localhost:5678/webhook';

// Global variables
let currentTasks = [];
let currentCategory = 'all';
let currentEditingTask = null;

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
        renderTasks(data.categories);
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
    
    // Add "All" button
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = 'All Categories';
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
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTasks(currentTasks.categories);
}

// Render tasks
function renderTasks(categories) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
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
    for (const category of currentTasks.categories) {
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
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting CSV');
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('notesModal');
    if (event.target === modal) {
        closeNotesModal();
    }
}