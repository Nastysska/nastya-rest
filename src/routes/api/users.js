import { Router } from 'express';
import { usersController } from '../../controllers/users.controller.js';

const router = Router();

router.get('/users', usersController.list);
router.get('/user/:userId', usersController.get);
router.post('/user', usersController.create);
router.delete('/user/:userId', usersController.remove);

export default router;
