import { Filter } from 'bad-words';
import sanitizeHtml from 'sanitize-html';

const filter = new Filter();

const cleanString = (str) => {
  let value = sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });
  try {
    value = filter.clean(value);
  } catch (_) {
    // ignore if word is too short etc.
  }
  return value;
};

export const sanitizeInput = (fields) => (req, res, next) => {
  for (const field of fields) {
    const val = req.body[field];
    if (val && typeof val === 'string') {
      req.body[field] = cleanString(val);
    } else if (Array.isArray(val)) {
      req.body[field] = val.map(item => typeof item === 'string' ? cleanString(item) : item);
    }
  }
  next();
};
