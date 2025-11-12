-- 1. Categories table
CREATE TABLE security_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tasks table
CREATE TABLE security_tasks (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES security_categories(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
    automation_method TEXT,
    estimated_time_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Task completions table (for weekly tracking)
CREATE TABLE task_completions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES security_tasks(id),
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    completed_by VARCHAR(100) DEFAULT 'System',
    completed_at TIMESTAMP,
    week_start DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, week_start)
);

-- 4. Automation logs table
CREATE TABLE automation_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES security_tasks(id),
    automation_type VARCHAR(100),
    status VARCHAR(50),
    result TEXT,
    executed_by VARCHAR(100),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Users table (for multi-user support)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);