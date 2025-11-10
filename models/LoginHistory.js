import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  name: String,
  email: String,
  status: { type: String, enum: ['success', 'fail'], default: 'success' },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('LoginHistory', loginHistorySchema);
