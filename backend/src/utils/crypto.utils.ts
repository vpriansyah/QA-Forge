import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-cbc';

// Derive a 32-byte key from JWT_SECRET or a custom encryption key
const encryptionSecret = process.env.ENCRYPTION_KEY || config.JWT_SECRET;
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(encryptionSecret)
  .digest();

/**
 * Encrypt plain text to hex string with random IV
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt encrypted text hex string back to plain text.
 * Safely returns the original text if decryption fails (backward compatibility).
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // If it doesn't match iv:encrypted pattern, it's probably unencrypted old message
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedTextBuffer = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedTextBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    // Return original if decryption fails (e.g. old plain-text database content)
    return encryptedText;
  }
}
