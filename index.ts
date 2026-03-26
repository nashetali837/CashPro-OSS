import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'bank-super-secret-key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'bank-payload-encryption-key-32';

export class BankSecurity {
  // --- Authentication (JWT) ---
  static generateToken(payload: any): string {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return null;
    }
  }

  // --- Encryption (AES-256) ---
  // Used for sensitive API payloads and database fields
  static encryptPayload(data: any): string {
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    return ciphertext;
  }

  static decryptPayload(ciphertext: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return decryptedData;
    } catch (err) {
      console.error("[BankSecurity] Decryption failed:", err);
      return null;
    }
  }

  // --- Hashing (Bcrypt) ---
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
