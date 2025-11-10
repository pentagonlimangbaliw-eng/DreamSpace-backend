// ============================================================
// 🌐 DreamSpace Backend Server (Cloudinary-ready Final Version)
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
import unityRoutes from './routes/unity.js';    // Unity uploads

// 3️⃣ Core dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fileUpload from 'express-fileupload';
import connectDB from './config/db.js';

// === Setup ===
dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Middleware ===
app.use(cors({ origin: '*' }));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
app.use(express.json({ limit: '50mb' })); // Unity scenes
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Serve any static files in /public (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRoutes); // <-- add this
console.log('✅ Registered routes: /api (auth)');

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
