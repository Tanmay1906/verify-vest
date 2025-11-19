import { prisma } from '../shared/prisma.js';
import type { Pagination } from '../shared/validate.js';

export async function listMilestones(p?: Pagination) {
  return prisma.milestone.findMany({ orderBy: { dueDate: 'asc' }, skip: p?.skip, take: p?.take });
}

export async function getMilestoneById(id: string) {
  return prisma.milestone.findUnique({ where: { id } });
}

export async function createMilestone(data: any) {
  return prisma.milestone.create({ data });
}

export async function submitMilestone(id: string, data: any) {
  return prisma.milestone.update({ where: { id }, data: { status: 'submitted', submittedAt: new Date(), ...data } });
}

export async function verifyMilestone(id: string, data: any) {
  return prisma.milestone.update({ where: { id }, data: { status: 'verified', verifiedAt: new Date(), ...data } });
}
