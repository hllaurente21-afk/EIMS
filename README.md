# EIMS – Employee Information Management System
**A Web-Based System for Employee Records and Attendance Monitoring**

**Group 5 – BS InfoTech 2B**
- Josh Cardenas
- Hoover Lawrence Laurente
- Julius R. Icabande
- Eaira Gaspar
- Michael Soñega

**Adviser:** John Fredrick Lim

---

EIMS is a web-based system that stores employee profiles and attendance records in one database.
It lets authorized users record time-in and time-out, calculate working hours, search employee
records, and generate daily and monthly reports.

**Tech stack:** ReactJS (Vite) → Node.js / Express API → MySQL (XAMPP)

## Project structure
```
eims/
├── backend/            Express REST API + MySQL
│   ├── database/schema.sql
│   ├── scripts/seed-admin.js
│   └── src/            server.js, db.js, middleware/, routes/
└── frontend/           React app (Vite)
    └── src/            pages/, components/, api.js, AuthContext.jsx
```

## Requirements
1. **Node.js** (LTS version) – https://nodejs.org
2. **XAMPP** (includes MySQL) – https://www.apachefriends.org
3. **VS Code** (recommended) – to open the project and use its terminal

> Windows tip: if PowerShell says "running scripts is disabled", run
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use **Command Prompt** instead.

## Setup (first time only)

### 1. Start XAMPP and import the database
1. Open the **XAMPP Control Panel** and click **Start** next to **Apache** and **MySQL**.
2. Click **Admin** next to MySQL (or open http://localhost/phpmyadmin).
3. Click the **Import** tab → **Choose File** → select `backend/database/schema.sql` → click **Import**.
4. The `eims` database appears on the left with 4 tables: `attendance`, `departments`, `employees`, `users`.

> You do not need to create the database yourself; `schema.sql` creates it.

### 2. Set up the backend
Open the `eims` folder in VS Code, open a terminal (Terminal → New Terminal), then:
```bash
cd backend
npm install
```
Copy `.env.example` to a new file named `.env`, then check:
```
DB_USER=root
DB_PASSWORD=                 # leave empty for XAMPP
DB_NAME=eims
JWT_SECRET=type-any-long-random-text-here
```
Create the first admin account:
```bash
npm run seed:admin
```
Default login: **admin / Admin@12345** (change it afterwards in *My Profile*).

### 3. Set up the frontend
Open a second terminal (click the **+** in the terminal panel):
```bash
cd frontend
npm install
```

## Running the system (every time)
1. Start **Apache** and **MySQL** in XAMPP.
2. Terminal 1:
   ```bash
   cd backend
   npm run dev          # API on http://localhost:5000
   ```
3. Terminal 2:
   ```bash
   cd frontend
   npm run dev -- --host    # app on http://localhost:5173
   ```
4. Open **http://localhost:5173** and sign in.

Check the API is up: http://localhost:5000/api/health should show `{"status":"ok"}`.

## Using the system
1. **Employees** – add employee profiles (ID, name, department, position, contact).
2. **User Accounts** (admin only) – create logins. Choose the role and **link the account to an
   employee**, otherwise the Time In / Time Out buttons will not appear.
3. **Attendance** – employees press **Time In** and **Time Out**. HR/Admin can view all records,
   edit, and add missed entries with **Manual entry**.
4. **Dashboard / Reports** – daily attendance and monthly working hours, with CSV export and print.

There is no public sign-up page. Only the administrator creates accounts.

### Roles
| Role | Access |
|---|---|
| Admin | everything, including user accounts and deleting attendance |
| HR | employees, attendance corrections, reports |
| Employee | own profile, time in/out, own attendance |

### Working-hours rule
`hours = (time out − time in) − break`. If no break is entered and the shift is longer than
5 hours, 60 minutes are deducted automatically (configurable in `backend/.env`:
`BREAK_THRESHOLD_HOURS`, `BREAK_MINUTES`).

## Office / network use
One computer acts as the **server** (running XAMPP, the backend and the frontend). Other devices on
the same Wi-Fi/LAN open the system in a browser at:
```
http://<server-IP>:5173        e.g. http://192.168.1.10:5173
```
- Find the server IP with `ipconfig` (IPv4 Address of the Wi-Fi adapter).
- Start the frontend with `npm run dev -- --host`.
- Allow the port once (Command Prompt as administrator):
  `netsh advfirewall firewall add rule name="EIMS" dir=in action=allow protocol=TCP localport=5173`
- The server computer must be on, with all three parts running, during working hours.

## Troubleshooting
| Problem | Fix |
|---|---|
| `JWT_SECRET is missing` | Create `backend/.env` from `.env.example` |
| `ECONNREFUSED` / `Access denied` | Start MySQL in XAMPP; leave `DB_PASSWORD` empty |
| `Unknown database 'eims'` | Import `schema.sql` in phpMyAdmin again |
| `npm is not recognized` | Install Node.js, then restart VS Code |
| Login stays on "Signing in…" | Backend is not running – start `npm run dev` in `backend` |
| Employee has no Time In button | Link their account to an employee in *User Accounts* |
| Phone cannot open the site | Same Wi-Fi, use `--host`, allow port 5173, use the server's IP |

## Scope and limitations
No biometric or hardware integration, no payroll computation, and no GPS tracking in this version.
Accuracy depends on correct and complete attendance entries.
