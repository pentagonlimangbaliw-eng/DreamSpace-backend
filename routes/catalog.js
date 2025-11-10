import express from 'express';
import Item from '../models/Item.js'; // ✅ make sure file name is correct (case-sensitive)

const router = express.Router();

/* ===========================
   GET all items
=========================== */
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching items:', err);
    res.status(500).json({ message: 'Server error fetching items' });
  }
});

/* ===========================
   GET single item by ID
=========================== */
router.get('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error('❌ Error fetching item:', err);
    res.status(500).json({ message: 'Server error fetching item' });
  }
});

/* ===========================
   POST new item
=========================== */
router.post('/items', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('❌ Error adding item:', err);
    res.status(500).json({ message: 'Server error adding item' });
  }
});

/* ===========================
   PUT (Edit) item by ID
=========================== */
router.put('/items/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    console.error('❌ Error updating item:', err);
    res.status(500).json({ message: 'Server error updating item' });
  }
});

/* ===========================
   DELETE item by ID
=========================== */
router.delete('/items/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: '✅ Item deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting item:', err);
    res.status(500).json({ message: 'Server error deleting item' });
  }
});

export default router;
/*import express from 'express';
import Item from '../models/item.js'; // ✅ Use your existing model

const router = express.Router();

// GET all items
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching items:', err);
    res.status(500).json({ message: 'Server error fetching items' });
  }
});

// POST new item
router.post('/items', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('❌ Error adding item:', err);
    res.status(500).json({ message: 'Server error adding item' });
  }
});

export default router;
/*import express from 'express';
import Item from '../models/Item.js';

const router = express.Router();

// ✅ GET all items (with optional filters)
router.get('/items', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const items = await Item.find(filter).skip(skip).limit(parseInt(limit));
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ TOGGLE like status
router.patch('/:id/like', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.liked = !item.liked; // toggle true/false
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST new item
router.post('/items', async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create item', error: err.message });
  }
});

// ✅ DELETE item
router.delete('/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete item' });
  }
});

export default router;*/
