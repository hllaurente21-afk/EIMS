const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });

    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ message: 'Invalid username or password.' });

    const token = jwt.sign(
      { id: user.id, role: user.role, employeeId: user.employee_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, employeeId: user.employee_id } });
  } catch (e) { next(e); }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json(req.user));

// POST /api/auth/users  (admin creates login accounts)
router.post('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { username, password, role = 'employee', employee_id = null } = req.body;
    if (!username || !password || password.length < 8)
      return res.status(400).json({ message: 'Username and a password of at least 8 characters are required.' });
    if (!['admin', 'hr', 'employee'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO users (username, password_hash, role, employee_id) VALUES (?,?,?,?)',
      [username, hash, role, employee_id]
    );
    res.status(201).json({ id: r.insertId, username, role, employee_id });
  } catch (e) { next(e); }
});

// PUT /api/auth/password  (change own password)
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 8)
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(current_password || '', rows[0].password_hash)))
      return res.status(401).json({ message: 'Current password is incorrect.' });
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(new_password, 10), req.user.id]);
    res.json({ message: 'Password updated.' });
  } catch (e) { next(e); }
});

// GET /api/auth/users  (admin)
router.get('/users', authenticate, authorize('admin'), async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.role, u.is_active, u.employee_id,
              CONCAT(e.first_name,' ',e.last_name) AS employee_name
       FROM users u LEFT JOIN employees e ON e.id = u.employee_id ORDER BY u.username`);
    res.json(rows);
  } catch (e) { next(e); }
});

// PUT /api/auth/users/:id  (admin: activate/deactivate or reset password)
router.put('/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { is_active, password } = req.body;
    if (Number(req.params.id) === req.user.id && is_active === false)
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    if (is_active !== undefined) await db.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
    if (password) {
      if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 10), req.params.id]);
    }
    res.json({ message: 'User updated.' });
  } catch (e) { next(e); }
});

module.exports = router;
