import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validation
export const validateSignup = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .trim(),
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .trim()
    .escape()
    .isLength({ max: 100 }).withMessage('Full name must be less than 100 characters'),
  body('username')
    .notEmpty().withMessage('Username is required')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  handleValidationErrors
];

export const validateLogin = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .trim(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .trim(),
  handleValidationErrors
];

// Event validation
export const validateCreateEvent = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .trim()
    .escape()
    .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Valid date is required'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Valid end date is required'),
  body('category')
    .optional()
    .isIn(['social', 'professional', 'educational', 'entertainment', 'sports', 'other'])
    .withMessage('Invalid category'),
  body('maxAttendees')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Max attendees must be between 1 and 10000'),
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean'),
  body('venue')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 200 }).withMessage('Venue must be less than 200 characters'),
  handleValidationErrors
];

export const validateUpdateEvent = [
  param('eventId')
    .isMongoId().withMessage('Invalid event ID'),
  body('title')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  body('date')
    .optional()
    .isISO8601().withMessage('Valid date is required'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Valid end date is required'),
  body('category')
    .optional()
    .isIn(['social', 'professional', 'educational', 'entertainment', 'sports', 'other'])
    .withMessage('Invalid category'),
  body('maxAttendees')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Max attendees must be between 1 and 10000'),
  handleValidationErrors
];

export const validateRSVP = [
  param('eventId')
    .isMongoId().withMessage('Invalid event ID'),
  body('status')
    .isIn(['yes', 'no', 'maybe']).withMessage('Status must be yes, no, or maybe'),
  handleValidationErrors
];

// Post validation
export const validateCreatePost = [
  body('content')
    .notEmpty().withMessage('Content is required')
    .trim()
    .isLength({ max: 5000 }).withMessage('Content must be less than 5000 characters'),
  body('type')
    .optional()
    .isIn(['general', 'event-related', 'announcement'])
    .withMessage('Invalid post type'),
  body('eventId')
    .optional()
    .isMongoId().withMessage('Invalid event ID'),
  handleValidationErrors
];

// Location validation
export const validateLocationUpdate = [
  body('city')
    .notEmpty().withMessage('City is required')
    .trim()
    .escape()
    .isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
  body('state')
    .notEmpty().withMessage('State is required')
    .trim()
    .escape()
    .isLength({ max: 100 }).withMessage('State must be less than 100 characters'),
  body('country')
    .notEmpty().withMessage('Country is required')
    .trim()
    .escape()
    .isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
  body('coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [lng, lat]'),
  body('coordinates.*')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid coordinates'),
  handleValidationErrors
];

export const validateSearchRadius = [
  body('nearMeRadius')
    .optional()
    .isInt({ min: 5, max: 100 }).withMessage('Search radius must be between 5 and 100 miles'),
  handleValidationErrors
];

// Search validation
export const validateSearch = [
  query('q')
    .notEmpty().withMessage('Search query is required')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
  query('type')
    .optional()
    .isIn(['events', 'users', 'posts', 'all']).withMessage('Invalid search type'),
  handleValidationErrors
];

// Message validation
export const validateSendMessage = [
  body('text')
    .notEmpty().withMessage('Message text is required')
    .trim()
    .isLength({ max: 2000 }).withMessage('Message must be less than 2000 characters'),
  handleValidationErrors
];

// MongoDB ID validation
export const validateMongoId = [
  param('id')
    .isMongoId().withMessage('Invalid ID'),
  handleValidationErrors
];
