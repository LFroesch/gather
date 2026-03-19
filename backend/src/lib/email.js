import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_USER;

export const sendPasswordResetEmail = async (to, resetUrl) => {
  try {
    await transporter.sendMail({
      from: `Gather <${FROM_EMAIL}>`,
      to,
      subject: "Reset your Gather password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>You requested a password reset for your Gather account.</p>
          <p>Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #888; font-size: 12px;">Link: ${resetUrl}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send reset email:", error);
    throw new Error("Failed to send reset email");
  }
};
