# EIMS Backend (Node.js + Express + MySQL)

## Setup
1. Install Node.js 18+ and MySQL 8.
2. `npm install`
3. Create the database: `mysql -u root -p < database/schema.sql`
4. `cp .env.example .env` and fill in your DB password and a long `JWT_SECRET`.
5. `npm run seed:admin` (creates the first admin account)
6. `npm run dev` -> API at http://localhost:5000

## Roles
| Role | Can do |
|---|---|
| admin | everything, incl. creating user accounts and deleting attendance |
| hr | manage employees, attendance corrections, reports |
| employee | view own profile, clock in/out, view own attendance |

## Endpoints (send `Authorization: Bearer <token>`)
| Method | Path | Access |
|---|---|---|
| POST | /api/auth/login | public |
| GET | /api/auth/me | any |
| POST | /api/auth/users | admin |
| PUT | /api/auth/password | any |
| GET | /api/employees?q=&department_id=&status=&page=&limit= | admin, hr |
| GET | /api/employees/departments | any |
| GET | /api/employees/:id | admin/hr, or own |
| POST / PUT / DELETE | /api/employees(/:id) | admin, hr (DELETE = set inactive) |
| POST | /api/attendance/clock-in | any (employee = self) |
| POST | /api/attendance/clock-out | any (optional `break_minutes`) |
| GET | /api/attendance?employee_id=&from=&to= | admin/hr all; employee own |
| POST / PUT | /api/attendance/manual, /api/attendance/:id | admin, hr |
| DELETE | /api/attendance/:id | admin |
| GET | /api/reports/daily?date= | admin, hr |
| GET | /api/reports/monthly?month=YYYY-MM | admin, hr |

## Working-hours rule
`hours = (time_out - time_in) - break_minutes`. If no break is given at clock-out and the shift
is longer than `BREAK_THRESHOLD_HOURS`, `BREAK_MINUTES` is auto-deducted. Change both in `.env`.

## Connecting ReactJS
Call `POST /api/auth/login`, store the returned token, and send it in the `Authorization` header.
Set `CLIENT_ORIGIN` in `.env` to your React dev URL.
