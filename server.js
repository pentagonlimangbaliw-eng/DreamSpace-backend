// ============================================================
// 🌐 DreamSpace Backend Server (Clean Final Version)
// ============================================================

// 1️⃣ Import & register models first
import './models/User.js';
import './models/Design.js';
import './models/Item.js';

// 2️⃣ Then import routes
import designRoutes from './routes/designs.js';
import catalogRoutes from './routes/catalog.js';
import authRoutes from './routes/auth.js';      // optional
import quoteRoutes from './routes/quotes.js';   // optional
import dashboardRouter from './routes/dashboard.js';
import unityRoutes from './routes/unity.js';    // ✅ new route for Unity uploads

// 3️⃣ Core dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fileUpload from 'express-fileupload';
import connectDB from './config/db.js';

// === Setup ===
dotenv.config();
connectDB();

const app = express();

// === File Paths ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Auto-create uploads folder if missing
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created missing folder: /public/uploads');
}

// === Middleware ===
app.use(cors({ origin: '*' }));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
app.use(express.json({ limit: '50mb' })); // allow large JSON (Unity scenes)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === Static file serving (for screenshots and public assets) ===
const uploadsPath = path.resolve(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('📁 Created /public/uploads folder');
}

// ✅ Serve uploads publicly so Unity & browser can access them
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// ✅ Serve any other static files in /public
app.use(express.static(path.join(__dirname, 'public')));

// === Routes ===
app.use('/api/catalog', catalogRoutes);
console.log('✅ Registered routes: /api/catalog');

app.use('/api/designs', designRoutes);
console.log('✅ Registered routes: /api/designs');

app.use('/api/quotes', quoteRoutes);
console.log('✅ Registered routes: /api/quotes');

app.use('/api', dashboardRouter);
console.log('✅ Registered routes: /api/dashboard');

app.use('/api/unity', unityRoutes);
console.log('✅ Registered routes: /api/unity');

// === Health check ===
app.get('/', (req, res) => {
  res.send('🚀 DreamSpace API is running!');
});

// === 404 fallback ===
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
