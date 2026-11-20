# EIMS – Employee Information Management System

A web-based system for employee records and attendance monitoring.
Stack: **ReactJS (Vite)** → **Node.js/Express API** → **MySQL**

```
eims/
├── backend/            Express REST API + MySQL
│   ├── database/schema.sql
│   ├── scripts/seed-admin.js
│   └── src/            server.js, db.js, middleware/, routes/
└── frontend/           React app (Vite)
    └── src/            pages/, components/, api.js, AuthContext.jsx
```

## Run it (two terminals)

**1. Backend**
```bash
cd backend
npm install
mysql -u root -p < database/schema.sql     # creates the `eims` database
cp .env.example .env                       # set DB_PASSWORD and a long JWT_SECRET
npm run seed:admin                         # creates login: admin / Admin@12345
npm run dev                                # http://localhost:5000
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev                                # http://localhost:5173
```
Open http://localhost:5173 and sign in as `admin` (change the password afterwards in My Profile).

## First-time workflow
1. **Employees** → add employees.
2. **User Accounts** → create logins (role: admin / hr / employee) and link employees so they can clock in.
3. Employees use **Attendance** → *Time In* / *Time Out*.
4. HR/Admin review **Dashboard** and **Reports** (daily + monthly, export CSV, print).

## Roles
| Role | Access |
|---|---|
| admin | everything, incl. user accounts and deleting attendance |
| hr | employees, attendance corrections, reports |
| employee | own profile, clock in/out, own attendance |

## Production
`cd frontend && npm run build`, serve `frontend/dist` with any web server, set `VITE_API_URL`
to the API address, and set `CLIENT_ORIGIN` in `backend/.env` to the site address.
