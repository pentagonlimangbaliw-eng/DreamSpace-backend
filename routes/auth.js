import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import LoginHistory from '../models/LoginHistory.js';


const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already used' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });
  res.json(user);
});

// LOGIN

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    await LoginHistory.create({ email, status: 'fail' });
    return res.status(400).json({ message: 'User not found' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    await LoginHistory.create({ name: user.name, email, status: 'fail' });
    return res.status(400).json({ message: 'Invalid password' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  await LoginHistory.create({ name: user.name, email, status: 'success' });
  res.json({ token, user });
});


// PROFILE
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});


export default router;
