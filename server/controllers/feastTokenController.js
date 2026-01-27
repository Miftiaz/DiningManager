const DiningMonth = require('../models/DiningMonth');
const Student = require('../models/Student');
const FeastToken = require('../models/FeastToken');

// Get Feast Token Subscribers
const getFeastTokenList = async (req, res) => {
  try {
    const managerId = req.managerId;
    const { search } = req.query;

    const diningMonth = await DiningMonth.findOne({
      manager: managerId,
      isActive: true
    });

    if (!diningMonth) {
      return res.status(400).json({ message: 'No active dining month' });
    }

    let query = {
      diningMonth: diningMonth._id
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query);
    const feastTokens = await FeastToken.find({
      diningMonth: diningMonth._id
    }).populate('student');

    const subscribersList = feastTokens.map(token => ({
      id: token._id,
      studentId: token.student.id,
      name: token.student.name,
      paymentStatus: token.isPaid ? 'Paid' : 'Pending',
      totalCost: token.totalCost,
      paidAmount: token.paidAmount,
      dueAmount: token.dueAmount
    }));

    res.json({ subscribersList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Feast Token Details
const getFeastTokenDetails = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const feastToken = await FeastToken.findById(tokenId).populate('student diningMonth');

    if (!feastToken) {
      return res.status(404).json({ message: 'Feast token not found' });
    }

    res.json({
      token: feastToken,
      studentInfo: {
        id: feastToken.student.id,
        name: feastToken.student.name,
        phone: feastToken.student.phone,
        roomNo: feastToken.student.roomNo
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Feast Token
const createFeastToken = async (req, res) => {
  try {
    const managerId = req.managerId;
    const { studentId, startDay } = req.body;

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
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const remainingDays = 31 - startDay; // Days from startDay to day 30
    const totalCost = (remainingDays * 10) + 100;

    const feastToken = new FeastToken({
      student: student._id,
      diningMonth: diningMonth._id,
      startDay,
      endDay: 30,
      remainingDays,
      totalCost,
      dueAmount: totalCost
    });

    await feastToken.save();
    res.status(201).json({ message: 'Feast token created', feastToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Feast Token Payment
const updateFeastTokenPayment = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { paidAmount } = req.body;

    const feastToken = await FeastToken.findById(tokenId);

    if (!feastToken) {
      return res.status(404).json({ message: 'Feast token not found' });
    }

    feastToken.paidAmount = paidAmount;
    feastToken.dueAmount = feastToken.totalCost - paidAmount;
    feastToken.isPaid = feastToken.dueAmount === 0;

    await feastToken.save();
    res.json({ message: 'Payment updated', feastToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFeastTokenList,
  getFeastTokenDetails,
  createFeastToken,
  updateFeastTokenPayment
};
