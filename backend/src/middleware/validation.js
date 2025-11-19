import { body, query, validationResult } from 'express-validator';

// Validation error handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Search validation
export const validateSearch = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query is required')
    .isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters')
    .escape(),
  query('type')
    .optional()
    .isIn(['all', 'events', 'users', 'posts']).withMessage('Invalid search type'),
  validate
];

// Event validation
export const validateEvent = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
    .escape(),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('location.name')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location name too long')
    .escape(),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) throw new Error('Maximum 10 tags allowed');
      return tags.every(tag => typeof tag === 'string' && tag.length <= 30);
    }).withMessage('Invalid tags format'),
  validate
];

// Post validation
export const validatePost = [
  body('text')
    .trim()
    .notEmpty().withMessage('Post text is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Post must be between 1 and 5000 characters'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) throw new Error('Maximum 10 tags allowed');
      return tags.every(tag => typeof tag === 'string' && tag.length <= 30);
    }).withMessage('Invalid tags format'),
  validate
];

// Comment validation
export const validateComment = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  validate
];

// Message validation
export const validateMessage = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Message too long'),
  body('image')
    .optional()
    .isURL().withMessage('Invalid image URL'),
  validate
];

// Profile update validation
export const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must be max 500 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  validate
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];
