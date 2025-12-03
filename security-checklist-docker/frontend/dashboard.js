// --- MOCK API & DATA SIMULATION ---
function getMockDashboardData() {
    const taskState = ['Ready', 'Running', 'Disabled'][Math.floor(Math.random() * 3)];
    const lastTaskResult = Math.random() > 0.8 ? 1 : 0;
    const openTickets = Math.floor(Math.random() * 5);

    return {
        serverInfo: {
            serverName: "AD-SERVER-PROD",
            domainName: "desicrew.in",
            uptime: `${Math.floor(Math.random() * 30)+1}d ${Math.floor(Math.random()*24)}h ${Math.floor(Math.random()*60)}m`
        },
        adStats: {
            usersCreatedToday: Math.floor(Math.random() * 10),
            passwordsResetToday: Math.floor(Math.random() * 20),
            usersDisabledToday: Math.floor(Math.random() * 5),
            domainUnlocksToday: Math.floor(Math.random() * 15),
            totalUsers: 2323 + Math.floor(Math.random() * 50),
            enabledUsers: 1719 + Math.floor(Math.random() * 50),
            disabledUsers: 604,
            lockedUsers: Math.floor(Math.random() * 10),
        },
        taskInfo: {
            state: taskState,
            lastRunTime: new Date(Date.now() - Math.random() * 3600000).toLocaleString(),
            nextRunTime: new Date(Date.now() + 3600000).toLocaleString(),
            lastTaskResult: lastTaskResult,
        },
        freshservice: {
            apiAvailable: Math.random() > 0.1,
            openTickets: openTickets,
            totalRuns: Math.floor(Math.random() * 100) + 50,
        },
        managerApproval: {
            pendingCount: Math.floor(Math.random() * 5),
            lastApprovedTicket: {
                id: 1023,
                approvedBy: "Balachandran",
                approvedTime: new Date(Date.now() - 600000).toLocaleString()
            }
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

// --- UI UPDATE FUNCTIONS ---
function updateDashboard(data) {
    // Stats Grid
    document.getElementById('users-created').textContent = data.adStats.usersCreatedToday;
    document.getElementById('passwords-reset').textContent = data.adStats.passwordsResetToday;
    document.getElementById('users-disabled').textContent = data.adStats.usersDisabledToday;
    document.getElementById('domain-unlocks').textContent = data.adStats.domainUnlocksToday;

    const systemStatusEl = document.getElementById('system-status');
    systemStatusEl.textContent = data.taskInfo.lastTaskResult === 0 ? '✅' : '❌';
    systemStatusEl.className = `stat-number ${data.taskInfo.lastTaskResult === 0 ? 'success' : 'danger'}`;

    // Automation Status Card
    const taskStateEl = document.getElementById('task-state');
    taskStateEl.textContent = data.taskInfo.state;
    taskStateEl.className = `status-badge ${data.taskInfo.state === 'Ready' ? 'status-success' : 'status-error'}`;

    document.getElementById('last-run-time').textContent = data.taskInfo.lastRunTime;
    document.getElementById('next-run-time').textContent = data.taskInfo.nextRunTime;

    const lastTaskResultEl = document.getElementById('last-task-result');
    lastTaskResultEl.textContent = `${data.taskInfo.lastTaskResult} (${data.taskInfo.lastTaskResult === 0 ? 'SUCCESS' : 'ERROR'})`;
    lastTaskResultEl.className = `status-badge ${data.taskInfo.lastTaskResult === 0 ? 'status-success' : 'status-error'}`;

    // Freshservice Card
    const fsApiStatusEl = document.getElementById('fs-api-status');
    fsApiStatusEl.textContent = data.freshservice.apiAvailable ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
    fsApiStatusEl.className = `status-badge ${data.freshservice.apiAvailable ? 'status-success' : 'status-error'}`;
    document.getElementById('fs-open-tickets').textContent = data.freshservice.openTickets;
    document.getElementById('fs-total-runs').textContent = data.freshservice.totalRuns;

    // System Info Card
    document.getElementById('info-server').textContent = data.serverInfo.serverName;
    document.getElementById('info-domain').textContent = data.serverInfo.domainName;
    document.getElementById('info-uptime').textContent = data.serverInfo.uptime;

    // AD Stats Card
    document.getElementById('ad-total-users').textContent = data.adStats.totalUsers;
    document.getElementById('ad-enabled-users').textContent = data.adStats.enabledUsers;
    document.getElementById('ad-disabled-users').textContent = data.adStats.disabledUsers;
    document.getElementById('ad-locked-users').textContent = data.adStats.lockedUsers;

    // Manager Approval
    document.getElementById('pending-approval').textContent = data.managerApproval.pendingCount;
    document.getElementById('last-approved-ticket').textContent = `#${data.managerApproval.lastApprovedTicket.id}`;
    document.getElementById('last-approved-by').textContent = data.managerApproval.lastApprovedTicket.approvedBy;
    document.getElementById('last-approved-time').textContent = data.managerApproval.lastApprovedTicket.approvedTime;

    // Logs
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';
    data.logs.forEach(log => {
        const statusClass = `log-${log.status.toLowerCase()}`;
        const logEntry = document.createElement('div');
        logEntry.className = 'log-item';
        logEntry.innerHTML = `
            <span class="log-time">${log.time}</span>
            <span class="log-action">${log.action}</span>
            <span class="log-status ${statusClass}">${log.status}</span>
        `;
        logList.appendChild(logEntry);
    });

    // Add pending approval log at top
    if (data.managerApproval.pendingCount > 0) {
        const skippedLogEntry = document.createElement('div');
        skippedLogEntry.className = 'log-item log-skipped';
        skippedLogEntry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
            <span class="log-action">${data.managerApproval.pendingCount} ticket(s) skipped (Pending Manager Approval)</span>
            <span class="log-status">SKIPPED</span>
        `;
        logList.prepend(skippedLogEntry);
    }
}

// --- INITIALIZATION ---
function fetchDataAndUpdate() {
    const data = getMockDashboardData();
    updateDashboard(data);
}

document.addEventListener('DOMContentLoaded', function() {
    fetchDataAndUpdate();
    setInterval(fetchDataAndUpdate, 30000); // refresh every 30s
});
