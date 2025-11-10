import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import Design from '../models/Design.js';
import Item from '../models/Item.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// === Cloudinary Configuration ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === Multer setup (optional, only for direct buffer uploads) ===
const storage = multer.memoryStorage(); 
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
   Endpoint: POST /design-saved
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

    // Save base design in MongoDB
    const design = await Design.create({
      userId: OLIRY_ID,
      roomType: parsed.roomType || parsed.room || 'Unknown',
      items:
        parsed.items?.map(i => ({
          itemId: i.productId,
          position: { x: i.position[0], y: i.position[1], z: i.position[2] },
          rotation: { x: i.rotation[0], y: i.rotation[1], z: i.rotation[2] },
          scale: {
            x: i.scale?.[0] || 1,
            y: i.scale?.[1] || 1,
            z: i.scale?.[2] || 1,
          },
        })) || [],
      screenshotUrl: null,
    });

    console.log('✅ Design saved in MongoDB:', design._id);

    // === Upload screenshot to Cloudinary ===
    if (screenshot) {
      const uploadResponse = await cloudinary.uploader.upload(
        `data:image/png;base64,${screenshot}`,
        {
          folder: 'dreamspace/designs',
          public_id: `design_${design._id}`,
          overwrite: true,
          resource_type: 'image',
        }
      );

      design.screenshotUrl = uploadResponse.secure_url;
      await design.save();
      console.log('✅ Screenshot uploaded to Cloudinary:', design.screenshotUrl);
    }

    res.status(201).json({
      message: 'Design saved successfully',
      designId: design._id,
      screenshotUrl: design.screenshotUrl,
      design,
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

    const designsWithTotal = designs.map(d => {
      const totalPrice = d.items.reduce((sum, i) => sum + (i.itemId?.price || 0), 0);
      return { ...d.toObject(), totalPrice };
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
