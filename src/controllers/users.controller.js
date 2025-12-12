import { z } from 'zod';
import { prisma } from '../db.js';
import { AppError } from '../utils/AppError.js';

const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  password: z.string().min(6).max(255),
});

export const usersController = {
  async list(req, res, next) {
    try {
      const users = await prisma.user.findMany();

      const safeUsers = users.map(({ password, ...u }) => u);
      res.json(safeUsers);
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

      const { password, ...safeUser } = user;

      res.json(safeUser);
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

      const { name, password } = parsed.data;

      const existing = await prisma.user.findUnique({ where: { name } });
      if (existing) {
        throw new AppError(400, 'User with this name already exists');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { name, password: passwordHash },
      });

      const { password: _, ...safeUser } = user;

      res.status(201).json(safeUser);
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
