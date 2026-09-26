import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  otp: string;
  username: string;
  expiryMinutes?: number;
}

export const emailService = {
  /**
   * Send an OTP verification email for password reset.
   */
  async sendPasswordResetOtp(options: SendOtpOptions): Promise<boolean> {
    const { to, otp, username, expiryMinutes = 10 } = options;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user || "no-reply@stocksense.com";

    // If SMTP is not configured, fall back to console logging in development
    if (!host || !user || !pass || host === "smtp.example.com") {
      console.warn(`\n======================================================`);
      console.warn(`[STOCKSENSE DEV EMAIL] Password Reset OTP`);
      console.warn(`To: ${to} (User: ${username})`);
      console.warn(`Your OTP Code: ${otp}`);
      console.warn(`Expires in: ${expiryMinutes} minutes`);
      console.warn(`======================================================\n`);
      return true;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700;">StockSense Password Reset</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0284c7; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This code will expire in <strong>${expiryMinutes} minutes</strong>. If you did not request a password reset, please ignore this email or contact your inventory manager immediately.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">StockSense — Modular Inventory Management System</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"StockSense Security" <${from}>`,
        to,
        subject: `Your StockSense password reset code: ${otp}`,
        text: `Your StockSense password reset code is ${otp}. It will expire in ${expiryMinutes} minutes.`,
        html,
      });

      return true;
    } catch (error) {
      console.error("[EmailService Error]: Failed to send password reset email:", error);
      // We don't crash the request, but log the error
      return false;
    }
  },
};
