import { Router } from 'express';
import { categoriesController } from '../../controllers/categories.controller.js';

const router = Router();

router.get('/category', categoriesController.list);
router.post('/category', categoriesController.create);
router.delete('/category', categoriesController.remove);

export default router;
