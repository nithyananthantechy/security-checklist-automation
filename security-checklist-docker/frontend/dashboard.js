// --- CHART.JS GLOBAL CONFIG ---
Chart.defaults.color = '#a0aec0';
Chart.defaults.borderColor = '#2d3748';

// --- MOCK API & DATA SIMULATION ---
function getMockDashboardData() {
    const taskStates = ['Ready', 'Running', 'Disabled'];
    const taskState = taskStates[Math.floor(Math.random() * taskStates.length)];
    const lastTaskResult = Math.random() > 0.9 ? 'ERROR' : 'SUCCESS';

    return {
        serverInfo: {
            serverName: "DC-ADSERVER-PROD",
            domainName: "desicrew.in",
            uptime: `${Math.floor(Math.random() * 45) + 5}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`
        },
        adStats: {
            usersCreatedToday: Math.floor(Math.random() * 8),
            passwordsResetToday: Math.floor(Math.random() * 25),
            usersDisabledToday: Math.floor(Math.random() * 4),
            domainUnlocksToday: Math.floor(Math.random() * 18),
            totalUsers: 2354,
            enabledUsers: 1736,
            disabledUsers: 618,
            lockedUsers: Math.floor(Math.random() * 10),
        },
        taskInfo: {
            state: taskState,
            lastRunTime: new Date(Date.now() - Math.random() * 3600000).toLocaleString(),
            nextRunTime: new Date(Date.now() + 3600000).toLocaleString(),
            lastTaskResult: lastTaskResult,
        },
        logs: [
            { time: new Date(Date.now() - 60000).toLocaleTimeString(), action: "Automation Cycle Completed", status: "SUCCESS" },
            { time: new Date(Date.now() - 120000).toLocaleTimeString(), action: "AD User 'J.Doe' created", status: "SUCCESS" },
            { time: new Date(Date.now() - 180000).toLocaleTimeString(), action: "Freshservice API Check", status: "SUCCESS" },
            { time: new Date(Date.now() - 240000).toLocaleTimeString(), action: "Password reset for 'S.Smith'", status: "SUCCESS" },
            { time: new Date(Date.now() - 300000).toLocaleTimeString(), action: "Backup system check failed", status: "ERROR" },
        ]
    };
}

// --- CHART CREATION ---
let activityChart, adUsersChart;

function createCharts() {
    const activityCtx = document.getElementById('activityDonutChart').getContext('2d');
    activityChart = new Chart(activityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Users Created', 'Passwords Reset', 'Users Disabled', 'Domain Unlocks'],
            datasets: [{
                label: 'Today\'s Activity',
                data: [0, 0, 0, 0],
                backgroundColor: ['#319795', '#38a169', '#dd6b20', '#805ad5'],
                borderWidth: 1,
                borderColor: '#1a202c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#a0aec0' } } }
        }
    });

    const adUsersCtx = document.getElementById('adUsersBarChart').getContext('2d');
    adUsersChart = new Chart(adUsersCtx, {
        type: 'bar', // CHANGED back to 'bar' for stability
        data: {
            labels: ['Total', 'Enabled', 'Disabled', 'Locked'],
            datasets: [{
                label: 'AD User Accounts',
                data: [0, 0, 0, 0],
                backgroundColor: ['#3182ce', '#38a169', '#dd6b20', '#c53030'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { beginAtZero: true, ticks: { color: '#a0aec0' } },
                x: { ticks: { color: '#a0aec0' } }
            }
        }
    });
}

// --- UI UPDATE FUNCTIONS ---
function updateDashboard(data) {
    // Update Last Updated Time
    document.getElementById('last-updated-time').textContent = new Date().toLocaleString();

    // Top Stats Grid
    document.getElementById('users-created').textContent = data.adStats.usersCreatedToday;
    document.getElementById('passwords-reset').textContent = data.adStats.passwordsResetToday;
    document.getElementById('users-disabled').textContent = data.adStats.usersDisabledToday;
    document.getElementById('domain-unlocks').textContent = data.adStats.domainUnlocksToday;
    
    const systemStatusEl = document.getElementById('system-status');
    systemStatusEl.textContent = data.taskInfo.lastTaskResult === 'SUCCESS' ? '✅' : '❌';
    systemStatusEl.className = `stat-number ${data.taskInfo.lastTaskResult === 'SUCCESS' ? 'success' : 'danger'}`;

    // Automation Status Card
    const taskStateEl = document.getElementById('task-state');
    taskStateEl.textContent = data.taskInfo.state;
    taskStateEl.className = `status-badge status-${data.taskInfo.state === 'Ready' ? 'success' : 'error'}`;

    document.getElementById('last-run-time').textContent = data.taskInfo.lastRunTime;
    document.getElementById('next-run-time').textContent = data.taskInfo.nextRunTime;

    const lastTaskResultEl = document.getElementById('last-task-result');
    lastTaskResultEl.textContent = data.taskInfo.lastTaskResult;
    lastTaskResultEl.className = `status-badge status-${data.taskInfo.lastTaskResult === 'SUCCESS' ? 'success' : 'error'}`;

    // System Info Card
    document.getElementById('info-server').textContent = data.serverInfo.serverName;
    document.getElementById('info-domain').textContent = data.serverInfo.domainName;
    document.getElementById('info-uptime').textContent = data.serverInfo.uptime;

    // AD Stats Card
    document.getElementById('ad-total-users').textContent = data.adStats.totalUsers;
    document.getElementById('ad-enabled-users').textContent = data.adStats.enabledUsers;
    document.getElementById('ad-disabled-users').textContent = data.adStats.disabledUsers;
    document.getElementById('ad-locked-users').textContent = data.adStats.lockedUsers;

    // Logs
    const logList = document.getElementById('log-list');
    logList.innerHTML = ''; // Clear previous logs
    data.logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-item';
        logEntry.innerHTML = `
            <span class="log-time">${log.time}</span>
            <span class="log-action">${log.action}</span>
            <span class="log-status log-${log.status}">${log.status}</span>
        `;
        logList.appendChild(logEntry);
    });

    // Update Charts
    activityChart.data.datasets[0].data = [
        data.adStats.usersCreatedToday,
        data.adStats.passwordsResetToday,
        data.adStats.usersDisabledToday,
        data.adStats.domainUnlocksToday
    ];
    activityChart.update();

    adUsersChart.data.datasets[0].data = [
        data.adStats.totalUsers,
        data.adStats.enabledUsers,
        data.adStats.disabledUsers,
        data.adStats.lockedUsers
    ];
    adUsersChart.update();
}

// --- INITIALIZATION ---
function fetchDataAndUpdate() {
    try {
        const data = getMockDashboardData();
        updateDashboard(data);
    } catch (error) {
        console.error("Failed to fetch and update dashboard data:", error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    createCharts();
    fetchDataAndUpdate(); // Initial load
    setInterval(fetchDataAndUpdate, 30000); // Refresh every 30 seconds
});
