import { Router } from 'express';
import * as controller from '../controllers/grants.controller.js';
import { authMiddleware, requireRole } from '../shared/auth.js';

export const router = Router();

router.get('/', controller.listGrants);
router.get('/:id', controller.getGrantById);
router.post('/', authMiddleware, requireRole(['donor', 'admin']), controller.createGrant);
router.patch('/:id', authMiddleware, requireRole(['donor', 'admin']), controller.updateGrantStatus);
