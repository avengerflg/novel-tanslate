import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, authMiddleware, AuthRequest } from '../middleware/auth.js';
import { seedNewUserData } from '../services/seedUser.js';

export const authRouter = Router();

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)').get(cleanUsername, cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, cleanUsername, cleanEmail, passwordHash, now);

    // Seed default novels, settings, and glossary for this new user
    seedNewUserData(userId);

    const token = jwt.sign(
      { id: userId, username: cleanUsername, email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: { id: userId, username: cleanUsername, email: cleanEmail }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanIdentifier = username.trim().toLowerCase();
    const user = db.prepare(`
      SELECT id, username, email, password_hash FROM users
      WHERE username = ? OR email = ?
    `).get(cleanIdentifier, cleanIdentifier) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Current User Profile
authRouter.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

