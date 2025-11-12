# 🛡️ IT Security Weekly Checklist Automation

A comprehensive web-based application for IT Security professionals to manage, track, and automate weekly security tasks.

## ✨ Features

- **42 Security Tasks** across 7 categories
- **Real-time Progress Tracking**
- **Task Management** with notes
- **CSV Export** for reporting
- **Beautiful Responsive UI**
- **RESTful API** with n8n + PostgreSQL

## 🏗️ Architecture

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: n8n workflows
- **Database**: PostgreSQL
- **APIs**: RESTful endpoints

## 🚀 Quick Start

### Prerequisites
- n8n installed
- PostgreSQL database
- Web browser

### Installation
1. Set up n8n workflows from `/n8n-workflows/`
2. Import database schema from `/database/schema.sql`
3. Open `/frontend/index.html` in browser

## 📊 APIs

- `GET /security-tasks` - Get all tasks
- `POST /update-task` - Update task status
- `GET /progress` - Get progress stats
- `GET /export` - Export CSV report

## 🤝 Contributing
Feel free to submit issues and enhancement requests!