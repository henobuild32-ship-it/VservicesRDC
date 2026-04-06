import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generatePassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest
  const all = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function validatePhone(phone: string): boolean {
  // Must start with +243 and be 13 characters total
  const pattern = /^\+243[0-9]{9}$/;
  return pattern.test(phone);
}

export function formatPhoneInput(value: string): string {
  // Clean input
  const cleaned = value.replace(/[^\d+]/g, '');
  // Ensure starts with +243
  if (!cleaned.startsWith('+243') && cleaned.startsWith('243')) {
    return '+' + cleaned;
  }
  if (!cleaned.startsWith('+243') && !cleaned.startsWith('243')) {
    if (cleaned.startsWith('+')) return '+243' + cleaned.slice(1);
    if (cleaned.startsWith('0')) return '+243' + cleaned.slice(1);
    return '+243' + cleaned;
  }
  return cleaned;
}

const ADMIN_DEFAULT_PASSWORD = 'Azerty89H$$';
export { ADMIN_DEFAULT_PASSWORD };
