import mongoose from 'mongoose';
import Design from './models/Design.js';

const OLIRY_ID = '68dc9c0770eb0f45b003a8c6'; // her ObjectId

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/dreamspace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a sample design
  const design = await Design.create({
    userId: OLIRY_ID,
    roomType: 'Bathroom',
    items: [
      {
        itemId: new mongoose.Types.ObjectId(),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      }
    ],
    screenshotUrl: '/uploads/1730799123456.png'
  });

  console.log('Design created with user Oliry:', design);
  process.exit();
};

run();
