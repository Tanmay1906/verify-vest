import { Router } from 'express';
import * as controller from '../controllers/milestones.controller.js';
import { authMiddleware, requireRole } from '../shared/auth.js';

export const router = Router();

router.get('/', controller.listMilestones);
router.get('/:id', controller.getMilestoneById);
router.post('/', authMiddleware, requireRole(['donor', 'admin']), controller.createMilestone);
router.post('/:id/submit', authMiddleware, requireRole(['applicant', 'admin']), controller.submitMilestone);
router.post('/:id/verify', authMiddleware, requireRole(['verifier', 'admin']), controller.verifyMilestone);
