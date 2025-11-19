// Simple logging utility

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`ℹ️  [INFO] ${message}`, ...args);
    }
  },

  error: (message, error = null) => {
    if (isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, error || '');
    }
  },

  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`⚠️  [WARN] ${message}`, ...args);
    }
  },

  debug: (message, ...args) => {
    if (isDevelopment && process.env.DEBUG === 'true') {
      console.debug(`🐛 [DEBUG] ${message}`, ...args);
    }
  },

  success: (message, ...args) => {
    if (isDevelopment) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  }
};
