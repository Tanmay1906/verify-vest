import { Request, Response } from 'express';
import * as service from '../services/grants.service.js';
import type { NextFunction } from 'express';
import { GrantCreateSchema, GrantStatusUpdateSchema, getPagination } from '../shared/validate.js';

export async function listGrants(req: Request, res: Response, next: NextFunction) {
  try {
    const pagination = getPagination(req.query);
    const data = await service.listGrants(pagination);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getGrantById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getGrantById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createGrant(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = GrantCreateSchema.parse(req.body);
    const created = await service.createGrant(parsed);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateGrantStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = GrantStatusUpdateSchema.parse(req.body);
    const updated = await service.updateGrantStatus(req.params.id, status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
