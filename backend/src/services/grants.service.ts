import { prisma } from '../shared/prisma.js';
import type { Pagination } from '../shared/validate.js';

export async function listGrants(p?: Pagination) {
  return prisma.grant.findMany({ orderBy: { createdAt: 'desc' }, skip: p?.skip, take: p?.take });
}

export async function getGrantById(id: string) {
  return prisma.grant.findUnique({ where: { id } });
}

export async function createGrant(data: any) {
  return prisma.grant.create({ data });
}

export async function updateGrantStatus(id: string, status: string) {
  return prisma.grant.update({ where: { id }, data: { status } });
}
