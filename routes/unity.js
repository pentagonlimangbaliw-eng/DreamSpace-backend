import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import Design from '../models/Design.js';

// Default user ID (same as before)
const OLIRY_ID = '68dc9c0770eb0f45b003a8c6';
const router = express.Router();

// === Cloudinary Configuration ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === Unity callback route ===
router.post('/callback/design-saved', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { scene, screenshot } = req.body;
    if (!scene) return res.status(400).json({ message: 'Missing scene data' });

    // Parse Unity scene JSON
    let parsed;
    try {
      parsed = JSON.parse(scene);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid JSON in scene', error: err.message });
    }

    // Save design first in MongoDB
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

    console.log('✅ Unity design saved in MongoDB:', design._id);

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

      // Save the Cloudinary URL to MongoDB
      design.screenshotUrl = uploadResponse.secure_url;
      await design.save();

      console.log('✅ Screenshot uploaded to Cloudinary:', design.screenshotUrl);
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
