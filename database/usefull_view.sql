-- View for current week progress
CREATE VIEW weekly_progress AS
SELECT 
    sc.name as category_name,
    sc.color,
    COUNT(st.id) as total_tasks,
    COUNT(CASE WHEN tc.completed THEN 1 END) as completed_tasks,
    ROUND(
        (COUNT(CASE WHEN tc.completed THEN 1 END) * 100.0 / NULLIF(COUNT(st.id), 0)),
        2
    ) as completion_percentage
FROM security_categories sc
JOIN security_tasks st ON sc.id = st.category_id
LEFT JOIN task_completions tc ON st.id = tc.task_id 
    AND tc.week_start = DATE_TRUNC('week', CURRENT_DATE)
GROUP BY sc.id, sc.name, sc.color
ORDER BY sc.id;

-- View for task details with completion status
CREATE VIEW task_details AS
SELECT 
    st.id,
    sc.name as category_name,
    sc.color,
    st.name as task_name,
    st.description,
    st.priority,
    st.automation_method,
    st.estimated_time_minutes,
    COALESCE(tc.completed, false) as completed,
    tc.notes,
    tc.completed_at,
    tc.week_start
FROM security_tasks st
JOIN security_categories sc ON st.category_id = sc.id
LEFT JOIN task_completions tc ON st.id = tc.task_id 
    AND tc.week_start = DATE_TRUNC('week', CURRENT_DATE);