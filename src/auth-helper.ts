import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const USERS_FILE_PATH = path.join(process.cwd(), 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'farmai-jwt-secret-key-2026';

interface User {
  username: string;
  passwordHash: string;
  createdAt: string;
}

// Ensure the users.json file exists
function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE_PATH)) {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify([]));
  }
}

// Get all registered users
export function getUsers(): User[] {
  ensureUsersFile();
  try {
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (error) {
    console.error('Error reading users database:', error);
    return [];
  }
}

// Save users
export function saveUsers(users: User[]) {
  ensureUsersFile();
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users database:', error);
  }
}

// Hash passwords using SHA-256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Sign a JWT token
export function generateToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify a JWT token
export function verifyToken(token: string): { username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    return decoded;
  } catch (error) {
    return null;
  }
}
