// routes/unity.js
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import Design from '../models/Design.js';

// Default user ID (replace with dynamic auth later if needed)
const OLIRY_ID = '68dc9c0770eb0f45b003a8c6';
const router = express.Router();

// === Cloudinary Configuration ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === Unity Callback Route ===
router.post('/callback/design-saved', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { scene, screenshot } = req.body;

    // 🧩 Validate request body
    if (!scene || !screenshot) {
      return res.status(400).json({ message: 'Missing scene or screenshot data' });
    }

    // 🧩 Parse Unity scene JSON
    let parsedScene;
    try {
      parsedScene = JSON.parse(scene);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid JSON in scene', error: err.message });
    }

    // === Step 1: Upload screenshot to Cloudinary ===
    const uploadResponse = await cloudinary.uploader.upload(
      `data:image/png;base64,${screenshot}`,
      {
        folder: 'dreamspace/designs',
        public_id: `design_${Date.now()}`, // timestamp-based unique ID
        overwrite: true,
        resource_type: 'image',
      }
    );

    // === Step 2: Save Design document in MongoDB ===
    const design = await Design.create({
      userId: OLIRY_ID,
      roomType: parsedScene.roomType || parsedScene.room || 'Unknown',
      items:
        parsedScene.items?.map(i => ({
          itemId: i.productId,
          position: { x: i.position[0], y: i.position[1], z: i.position[2] },
          rotation: { x: i.rotation[0], y: i.rotation[1], z: i.rotation[2] },
          scale: {
            x: i.scale?.[0] || 1,
            y: i.scale?.[1] || 1,
            z: i.scale?.[2] || 1,
          },
        })) || [],
      screenshotUrl: uploadResponse.secure_url, // ✅ Cloudinary URL
      totalPrice: 0, // can compute later
    });

    console.log('✅ Design saved:', design._id);
    console.log('🌤 Cloudinary URL:', design.screenshotUrl);

    // === Step 3: Send response back to Unity ===
    res.status(201).json({
      message: '✅ Design saved successfully!',
      designId: design._id,
      screenshotUrl: design.screenshotUrl,
    });
  } catch (err) {
    console.error('❌ Unity upload failed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
