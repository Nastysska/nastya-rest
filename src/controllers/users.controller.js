import { z } from 'zod';
import { prisma } from '../db.js';
import { AppError } from '../utils/AppError.js';

const createUserSchema = z.object({
  name: z.string().min(1).max(255),
});

export const usersController = {
  async list(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        include: {
          categories: true,
        },
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const id = Number(req.params.userId);
      if (!Number.isInteger(id)) {
        throw new AppError(400, 'Invalid user id');
      }

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          categories: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'Validation failed', parsed.error.issues);
      }

      const { name } = parsed.data;

      const user = await prisma.user.create({
        data: { name },
      });

      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const id = Number(req.params.userId);
      if (!Number.isInteger(id)) {
        throw new AppError(400, 'Invalid user id');
      }

      await prisma.record.deleteMany({ where: { userId: id } });
      await prisma.category.deleteMany({ where: { ownerId: id } });

      await prisma.user.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (err) {
      if (err.code === 'P2025') {
        return next(new AppError(404, 'User not found'));
      }
      next(err);
    }
  },
};
