import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { AppError } from '../utils/AppError.js';

const registerSchema = z.object({
  name: z.string().min(1).max(255),
  password: z.string().min(6).max(255),
});

const loginSchema = z.object({
  name: z.string().min(1).max(255),
  password: z.string().min(6).max(255),
});

function generateAccessToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return jwt.sign(
    { sub: userId },
    secret,
    { expiresIn }
  );
}

export const authController = {
  async register(req, res, next) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'Validation failed', parsed.error.issues);
      }

      const { name, password } = parsed.data;

      const existing = await prisma.user.findUnique({
        where: { name },
      });

      if (existing) {
        throw new AppError(400, 'User with this name already exists');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          password: passwordHash,
        },
      });

      const accessToken = generateAccessToken(user.id);

      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          createdAt: user.createdAt,
        },
        accessToken,
      });
    } catch (err) {
      if (err.code === 'P2002') {
        return next(new AppError(400, 'User with this name already exists'));
      }
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'Validation failed', parsed.error.issues);
      }

      const { name, password } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { name },
      });

      if (!user) {
        throw new AppError(401, 'Invalid credentials');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new AppError(401, 'Invalid credentials');
      }

      const accessToken = generateAccessToken(user.id);

      res.json({
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  },
};
