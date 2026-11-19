const router = require('express').Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'hr'));

const HOURS = `ROUND(GREATEST(TIMESTAMPDIFF(MINUTE, a.time_in, a.time_out) - a.break_minutes, 0) / 60, 2)`;

// GET /api/reports/daily?date=YYYY-MM-DD   (defaults to today)
router.get('/daily', async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const [rows] = await db.query(
      `SELECT e.id AS employee_id, e.employee_code, CONCAT(e.first_name,' ',e.last_name) AS employee_name,
              d.name AS department, a.time_in, a.time_out, a.break_minutes,
              ${HOURS} AS hours_worked,
              CASE WHEN a.id IS NULL THEN 'Absent'
                   WHEN a.time_out IS NULL THEN 'Clocked in'
                   ELSE 'Present' END AS status
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.work_date = ?
       WHERE e.status = 'active'
       ORDER BY e.last_name, e.first_name`, [date]);

    const summary = {
      date,
      total: rows.length,
      present: rows.filter(r => r.status !== 'Absent').length,
      absent: rows.filter(r => r.status === 'Absent').length
    };
    res.json({ summary, data: rows });
  } catch (e) { next(e); }
});

// GET /api/reports/monthly?month=YYYY-MM&employee_id=&department_id=
router.get('/monthly', async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ message: 'month must be YYYY-MM.' });
    const where = ["e.status = 'active'"], params = [`${month}-01`, `${month}-01`];
    if (req.query.employee_id) { where.push('e.id = ?'); params.push(req.query.employee_id); }
    if (req.query.department_id) { where.push('e.department_id = ?'); params.push(req.query.department_id); }

    const [rows] = await db.query(
      `SELECT e.id AS employee_id, e.employee_code, CONCAT(e.first_name,' ',e.last_name) AS employee_name,
              d.name AS department,
              COUNT(a.id) AS days_present,
              COALESCE(SUM(${HOURS}), 0) AS total_hours,
              COALESCE(ROUND(AVG(${HOURS}), 2), 0) AS avg_hours_per_day,
              COALESCE(SUM(a.time_out IS NULL), 0) AS incomplete_records
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN attendance a ON a.employee_id = e.id
            AND a.work_date >= ? AND a.work_date < DATE_ADD(?, INTERVAL 1 MONTH)
       WHERE ${where.join(' AND ')}
       GROUP BY e.id, d.name
       ORDER BY e.last_name, e.first_name`, params);
    res.json({ month, data: rows });
  } catch (e) { next(e); }
});

module.exports = router;
