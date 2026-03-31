import crypto from 'node:crypto';

export function generateJwtSecret() {
  return crypto.randomBytes(32).toString('hex');
}
