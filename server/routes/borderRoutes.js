const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  searchStudent,
  getCalendarForAdjustment,
  adjustStudentDays,
  returnToken
} = require('../controllers/borderController');

router.get('/search', authMiddleware, searchStudent);
router.get('/calendar', authMiddleware, getCalendarForAdjustment);
router.post('/adjust', authMiddleware, adjustStudentDays);
router.post('/return-token', authMiddleware, returnToken);

module.exports = router;
