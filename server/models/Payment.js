const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  diningMonth: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningMonth', required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  mealsDays: { type: Number, required: true }, // Total meals count
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
