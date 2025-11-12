-- Create indexes for better performance
CREATE INDEX idx_task_completions_task_week ON task_completions(task_id, week_start);
CREATE INDEX idx_task_completions_week ON task_completions(week_start);
CREATE INDEX idx_tasks_category ON security_tasks(category_id);
CREATE INDEX idx_automation_logs_task ON automation_logs(task_id);
CREATE INDEX idx_automation_logs_time ON automation_logs(executed_at);