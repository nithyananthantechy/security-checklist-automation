-- Insert categories
INSERT INTO security_categories (id, name, description, color, icon) VALUES
(1, 'Network Security', 'Firewall, VPN, IDS/IPS monitoring', '#EF4444', 'shield'),
(2, 'Server & Endpoint', 'Event logs, antivirus, patch compliance', '#F59E0B', 'server'),
(3, 'Windows Patch Management', 'WSUS/SCCM monitoring, compliance tracking', '#10B981', 'download'),
(4, 'Access Management', 'Account audits, MFA verification, privileged access', '#3B82F6', 'key'),
(5, 'Vulnerability Management', 'CVE tracking, SSL certificates, web app scanning', '#8B5CF6', 'alert-triangle'),
(6, 'Backup & Recovery', 'Backup verification, restoration testing', '#06B6D4', 'save'),
(7, 'Compliance & Monitoring', 'SIEM alerts, audit trails, reporting', '#F97316', 'file-text');

-- Insert all 42 security tasks
INSERT INTO security_tasks (category_id, name, description, priority, automation_method, estimated_time_minutes) VALUES
-- Network Security (5 tasks)
(1, 'Review firewall logs for anomalies', 'Check for unusual patterns in firewall traffic', 'high', 'SIEM correlation rules', 45),
(1, 'Monitor VPN connection attempts', 'Review failed and successful VPN connections', 'high', 'VPN monitoring scripts', 30),
(1, 'Check IDS/IPS alerts', 'Review intrusion detection/prevention system alerts', 'high', 'Automated alerting', 60),
(1, 'Review network segmentation', 'Verify network isolation and segmentation', 'medium', 'Network mapping tools', 90),
(1, 'Monitor DNS query logs', 'Check for suspicious DNS queries', 'medium', 'DNS monitoring tools', 30),

-- Server & Endpoint (6 tasks)
(2, 'Review Windows Event Logs', 'Check security and system event logs', 'high', 'Event log forwarding', 60),
(2, 'Verify antivirus status and updates', 'Ensure AV is running and updated', 'high', 'AV management console', 20),
(2, 'Check endpoint detection alerts', 'Review EDR/XDR system alerts', 'high', 'EDR API integration', 45),
(2, 'Monitor server performance metrics', 'CPU, memory, disk usage monitoring', 'medium', 'Performance counters', 30),
(2, 'Review application logs', 'Check critical application event logs', 'medium', 'Log aggregation tools', 60),
(2, 'Verify system integrity', 'Check for unauthorized changes', 'medium', 'File integrity monitoring', 45),

-- Windows Patch Management (7 tasks)
(3, 'Monitor WSUS/SCCM synchronization', 'Check patch synchronization status', 'high', 'WSUS PowerShell scripts', 15),
(3, 'Review patch compliance reports', 'Check patch installation status', 'high', 'SCCM reporting', 30),
(3, 'Check critical security updates', 'Verify critical patches are applied', 'high', 'Windows Update API', 20),
(3, 'Monitor patch deployment status', 'Track ongoing patch deployments', 'medium', 'Deployment monitoring', 25),
(3, 'Review update failure reports', 'Investigate failed updates', 'medium', 'Failure analysis scripts', 45),
(3, 'Verify third-party software updates', 'Check non-Microsoft updates', 'medium', 'Patch management tools', 60),
(3, 'Document patch management process', 'Update patch documentation', 'low', 'Documentation templates', 90),

-- Access Management (6 tasks)
(4, 'Review privileged account usage', 'Check admin account activities', 'high', 'PAM tool integration', 60),
(4, 'Verify MFA compliance', 'Ensure MFA is enabled for critical systems', 'high', 'MFA management console', 30),
(4, 'Check for stale user accounts', 'Identify inactive accounts', 'medium', 'AD PowerShell scripts', 45),
(4, 'Review group membership changes', 'Monitor security group modifications', 'medium', 'Change monitoring', 30),
(4, 'Validate access request approvals', 'Verify proper access approvals', 'medium', 'IAM system integration', 60),
(4, 'Monitor failed login attempts', 'Review authentication failures', 'high', 'SIEM correlation rules', 30),

-- Vulnerability Management (6 tasks)
(5, 'Review vulnerability scan results', 'Analyze latest vulnerability scans', 'high', 'Vulnerability scanner API', 120),
(5, 'Check SSL/TLS certificate expiration', 'Verify certificate validity', 'high', 'Certificate monitoring tools', 20),
(5, 'Monitor CVE databases for new threats', 'Check for new vulnerabilities', 'medium', 'CVE feed integration', 30),
(5, 'Verify web application security scans', 'Review web app scan results', 'high', 'DAST tool integration', 90),
(5, 'Check system hardening compliance', 'Verify security baselines', 'medium', 'Compliance scanning tools', 60),
(5, 'Review penetration test findings', 'Analyze pentest results', 'high', 'Vulnerability management platform', 120),

-- Backup & Recovery (5 tasks)
(6, 'Verify backup completion status', 'Check backup job success/failure', 'high', 'Backup software API', 20),
(6, 'Test backup restoration process', 'Perform test restores', 'medium', 'Automated restore testing', 180),
(6, 'Review backup storage capacity', 'Check available backup space', 'medium', 'Storage monitoring', 15),
(6, 'Validate backup encryption', 'Ensure backups are properly encrypted', 'high', 'Encryption verification scripts', 30),
(6, 'Document recovery procedures', 'Update DR documentation', 'low', 'Documentation templates', 120),

-- Compliance & Monitoring (7 tasks)
(7, 'Review SIEM alerts and correlations', 'Analyze security incidents', 'high', 'SIEM dashboard', 90),
(7, 'Check audit trail integrity', 'Verify log collection and retention', 'medium', 'Log management tools', 45),
(7, 'Monitor data loss prevention alerts', 'Review DLP policy violations', 'high', 'DLP console', 60),
(7, 'Verify compliance with security policies', 'Check policy adherence', 'medium', 'Compliance monitoring', 120),
(7, 'Review security dashboard metrics', 'Analyze security KPIs', 'medium', 'Dashboard tools', 30),
(7, 'Check physical security logs', 'Review physical access records', 'low', 'Physical security systems', 45),
(7, 'Prepare weekly security report', 'Compile weekly security status', 'medium', 'Report automation tools', 60);

-- Initialize current week's task completions (all false)
INSERT INTO task_completions (task_id, completed, week_start)
SELECT id, false, DATE_TRUNC('week', CURRENT_DATE)
FROM security_tasks
ON CONFLICT (task_id, week_start) DO NOTHING;

-- Insert sample user
INSERT INTO users (username, email, role) VALUES
('security_admin', 'admin@company.com', 'admin'),
('analyst1', 'analyst1@company.com', 'user');