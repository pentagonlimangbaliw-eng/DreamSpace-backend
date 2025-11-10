// routes/dashboard.js
import express from 'express';
import User from '../models/User.js';
import Quote from '../models/Quote.js';
import Design from '../models/Design.js';
import Item from '../models/Item.js';

const router = express.Router();

router.get('/dashboard-summary', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const quotes = await Quote.countDocuments({ status: 'pending' });
    const designs = await Design.countDocuments();
    const catalog = await Item.countDocuments();

    res.json({ users, quotes, designs, catalog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export default router;
