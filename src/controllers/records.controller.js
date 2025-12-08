import { z } from 'zod';
import { prisma } from '../db.js';
import { AppError } from '../utils/AppError.js';

const createRecordSchema = z.object({
  userId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  amount: z.number().positive(),
});

export const recordsController = {
  async list(req, res, next) {
    try {
      const { user_id, category_id } = req.query;

      if (!user_id && !category_id) {
        throw new AppError(
          400,
          'At least one of query params "user_id" or "category_id" is required'
        );
      }

      const where = {};

      if (user_id) {
        const uid = Number(user_id);
        if (!Number.isInteger(uid)) {
          throw new AppError(400, 'Invalid user_id');
        }
        where.userId = uid;
      }

      if (category_id) {
        const cid = Number(category_id);
        if (!Number.isInteger(cid)) {
          throw new AppError(400, 'Invalid category_id');
        }
        where.categoryId = cid;
      }

      const records = await prisma.record.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json(records);
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const id = Number(req.params.recordId);
      if (!Number.isInteger(id)) {
        throw new AppError(400, 'Invalid record id');
      }

      const record = await prisma.record.findUnique({
        where: { id },
      });

      if (!record) {
        throw new AppError(404, 'Record not found');
      }

      res.json(record);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const parsed = createRecordSchema.safeParse({
        ...req.body,
        userId: Number(req.body?.userId),
        categoryId: Number(req.body?.categoryId),
        amount: Number(req.body?.amount),
      });

      if (!parsed.success) {
        throw new AppError(400, 'Validation failed', parsed.error.issues);
      }

      const { userId, categoryId, amount } = parsed.data;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new AppError(404, 'Category not found');
      }

      const record = await prisma.record.create({
        data: {
          userId,
          categoryId,
          amount,
        },
      });

      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const id = Number(req.params.recordId);
      if (!Number.isInteger(id)) {
        throw new AppError(400, 'Invalid record id');
      }

      await prisma.record.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (err) {
      if (err.code === 'P2025') {
        return next(new AppError(404, 'Record not found'));
      }
      next(err);
    }
  },
};
