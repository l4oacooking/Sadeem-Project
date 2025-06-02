import CryptoJS from 'crypto-js';

const secretKey = '5cd6e0ae8f0a4799a4a773d39f486e21'; // لا تغيره

export function encrypt(value: string): string {
  return CryptoJS.AES.encrypt(value, secretKey).toString();
}

export function decrypt(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Decryption error:', err);
    return '';
  }
}