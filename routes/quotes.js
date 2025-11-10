import express from 'express';
import Quote from '../models/Quote.js';

const router = express.Router();

// GET all quotes (with filters)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const quotes = await Quote.find(filter)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price category')
      .sort({ createdAt: -1 });

    res.json(quotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// POST new quote
router.post('/', async (req, res) => {
  try {
    const quote = new Quote(req.body);
    await quote.save();
    res.status(201).json(quote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
