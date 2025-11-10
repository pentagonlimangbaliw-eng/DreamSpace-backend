import express from 'express';
import mongoose from 'mongoose';
import Design from '../models/Design.js';
import Quote from '../models/Quote.js';
import Item from '../models/Item.js';
import Room from '../models/Room.js';
const router = express.Router();

// RESET kiosk session (soft reset)
router.post('/kiosk/reset-session', async (req, res) => {
  // e.g. clear temporary cache in your DB if used
  res.json({ success: true, message: 'Session reset successfully' });
});

// HARD RESET (wipe demo data)
router.post('/kiosk/reset-hard', async (req, res) => {
  await Design.deleteMany({});
  await Quote.deleteMany({});
  res.json({ success: true, message: 'All design and quote data cleared.' });
});

// DATABASE PING or STATUS
router.get('/status', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const status = dbState === 1 ? 'connected' : 'disconnected';
  res.json({ mongoStatus: status, time: new Date().toISOString() });
});

export default router;
