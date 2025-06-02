import { authenticator } from 'otplib';
import { decrypt } from '@/lib/crypto';

const secret = decrypt("U2FsdGVkX18XHSywOGVLVrVnGMCJyrAaBndYwnD+i4A="); // ضع السر المشفّر هنا
const code = "JBSWY3DPEHPK3PXP";

const isValid = authenticator.check(code, secret);
console.log("✅ Is valid code:", isValid);