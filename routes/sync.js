import express from 'express';
import Room from '../models/Room.js';
import Item from '../models/Item.js';
const router = express.Router();

// SYNC rooms
router.get('/rooms', async (req, res) => {
  const { lastUpdated } = req.query;
  const filter = lastUpdated ? { updatedAt: { $gt: new Date(lastUpdated) } } : {};
  const rooms = await Room.find(filter);
  res.json(rooms);
});

// SYNC items
router.get('/items', async (req, res) => {
  const { lastUpdated } = req.query;
  const filter = lastUpdated ? { updatedAt: { $gt: new Date(lastUpdated) } } : {};
  const items = await Item.find(filter);
  res.json(items);
});

export default router;
