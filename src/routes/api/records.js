import { Router } from 'express';
import { recordsController } from '../../controllers/records.controller.js';

const router = Router();

router.get('/record', recordsController.list);
router.get('/record/:recordId', recordsController.get);
router.post('/record', recordsController.create);
router.delete('/record/:recordId', recordsController.remove);

export default router;
