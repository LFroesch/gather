import jwt from "jsonwebtoken";

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateImage = (base64String) => {
  const match = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return { valid: false, error: "Invalid image format" };
  }

  const mimeType = match[1];
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `Unsupported image type: ${mimeType}. Allowed: JPEG, PNG, GIF, WEBP` };
  }

  // base64 is ~4/3 the size of the original binary
  const sizeInBytes = Math.ceil((match[2].length * 3) / 4);
  if (sizeInBytes > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Image must be under 5MB" };
  }

  return { valid: true };
};

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};