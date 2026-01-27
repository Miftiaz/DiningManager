const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', required: true },
  diningMonth: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningMonth', required: true },
  id: { type: String, required: true }, // Student ID
  name: { type: String, required: true },
  phone: { type: String, required: true },
  roomNo: { type: String, required: true },
  selectedDays: [
    {
      day: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningDay' }
    }
  ],
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
