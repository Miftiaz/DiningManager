const mongoose = require('mongoose');

const feastTokenSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  diningMonth: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningMonth', required: true },
  startDay: { type: Number, required: true },
  endDay: { type: Number, required: true },
  remainingDays: { type: Number, required: true },
  totalCost: { type: Number, required: true }, // (Remaining days × 10) + 100
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FeastToken', feastTokenSchema);
