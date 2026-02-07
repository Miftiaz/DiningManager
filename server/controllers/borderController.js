const DiningMonth = require('../models/DiningMonth');
const DiningDay = require('../models/DiningDay');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const FeastToken = require('../models/FeastToken');

// Search Student
const searchStudent = async (req, res) => {
  try {
    const { studentId } = req.query;
    const managerId = req.managerId;

    const diningMonth = await DiningMonth.findOne({
      manager: managerId,
      isActive: true
    });

    if (!diningMonth) {
      return res.status(400).json({ message: 'No active dining month' });
    }

    // Get dining days
    const calendarDays = await DiningDay.find({ diningMonth: diningMonth._id }).sort({ date: 1 });

    // Format break days for calendar from diningMonth.breakDays array
    const breakDates = diningMonth.breakDays.map(bd => ({
      date: bd.date,
      reason: bd.reason || 'Break'
    }));

    let student = await Student.findOne({
      manager: managerId,
      diningMonth: diningMonth._id,
      id: studentId
    }).populate('selectedDays.day');

    if (!student) {
      // Student not found, return calendar for new entry
      return res.json({
        exists: false,
        calendarDays,
        breakDates,
        diningMonth
      });
    }

    // Student exists
    const selectedDaysCount = student.selectedDays.length;
    const payableAmount = selectedDaysCount * 80;

    res.json({
      exists: true,
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        roomNo: student.roomNo,
        selectedDaysCount,
        payableAmount,
        paidAmount: student.paidAmount,
        dueAmount: student.dueAmount
      },
      studentData: student,
      calendarDays,
      breakDates,
      diningMonth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Calendar for Adjustment
const getCalendarForAdjustment = async (req, res) => {
  try {
    const managerId = req.managerId;

    const diningMonth = await DiningMonth.findOne({
      manager: managerId,
      isActive: true
    });

    if (!diningMonth) {
      return res.status(400).json({ message: 'No active dining month' });
    }

    const calendarDays = await DiningDay.find({ diningMonth: diningMonth._id });

    res.json({
      calendarDays,
      diningMonth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Adjust Student Dining Days
const adjustStudentDays = async (req, res) => {
  try {
    const managerId = req.managerId;
    const { studentId, name, phone, roomNo, selectedDays, paidAmount } = req.body;

    const diningMonth = await DiningMonth.findOne({
      manager: managerId,
      isActive: true
    });

    if (!diningMonth) {
      return res.status(400).json({ message: 'No active dining month' });
    }

    // Validate selectedDays has dayId
    if (!selectedDays || !Array.isArray(selectedDays)) {
      return res.status(400).json({ message: 'selectedDays must be an array' });
    }

    let student = await Student.findOne({
      manager: managerId,
      diningMonth: diningMonth._id,
      id: studentId
    });

    if (!student) {
      // Create new student
      student = new Student({
        manager: managerId,
        diningMonth: diningMonth._id,
        id: studentId,
        name,
        phone,
        roomNo,
        selectedDays: selectedDays.map(day => ({
          day: day.dayId
        }))
      });
    } else {
      // Update existing student - append new days to existing days
      if (name) student.name = name;
      if (phone) student.phone = phone;
      if (roomNo) student.roomNo = roomNo;
      
      // Get existing day IDs
      const existingDayIds = student.selectedDays.map(d => d.day.toString());
      const newDayIds = selectedDays.map(day => day.dayId);
      
      // Combine existing and new days (remove duplicates)
      const allDayIds = new Set([...existingDayIds, ...newDayIds]);
      student.selectedDays = Array.from(allDayIds).map(dayId => ({
        day: dayId
      }));
    }

    // Add student to DiningDay documents for selected days
    const selectedDayIds = selectedDays.map(day => day.dayId);
    await DiningDay.updateMany(
      { _id: { $in: selectedDayIds } },
      { $addToSet: { students: { student: student._id } } }
    );

    // Set payment amounts (80 TK per day) - calculate based on ALL selected days (existing + new)
    const totalDays = student.selectedDays.length;
    const payableAmount = totalDays * 80;
    student.paidAmount = paidAmount || 0;
    student.dueAmount = Math.max(0, payableAmount - (paidAmount || 0));

    await student.save();

    // Create payment record if paid amount > 0
    if (paidAmount && paidAmount > 0) {
      const payment = new Payment({
        student: student._id,
        diningMonth: diningMonth._id,
        amount: paidAmount,
        mealsDays: totalDays
      });
      await payment.save();
    }

    res.json({ message: 'Student updated', student });
  } catch (error) {
    console.error('Error adjusting student days:', error);
    res.status(500).json({ message: error.message });
  }
};

// Return Token - Remove selected days from student
const returnToken = async (req, res) => {
  try {
    const managerId = req.managerId;
    const { studentId, datesToRemove } = req.body;

    if (!datesToRemove || !Array.isArray(datesToRemove) || datesToRemove.length === 0) {
      return res.status(400).json({ message: 'datesToRemove must be a non-empty array' });
    }

    const diningMonth = await DiningMonth.findOne({
      manager: managerId,
      isActive: true
    });

    if (!diningMonth) {
      return res.status(400).json({ message: 'No active dining month' });
    }

    const student = await Student.findOne({
      manager: managerId,
      diningMonth: diningMonth._id,
      id: studentId
    }).populate('selectedDays.day');

    if (!student) {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Parse dates to remove
    const datesToRemoveSet = new Set(datesToRemove.map(d => {
      const date = new Date(d);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }));

    // Get DiningDay IDs to remove from student
    const diningDayIdsToRemove = [];
    const selectedDaysToKeep = [];

    student.selectedDays.forEach(selectedDay => {
      const dayDate = new Date(selectedDay.day.date);
      const dayDateStr = `${dayDate.getUTCFullYear()}-${String(dayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dayDate.getUTCDate()).padStart(2, '0')}`;

      if (datesToRemoveSet.has(dayDateStr)) {
        diningDayIdsToRemove.push(selectedDay.day._id);
      } else {
        selectedDaysToKeep.push(selectedDay);
      }
    });

    // Update student - remove selected days
    student.selectedDays = selectedDaysToKeep;

    // Recalculate payment amounts (80 TK per day)
    const remainingDays = selectedDaysToKeep.length;
    const payableAmount = remainingDays * 80;
    student.dueAmount = Math.max(0, payableAmount - student.paidAmount);

    await student.save();

    // Remove student ID from the DiningDay documents
    await DiningDay.updateMany(
      { _id: { $in: diningDayIdsToRemove } },
      { $pull: { students: { student: student._id } } }
    );

    res.json({ message: 'Token returned successfully', student });
  } catch (error) {
    console.error('Error returning token:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchStudent,
  getCalendarForAdjustment,
  adjustStudentDays,
  returnToken
};
