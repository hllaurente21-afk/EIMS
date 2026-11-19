const router = require('express').Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Working hours = (time_out - time_in) - break, never negative, in hours (2 decimals)
const HOURS = `ROUND(GREATEST(TIMESTAMPDIFF(MINUTE, a.time_in, a.time_out) - a.break_minutes, 0) / 60, 2)`;
const THRESHOLD = Number(process.env.BREAK_THRESHOLD_HOURS ?? 5);
const DEFAULT_BREAK = Number(process.env.BREAK_MINUTES ?? 60);

// Employees can only act on themselves; admin/hr can pass employee_id.
function targetEmployee(req) {
  return req.user.role === 'employee' ? req.user.employeeId : Number(req.body.employee_id || req.user.employeeId);
}

// POST /api/attendance/clock-in
router.post('/clock-in', async (req, res, next) => {
  try {
    const empId = targetEmployee(req);
    if (!empId) return res.status(400).json({ message: 'No employee linked to this account.' });
    const [emp] = await db.query("SELECT id FROM employees WHERE id = ? AND status = 'active'", [empId]);
    if (!emp[0]) return res.status(404).json({ message: 'Active employee not found.' });

    const [r] = await db.query(
      'INSERT INTO attendance (employee_id, work_date, time_in, created_by) VALUES (?, CURDATE(), NOW(), ?)',
      [empId, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM attendance WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// POST /api/attendance/clock-out   (optional body: break_minutes)
router.post('/clock-out', async (req, res, next) => {
  try {
    const empId = targetEmployee(req);
    const [open] = await db.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND work_date = CURDATE() AND time_out IS NULL', [empId]);
    if (!open[0]) return res.status(400).json({ message: 'No open time-in found for today.' });

    const given = req.body.break_minutes !== undefined ? Number(req.body.break_minutes) : null;
    await db.query(
      `UPDATE attendance SET time_out = NOW(),
         break_minutes = COALESCE(?, CASE WHEN TIMESTAMPDIFF(MINUTE, time_in, NOW()) > ? THEN ? ELSE 0 END)
       WHERE id = ?`,
      [given, THRESHOLD * 60, DEFAULT_BREAK, open[0].id]
    );
    const [rows] = await db.query(`SELECT a.*, ${HOURS} AS hours_worked FROM attendance a WHERE a.id = ?`, [open[0].id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// GET /api/attendance?employee_id=&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const employeeId = req.user.role === 'employee' ? req.user.employeeId : req.query.employee_id;
    const where = [], params = [];
    if (employeeId) { where.push('a.employee_id = ?'); params.push(employeeId); }
    if (from) { where.push('a.work_date >= ?'); params.push(from); }
    if (to) { where.push('a.work_date <= ?'); params.push(to); }

    const [rows] = await db.query(
      `SELECT a.*, e.employee_code, CONCAT(e.first_name,' ',e.last_name) AS employee_name,
              ${HOURS} AS hours_worked
       FROM attendance a JOIN employees e ON e.id = a.employee_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY a.work_date DESC, e.last_name LIMIT 500`, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/attendance/manual   (admin, hr) - fix missed entries
router.post('/manual', authorize('admin', 'hr'), async (req, res, next) => {
  try {
    const { employee_id, work_date, time_in, time_out = null, break_minutes = 0, remarks = null } = req.body;
    if (!employee_id || !work_date || !time_in)
      return res.status(400).json({ message: 'employee_id, work_date and time_in are required.' });
    if (time_out && time_out <= time_in) return res.status(400).json({ message: 'time_out must be after time_in.' });
    const [r] = await db.query(
      `INSERT INTO attendance (employee_id, work_date, time_in, time_out, break_minutes, remarks, created_by)
       VALUES (?,?,?,?,?,?,?)`,
      [employee_id, work_date, time_in, time_out, break_minutes, remarks, req.user.id]);
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

// PUT /api/attendance/:id   (admin, hr)
router.put('/:id', authorize('admin', 'hr'), async (req, res, next) => {
  try {
    const allowed = ['time_in', 'time_out', 'break_minutes', 'remarks'];
    const sets = allowed.filter(f => req.body[f] !== undefined);
    if (!sets.length) return res.status(400).json({ message: 'No fields to update.' });
    const [r] = await db.query(`UPDATE attendance SET ${sets.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
      [...sets.map(f => req.body[f]), req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Attendance updated.' });
  } catch (e) { next(e); }
});

// DELETE /api/attendance/:id   (admin only)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const [r] = await db.query('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Attendance deleted.' });
  } catch (e) { next(e); }
});

module.exports = router;
