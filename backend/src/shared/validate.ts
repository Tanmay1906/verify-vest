import { z } from 'zod';

export const PaginationQuery = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
});

export const GrantCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().int().nonnegative(),
  category: z.string().min(1),
  deadline: z.union([z.string(), z.date()]),
  status: z.string().optional(),
  donorId: z.string().min(1),
  donorName: z.string().min(1),
  eligibility: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  milestonesCount: z.number().int().nonnegative().optional(),
});

export const GrantAllowedStatuses = ['open', 'in_progress', 'paused', 'closed'] as const;
export const GrantStatusUpdateSchema = z.object({
  status: z.enum(GrantAllowedStatuses),
});

export const ProposalCreateSchema = z.object({
  grantId: z.string().min(1),
  applicantId: z.string().min(1),
  applicantName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  requestedAmount: z.number().int().nonnegative(),
  status: z.string().optional(),
});

export const MilestoneSubmitSchema = z.object({
  evidence: z.string().min(1),
});

export const MilestoneVerifySchema = z.object({
  verifierNotes: z.string().min(1),
});

export const UserCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  walletAddress: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export type Pagination = { skip: number; take: number };
export function getPagination(query: any): Pagination {
  const parsed = PaginationQuery.safeParse(query);
  const page = parsed.success ? parsed.data.page : 1;
  const pageSize = parsed.success ? parsed.data.pageSize : 20;
  const take = Math.min(Math.max(pageSize, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  return { skip, take };
}
