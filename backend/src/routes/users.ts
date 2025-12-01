import { Router } from 'express';
import * as controller from '../controllers/users.controller.js';
import { authMiddleware, requireRole } from '../shared/auth.js';

export const router = Router();

router.get('/', controller.listUsers);
router.get('/:id', controller.getUserById);
router.post('/', authMiddleware, requireRole(['admin']), controller.createUser);
