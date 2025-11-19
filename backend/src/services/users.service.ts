import { prisma } from '../shared/prisma.js';
import type { Pagination } from '../shared/validate.js';

export async function listUsers(p?: Pagination) {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' }, skip: p?.skip, take: p?.take });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: any) {
  return prisma.user.create({ data });
}
