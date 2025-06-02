import { totp } from 'otplib';

export function verifyTOTP(secret: string, code: string): boolean {
  try {
    return totp.check(code, secret);
  } catch (error) {
    console.error("TOTP validation error:", error);
    return false;
  }
}