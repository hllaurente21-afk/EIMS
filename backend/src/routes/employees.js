const router = require('express').Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const SELECT = `
  SELECT e.*, d.name AS department
  FROM employees e LEFT JOIN departments d ON d.id = e.department_id`;

// GET /api/employees/departments
router.get('/departments', async (_req, res, next) => {
  try { const [rows] = await db.query('SELECT * FROM departments ORDER BY name'); res.json(rows); }
  catch (e) { next(e); }
});

// GET /api/employees?q=&department_id=&status=&page=1&limit=20   (admin, hr)
router.get('/', authorize('admin', 'hr'), async (req, res, next) => {
  try {
    const { q, department_id, status } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const where = [], params = [];

    if (q) {
      where.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ? OR e.position LIKE ? OR e.email LIKE ?)');
      params.push(...Array(5).fill(`%${q}%`));
    }
    if (department_id) { where.push('e.department_id = ?'); params.push(department_id); }
    if (status) { where.push('e.status = ?'); params.push(status); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM employees e ${clause}`, params);
    const [rows] = await db.query(
      `${SELECT} ${clause} ORDER BY e.last_name, e.first_name LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    res.json({ data: rows, page, limit, total });
  } catch (e) { next(e); }
});

// GET /api/employees/:id   (admin/hr any; employee only their own)
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (req.user.role === 'employee' && req.user.employeeId !== id)
      return res.status(403).json({ message: 'You can only view your own profile.' });
    const [rows] = await db.query(`${SELECT} WHERE e.id = ?`, [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Employee not found.' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

const FIELDS = ['employee_code', 'first_name', 'last_name', 'department_id', 'position', 'email', 'phone', 'date_hired', 'status'];

// POST /api/employees   (admin, hr)
router.post('/', authorize('admin', 'hr'), async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.employee_code || !b.first_name || !b.last_name)
      return res.status(400).json({ message: 'employee_code, first_name and last_name are required.' });
    const values = FIELDS.map(f => (b[f] === '' || b[f] === undefined ? null : b[f]));
    if (!b.status) values[FIELDS.indexOf('status')] = 'active';
    const [r] = await db.query(
      `INSERT INTO employees (${FIELDS.join(',')}) VALUES (${FIELDS.map(() => '?').join(',')})`, values);
    res.status(201).json({ id: r.insertId, ...b });
  } catch (e) { next(e); }
});

// PUT /api/employees/:id   (admin, hr)
router.put('/:id', authorize('admin', 'hr'), async (req, res, next) => {
  try {
    const sets = FIELDS.filter(f => req.body[f] !== undefined);
    if (!sets.length) return res.status(400).json({ message: 'No fields to update.' });
    const params = sets.map(f => (req.body[f] === '' ? null : req.body[f]));
    const [r] = await db.query(`UPDATE employees SET ${sets.map(f => `${f} = ?`).join(', ')} WHERE id = ?`, [...params, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Employee not found.' });
    res.json({ message: 'Employee updated.' });
  } catch (e) { next(e); }
});

// DELETE /api/employees/:id  -> soft delete (sets inactive, keeps attendance history)
router.delete('/:id', authorize('admin', 'hr'), async (req, res, next) => {
  try {
    const [r] = await db.query("UPDATE employees SET status = 'inactive' WHERE id = ?", [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Employee not found.' });
    res.json({ message: 'Employee set to inactive.' });
  } catch (e) { next(e); }
});

module.exports = router;
