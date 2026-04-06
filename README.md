# 🔧 GearGuard - Machinery Maintenance Management System

> A comprehensive web-based system for managing machinery maintenance, scheduling, task tracking, and employee/technician workflows with real-time notifications.

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

GearGuard is a professional machinery maintenance management system built with modern web technologies. It enables organizations to efficiently track equipment, schedule maintenance, manage technician assignments, and automate notification workflows. The system supports multiple user roles with granular permission control.

**Key Capabilities:**
- Equipment inventory management with categorization
- Automated maintenance scheduling and reminders
- Task assignment and status tracking
- Real-time email notifications
- User role-based access control
- Responsive design for desktop and mobile devices

---

## ✨ Features

### 🏢 Core Features
- ✅ **User Management** - Create and manage employees, technicians, and managers
- ✅ **Machine Management** - Add, edit, and track machinery with categories and departments
- ✅ **Maintenance Scheduling** - Automated periodic maintenance scheduling based on intervals
- ✅ **Task Management** - Create, assign, and track maintenance tasks with multiple severity levels
- ✅ **Task Status Workflow** - Open → In Progress → Pending Approval → Resolved
- ✅ **Email Notifications** - Automated emails when tasks are assigned with complete machine details
- ✅ **Department Assignment** - Fixed department structure (DEP-1 to DEP-5)
- ✅ **Specialization Tracking** - Track technician specializations (Electronics, Electrical, Mechanical, IT, Civil, General)

### 🔐 Security Features
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Password Hashing** - Bcrypt password encryption
- ✅ **Role-Based Access Control** - Manager, Employee, Technician roles
- ✅ **Request Validation** - Input validation on all endpoints
- ✅ **CORS Protection** - Configurable CORS origins
- ✅ **Password Reset** - OTP-based password recovery
- ✅ **Secure Token Management** - Access token + refresh token pattern

### 🎨 UI/UX Features
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Kanban Board** - Visual task management by status and severity
- ✅ **User Profiles** - Detailed employee/technician information display
- ✅ **Color-Coded Badges** - Visual indicators for severity levels
- ✅ **Form Validation Indicators** - Red asterisks for mandatory fields
- ✅ **Modal Dialogs** - Inline task assignment and editing
- ✅ **Data Tables** - Sortable and searchable data display

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 16+ | Runtime environment |
| Express.js | 5.2+ | Web framework |
| Prisma | 5.7+ | ORM & Database management |
| PostgreSQL | 11+ | Database (via Neon) |
| JWT | 9.0+ | Authentication |
| Bcrypt | 6.0+ | Password hashing |
| Nodemailer | 8.0+ | Email service |
| Cloudinary | 2.9+ | Image storage |
| Multer | 2.0+ | File upload handling |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19+ | UI library |
| Vite | 8.0+ | Build tool |
| React Router | 7.13+ | Routing |
| CSS3 | Latest | Styling |
| JavaScript ES6+ | Latest | Language |

### Database
- **PostgreSQL** hosted on Neon
- **Prisma** for ORM and migrations
- 7 database migrations for complete schema

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL** database access or [Neon account](https://neon.tech/) (free tier available)
- **Cloudinary account** for image storage ([Sign up](https://cloudinary.com/))
- **Gmail account** with App Password for email service

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/ParthKhandla/GearGuard.git
cd GearGuard
```

### Step 2: Install Dependencies

**Backend Dependencies:**
```bash
npm install
```

**Frontend Dependencies:**
```bash
cd Frontend
npm install
cd ..
```

### Step 3: Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Server
PORT=8000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT
ACCESS_TOKEN_SECRET=your-secure-random-string-here
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_SECRET=your-secure-random-string-here
REFRESH_TOKEN_EXPIRY=10d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Step 4: Database Setup

Run Prisma migrations:
```bash
npx prisma migrate dev
```

Seed initial data (creates default manager):
```bash
npx prisma db seed
```

**Default Manager Credentials:**
- Email: `manager@company.com`
- Username: `manager`
- Password: `manager123`

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
npm run dev
# Server starts at http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
# Frontend starts at http://localhost:5173
```

---

## 📁 Project Structure

```
GearGuard/
├── Backend/
│   ├── src/
│   │   ├── controllers/          # API request handlers
│   │   │   ├── user.controller.js
│   │   │   ├── machine.controller.js
│   │   │   └── task.controller.js
│   │   ├── routes/               # Express routes
│   │   │   ├── user.routes.js
│   │   │   ├── machine.routes.js
│   │   │   └── task.routes.js
│   │   ├── middlewares/          # Auth & file upload
│   │   │   ├── auth.middleware.js
│   │   │   └── multer.middleware.js
│   │   ├── utils/                # Utilities & helpers
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── sendEmail.js
│   │   │   └── cloudinary.js
│   │   ├── db/                   # Database connection
│   │   ├── constants.js          # Application constants
│   │   ├── app.js                # Express app setup
│   │   └── index.js              # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed.js               # Database seeding
│   │   └── migrations/           # Database migrations (7 total)
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── pages/                # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Machines.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Maintenance.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Profile.jsx
│   │   ├── components/           # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/              # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/                # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   └── useAPI.js
│   │   ├── services/             # API service
│   │   │   └── apiService.js
│   │   ├── styles/               # CSS files
│   │   │   ├── Auth.css
│   │   │   ├── Layout.css
│   │   │   ├── Navbar.css
│   │   │   ├── Tasks.css
│   │   │   ├── Machines.css
│   │   │   └── Dashboard.css
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # React entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── .env                          # Environment variables (not committed)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Root package config
└── README.md                     # This file
```

---

## 🔌 API Endpoints

### Authentication (Public)
```
POST   /users/login                 - Login with email/username & password
POST   /users/register              - Register new user
POST   /users/send-otp              - Send OTP for password reset
POST   /users/verify-otp            - Verify OTP
POST   /users/reset-password        - Reset password
POST   /users/refresh-token         - Refresh access token
```

### User Management (Manager Only)
```
GET    /users/manager/all-users     - List all users
POST   /users/manager/create-user   - Create new user (employee/technician)
DELETE /users/manager/delete-user   - Delete user
GET    /users/manager/technicians   - List all technicians
GET    /users/manager/technicians/available          - Get available technicians
GET    /users/manager/technicians/available-general  - Get available general technicians
```

### User (Authenticated)
```
GET    /users/me                    - Get current user profile
POST   /users/logout                - Logout
POST   /users/change-password       - Change password
```

### Machine Management (Manager Only)
```
GET    /machines                    - List all machines
POST   /machines                    - Create new machine
PUT    /machines/:id                - Update machine
DELETE /machines/:id                - Delete machine
```

### Task Management
```
GET    /tasks                       - List tasks (filtered by role)
POST   /tasks                       - Create new task (employees only)
GET    /tasks/:id                   - Get task details
PUT    /tasks/assign/:id            - Assign task to technician (manager)
PUT    /tasks/status/:id            - Update task status
```

### Maintenance Management (Manager Only)
```
GET    /tasks/maintenance/schedule  - Get maintenance schedule
POST   /tasks/maintenance/assign    - Assign periodic maintenance task
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `8000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `ACCESS_TOKEN_SECRET` | JWT secret key | `your-secret-key` |
| `ACCESS_TOKEN_EXPIRY` | Token expiration time | `7d` |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | `your-refresh-key` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry | `10d` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` |
| `EMAIL_USER` | Gmail address for notifications | `your-email@gmail.com` |
| `EMAIL_PASS` | Gmail app-specific password | `your-app-password` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

---

## 💾 Database

### Schema Highlights
- **Users**: Manager, Employee, Technician roles with departments and specializations
- **Machines**: Equipment with category, department, and maintenance intervals
- **Tasks**: Maintenance tasks with status tracking and severity levels
- **Task Assignments**: Link between tasks, technicians, and status history

### Migrations
- ✅ Initial schema setup
- ✅ Specialization support
- ✅ Machine enhancements
- ✅ Task redesign
- ✅ Pending manager approval workflow
- ✅ Cascade delete for tasks
- ✅ OTP fields for password reset

---

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set build command: `npm run build`
4. Set root directory: `Frontend`
5. Deploy automatically on push

### Backend Deployment (Railway/Render)
1. Push code to GitHub
2. Create new project on Railway/Render
3. Connect GitHub repository
4. Set environment variables from `.env`
5. Deploy automatically on push

### Database Deployment
- Database is already hosted on **Neon PostgreSQL**
- In production, update `DATABASE_URL` to production database
- Run migrations: `npx prisma migrate deploy`

### Environment Updates for Production
```env
CORS_ORIGIN=https://your-frontend-domain.com
DATABASE_URL=postgresql://prod-user:prod-password@prod-host/prod-db
ACCESS_TOKEN_SECRET=strong-production-secret
REFRESH_TOKEN_SECRET=strong-production-secret
```

---

## 📝 Email Configuration (Gmail)

1. Enable 2-Factor Authentication on Gmail
2. Generate App-Specific Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select: Mail & Windows PC
   - Copy the generated password
   - Use in `.env` as `EMAIL_PASS`

---

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

For support, open an issue on GitHub.

---

## 🎉 Acknowledgments

- Built with modern web technologies
- PostgreSQL & Prisma for reliable data management
- Cloudinary for robust image storage
- Nodemailer for email automation
- React & Vite for optimal frontend performance

---

**GearGuard © 2026 - Machinery Maintenance Management Made Simple** ⚙️
