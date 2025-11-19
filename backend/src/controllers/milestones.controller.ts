import { Request, Response } from 'express';
import * as service from '../services/milestones.service.js';
import type { NextFunction } from 'express';
import { getPagination, MilestoneSubmitSchema, MilestoneVerifySchema } from '../shared/validate.js';

export async function listMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const pagination = getPagination(req.query);
    const data = await service.listMilestones(pagination);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getMilestoneById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getMilestoneById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const created = await service.createMilestone(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function submitMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = MilestoneSubmitSchema.parse(req.body);
    const updated = await service.submitMilestone(req.params.id, parsed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function verifyMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = MilestoneVerifySchema.parse(req.body);
    const updated = await service.verifyMilestone(req.params.id, parsed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
