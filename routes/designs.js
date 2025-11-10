import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Design from '../models/Design.js';
import Item from '../models/Item.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// === Directory Setup ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Multer setup for manual uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// === Default user for Unity uploads ===
const OLIRY_ID = '68dc9c0770eb0f45b003a8c6';

/* ------------------------------------------------------------------
   🧩 CREATE a new design (manual via API)
   ------------------------------------------------------------------ */
router.post('/', protect, async (req, res) => {
  try {
    const design = await Design.create({ ...req.body, userId: OLIRY_ID });
    res.status(201).json(design);
  } catch (err) {
    console.error('❌ Design creation failed:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
   🧠 UNITY UPLOAD: screenshot + scene
   Endpoint: POST /callback/design-saved
   ------------------------------------------------------------------ */
router.post('/design-saved', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { scene, screenshot } = req.body;
    if (!scene) return res.status(400).json({ message: 'Missing scene data' });

    let parsed;
    try {
      parsed = JSON.parse(scene);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid JSON in scene', error: err.message });
    }

    // Save design in MongoDB first
    const design = await Design.create({
      userId: OLIRY_ID,
      roomType: parsed.roomType || parsed.room || 'Unknown',
      items: parsed.items?.map(i => ({
        itemId: i.productId,
        position: { x: i.position[0], y: i.position[1], z: i.position[2] },
        rotation: { x: i.rotation[0], y: i.rotation[1], z: i.rotation[2] },
        scale: { x: i.scale?.[0] || 1, y: i.scale?.[1] || 1, z: i.scale?.[2] || 1 },
      })) || [],
      screenshotUrl: null,
    });
    console.log('✅ Design saved in MongoDB:', design._id);

    // Save screenshot if provided
    let screenshotUrl = null;
    if (screenshot) {
      const buffer = Buffer.from(screenshot, 'base64');
      const filename = `design_${design._id}.png`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      const BASE_URL = process.env.BASE_URL || 'https://dreamspace-backend.onrender.com';
design.screenshotUrl = `${BASE_URL}/uploads/${filename}`;
      await design.save();
      screenshotUrl = design.screenshotUrl;
      console.log('✅ Screenshot saved:', filename);
    }

    // Return proper JSON for Unity
    res.status(201).json({
      message: 'Design saved successfully',
      designId: design._id,
      screenshotUrl,
      design
    });
  } catch (err) {
    console.error('❌ Unity upload failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ------------------------------------------------------------------
   📋 GET all designs
   ------------------------------------------------------------------ */
router.get('/', async (req, res) => {
  try {
    let query = Design.find()
      .populate('userId', 'name email')
      .populate('items.itemId', 'name desc price previewImage category');

    if (req.query.recent) query = query.sort({ createdAt: -1 }).limit(10);

    const designs = await query;

    // ✅ Build base URL dynamically from request
    const BASE_URL = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const designsWithTotal = designs.map(d => {
      const totalPrice = d.items.reduce((sum, i) => sum + (i.itemId?.price || 0), 0);

      // ✅ Make screenshot URL absolute if needed
      let screenshotUrl = d.screenshotUrl;
      if (screenshotUrl && !screenshotUrl.startsWith('http')) {
        screenshotUrl = `${BASE_URL}${screenshotUrl}`;
      }

      return { 
        ...d.toObject(), 
        totalPrice, 
        screenshotUrl 
      };
    });

    res.json(designsWithTotal);
  } catch (err) {
    console.error('❌ Fetch all designs failed:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
   👤 GET designs by user
   ------------------------------------------------------------------ */
router.get('/user/:userId', async (req, res) => {
  try {
    const designs = await Design.find({ userId: req.params.userId })
      .populate('userId', 'name email')
      .populate('items.itemId', 'name desc price previewImage category');

    const designsWithTotal = designs.map(d => {
      const totalPrice = d.items.reduce((sum, i) => sum + (i.itemId?.price || 0), 0);
      return { ...d.toObject(), totalPrice };
    });

    res.json(designsWithTotal);
  } catch (err) {
    console.error('❌ Fetch user designs failed:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
   🔍 GET single design
   ------------------------------------------------------------------ */
router.get('/:id', async (req, res) => {
  try {
    const design = await Design.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.itemId', 'name desc price previewImage category');

    if (!design) return res.status(404).json({ message: 'Design not found' });

    const totalPrice = design.items.reduce((sum, i) => sum + (i.itemId?.price || 0), 0);
    res.json({ ...design.toObject(), totalPrice });
  } catch (err) {
    console.error('❌ Fetch design failed:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
   ✏️ UPDATE design
   ------------------------------------------------------------------ */
router.put('/:id', async (req, res) => {
  try {
    const updated = await Design.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('userId', 'name email')
      .populate('items.itemId', 'name desc price previewImage category');

    if (!updated) return res.status(404).json({ message: 'Design not found' });

    const totalPrice = updated.items.reduce((sum, i) => sum + (i.itemId?.price || 0), 0);
    res.json({ ...updated.toObject(), totalPrice });
  } catch (err) {
    console.error('❌ Update design failed:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
   🗑 DELETE design
   ------------------------------------------------------------------ */
router.delete('/:id', async (req, res) => {
  try {
    await Design.findByIdAndDelete(req.params.id);
    res.json({ message: 'Design deleted' });
  } catch (err) {
    console.error('❌ Delete design failed:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
