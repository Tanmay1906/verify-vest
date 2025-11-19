import { Router } from 'express';
import * as controller from '../controllers/proposals.controller.js';
import { authMiddleware, requireRole } from '../shared/auth.js';

export const router = Router();

router.get('/', controller.listProposals);
router.get('/:id', controller.getProposalById);
router.post('/', authMiddleware, requireRole(['applicant', 'admin']), controller.createProposal);
router.post('/:id/approve', authMiddleware, requireRole(['verifier', 'admin']), controller.approveProposal);
router.post('/:id/reject', authMiddleware, requireRole(['verifier', 'admin']), controller.rejectProposal);
