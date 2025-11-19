import { prisma } from '../shared/prisma.js';
import type { Pagination } from '../shared/validate.js';

export async function listProposals(p?: Pagination) {
  return prisma.proposal.findMany({ include: { milestones: true }, orderBy: { submittedAt: 'desc' }, skip: p?.skip, take: p?.take });
}

export async function getProposalById(id: string) {
  return prisma.proposal.findUnique({ where: { id }, include: { milestones: true } });
}

export async function createProposal(data: any) {
  return prisma.proposal.create({ data });
}

export async function updateProposalStatus(id: string, status: string) {
  return prisma.proposal.update({ where: { id }, data: { status } });
}
