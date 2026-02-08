const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  searchStudent,
  getCalendarForAdjustment,
  adjustStudentDays,
  returnToken,
  payFeastDue,
  getAllStudents
} = require('../controllers/borderController');

router.get('/search', authMiddleware, searchStudent);
router.get('/all-students', authMiddleware, getAllStudents);
router.get('/calendar', authMiddleware, getCalendarForAdjustment);
router.post('/adjust', authMiddleware, adjustStudentDays);
router.post('/return-token', authMiddleware, returnToken);
router.post('/pay-feast', authMiddleware, payFeastDue);

module.exports = router;
