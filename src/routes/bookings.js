const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings } = require('../controllers/bookingController');
const { validateCreateBooking, validateUserId } = require('../middleware/validate');

router.post('/', validateCreateBooking, createBooking);

module.exports = router;

// Exported separately so it can be mounted under /users
module.exports.getUserBookings = getUserBookings;
module.exports.validateUserId = validateUserId;
