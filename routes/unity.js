import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Design from '../models/Design.js';

const router = express.Router();

// Directory setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Default user ID for Unity uploads
const OLIRY_ID = '68dc9c0770eb0f45b003a8c6';

// Unity callback endpoint
router.post('/callback/design-saved', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { scene, screenshot } = req.body;
    if (!scene) return res.status(400).json({ message: 'Missing scene data' });

    let parsed;
    try {
      parsed = JSON.parse(scene);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid JSON in scene', error: err.message });
    }

    // Save design in MongoDB
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

    console.log('✅ Unity design saved in MongoDB:', design._id);

    // Save screenshot if available
    if (screenshot) {
      const buffer = Buffer.from(screenshot, 'base64');
      const filename = `design_${design._id}.png`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      const BASE_URL = process.env.BASE_URL || 'https://dreamspace-backend.onrender.com';
design.screenshotUrl = `${BASE_URL}/uploads/${filename}`;

      await design.save();
      console.log('✅ Screenshot saved:', filename);
    }

    res.status(201).json({
      message: 'Design saved successfully',
      designId: design._id,
      screenshotUrl: design.screenshotUrl,
    });
  } catch (err) {
    console.error('❌ Unity upload failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
