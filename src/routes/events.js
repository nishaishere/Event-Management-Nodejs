const express = require('express');
const router = express.Router();
const { listEvents, createEvent, recordAttendance } = require('../controllers/eventController');
const { validateCreateEvent, validateAttendance } = require('../middleware/validate');

router.get('/', listEvents);
router.post('/', validateCreateEvent, createEvent);
router.post('/:id/attendance', validateAttendance, recordAttendance);

module.exports = router;
