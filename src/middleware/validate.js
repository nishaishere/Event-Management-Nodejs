const { body, param, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateCreateEvent = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('date').isISO8601().withMessage('Date must be a valid ISO 8601 datetime').toDate(),
  body('total_capacity').isInt({ min: 1 }).withMessage('total_capacity must be a positive integer'),
  body('description').optional().isString(),
  handleValidation,
];

const validateCreateBooking = [
  body('user_id').isInt({ min: 1 }).withMessage('user_id must be a positive integer'),
  body('event_id').isInt({ min: 1 }).withMessage('event_id must be a positive integer'),
  body('tickets_count').optional().isInt({ min: 1 }).withMessage('tickets_count must be at least 1'),
  handleValidation,
];

const validateAttendance = [
  param('id').isInt({ min: 1 }).withMessage('Event ID must be a positive integer'),
  body('code').notEmpty().withMessage('Booking code is required').isUUID().withMessage('Code must be a valid UUID'),
  handleValidation,
];

const validateUserId = [
  param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  handleValidation,
];

module.exports = { validateCreateEvent, validateCreateBooking, validateAttendance, validateUserId };
