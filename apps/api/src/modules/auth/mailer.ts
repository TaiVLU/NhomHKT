import nodemailer from 'nodemailer';
import type { Environment } from '../../config/environment.js';

export interface Mailer {
  sendPasswordResetOtp(email: string, otp: string): Promise<void>;
}

export class FakeMailer implements Mailer {
  readonly deliveries: Array<{ email: string; otp: string }> = [];
  sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    this.deliveries.push({ email, otp });
    return Promise.resolve();
  }
}

export const createMailer = (environment: Environment): Mailer => {
  if (environment.MAIL_MODE === 'fake') return new FakeMailer();
  const transporter = nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    secure: environment.SMTP_SECURE,
    auth:
      environment.SMTP_USER && environment.SMTP_PASSWORD
        ? { user: environment.SMTP_USER, pass: environment.SMTP_PASSWORD }
        : undefined,
  });
  return {
    async sendPasswordResetOtp(email, otp) {
      await transporter.sendMail({
        from: environment.SMTP_FROM,
        to: email,
        subject: 'Mã OTP đặt lại mật khẩu HKTStore',
        text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`,
      });
    },
  };
};
