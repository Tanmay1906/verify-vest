import { Request, Response } from 'express';
import * as service from '../services/users.service.js';
import type { NextFunction } from 'express';
import { UserCreateSchema, getPagination } from '../shared/validate.js';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const pagination = getPagination(req.query);
    const data = await service.listUsers(pagination);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getUserById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = UserCreateSchema.parse(req.body);
    const created = await service.createUser(parsed);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}
