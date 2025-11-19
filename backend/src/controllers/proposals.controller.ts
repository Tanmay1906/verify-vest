import { Request, Response } from 'express';
import * as service from '../services/proposals.service.js';
import type { NextFunction } from 'express';
import { ProposalCreateSchema, getPagination } from '../shared/validate.js';

export async function listProposals(req: Request, res: Response, next: NextFunction) {
  try {
    const pagination = getPagination(req.query);
    const data = await service.listProposals(pagination);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getProposalById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getProposalById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ProposalCreateSchema.parse(req.body);
    const created = await service.createProposal(parsed);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function approveProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await service.updateProposalStatus(req.params.id, 'approved');
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function rejectProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await service.updateProposalStatus(req.params.id, 'rejected');
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
