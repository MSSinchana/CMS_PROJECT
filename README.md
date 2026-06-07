# CMS Web App

A full-stack Content Management System rebuilt from the original Java CLI app into a browser-based application.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, JWT, bcrypt
- Database: MySQL

## Prerequisites

- Node.js 18+
- MySQL 8+

## Project Layout

- `backend/` - Express API, database schema, seed script
- `frontend/` - React/Vite app
- `src/` - legacy Java CLI source from the original project

## Setup

### 1. Create the database and seed data

From the `backend/` folder:

```bash
npm install
npm run seed
```

The seed script will:
- create the `cms_database` database
- create the tables if they do not already exist
- ensure the default admin user exists
- insert sample content only when the database is empty

Note: the seed script is now non-destructive and will not delete existing users or posts.

### 2. Configure backend environment

The backend uses `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cms_database
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
FRONTEND_ORIGIN=http://localhost:5173
```

Update `DB_USER` and `DB_PASSWORD` if your MySQL account is different.

### 3. Start the backend

```bash
cd backend
npm run dev
```

The API runs at `http://localhost:5000`.

### 4. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Default Login

- Username: `admin`
- Password: `admin123`

## API Endpoints

### Auth

- `POST /api/auth/login` - public login, returns JWT + user info
- `POST /api/auth/register` - public register, returns JWT + user info
- `POST /api/auth/logout` - protected logout
- `GET /api/auth/me` - protected current user
- `PUT /api/auth/me/password` - protected change own password
- `DELETE /api/auth/me` - protected delete own account

### Content

- `GET /api/content` - protected list with pagination, search, category, and status filters
- `GET /api/content/stats` - protected dashboard stats
- `GET /api/content/:id` - protected single content item
- `POST /api/content` - protected create content using JWT user ID
- `PUT /api/content/:id` - protected edit content (admin: any, user: own only)
- `DELETE /api/content/:id` - protected delete content (admin: any, user: own only)
- `PATCH /api/content/:id/status` - admin only change content status

### Users

- `GET /api/users` - admin only list users
- `GET /api/users/people` - protected list of people (for social features)
- `POST /api/users` - admin only create user
- `PUT /api/users/:id` - admin only update user
- `DELETE /api/users/:id` - admin only delete user
- `POST /api/users/:id/follow` - protected follow a user
- `DELETE /api/users/:id/follow` - protected unfollow a user

### Activity Log

- `GET /api/activity` - admin only paginated audit log, supports `?page`, `?limit`, `?action`, `?userId` filters
- `GET /api/activity/recent` - admin only recent entries for the dashboard widget, supports `?limit`

The following actions are recorded automatically:

| Action | Trigger |
|---|---|
| `user.login` | Successful login |
| `user.logout` | Logout |
| `user.register` | New account registration |
| `user.password_changed` | Password change |
| `user.account_deleted` | User deletes own account |
| `user.created` | Admin creates a user |
| `user.updated` | Admin updates a user |
| `user.deleted` | Admin deletes a user |
| `content.created` | Content created |
| `content.updated` | Content edited |
| `content.deleted` | Content deleted |
| `content.status_changed` | Admin changes content status |

## Notes

- Passwords are stored as bcrypt hashes only.
- `created_by` is always taken from the JWT payload.
- The frontend stores the JWT in `localStorage` and automatically sends it on API requests.
- The old CLI files remain in `src/` as legacy source, but the browser app is now the primary interface.