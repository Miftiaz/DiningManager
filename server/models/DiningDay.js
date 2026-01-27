const mongoose = require('mongoose');

const diningDaySchema = new mongoose.Schema({
  diningMonth: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningMonth', required: true },
  dayNumber: { type: Number, required: true }, // 1-30
  date: { type: Date, required: true },
  isPast: { type: Boolean, default: false },
  students: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
      meals: { type: Number, default: 2, min: 0, max: 2 } // 0, 1, or 2 meals
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DiningDay', diningDaySchema);
