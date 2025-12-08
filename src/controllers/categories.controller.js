import { z } from 'zod';
import { prisma } from '../db.js';
import { AppError } from '../utils/AppError.js';

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  userId: z.number().int().positive().optional(),
});

export const categoriesController = {
  async list(req, res, next) {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        const categories = await prisma.category.findMany();
        return res.json(categories);
      }

      const uid = Number(user_id);
      if (!Number.isInteger(uid)) {
        throw new AppError(400, 'Invalid user_id');
      }

      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { isCustom: false },
            {
              isCustom: true,
              ownerId: uid,
            },
          ],
        },
      });

      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const parsed = createCategorySchema.safeParse({
        ...req.body,
        userId: req.body?.userId ? Number(req.body.userId) : undefined,
      });

      if (!parsed.success) {
        throw new AppError(400, 'Validation failed', parsed.error.issues);
      }

      const { name, userId } = parsed.data;

      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new AppError(404, 'User not found for custom category');
        }

        const category = await prisma.category.create({
          data: {
            name,
            isCustom: true,
            ownerId: userId,
          },
        });

        return res.status(201).json(category);
      }

      const category = await prisma.category.create({
        data: {
          name,
          isCustom: false,
          ownerId: null,
        },
      });

      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const idParam = req.query.id;
      const id = Number(idParam);

      if (!idParam || !Number.isInteger(id)) {
        throw new AppError(400, 'Query param "id" is required and must be integer');
      }

      await prisma.record.deleteMany({ where: { categoryId: id } });

      await prisma.category.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (err) {
      if (err.code === 'P2025') {
        return next(new AppError(404, 'Category not found'));
      }
      next(err);
    }
  },
};
