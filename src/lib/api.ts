// Simple API client with mappers to match frontend types
import { Grant, Proposal, Milestone } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function mapGrant(api: any): Grant {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    amount: Number(api.amount),
    category: api.category,
    deadline: typeof api.deadline === 'string' ? api.deadline : new Date(api.deadline).toISOString().slice(0, 10),
    status: api.status,
    donorId: api.donorId,
    donorName: api.donorName,
    eligibility: api.eligibility || [],
    requirements: api.requirements || [],
    milestones: api.milestonesCount ?? api.milestones ?? 0,
    applicantsCount: api.applicantsCount ?? 0,
    fundsDistributed: api.fundsDistributed ?? 0,
    createdAt: api.createdAt ? new Date(api.createdAt).toISOString() : new Date().toISOString(),
  } as Grant;
}

function mapMilestone(api: any): Milestone {
  return {
    id: api.id,
    proposalId: api.proposalId,
    title: api.title,
    description: api.description,
    amount: Number(api.amount),
    status: api.status,
    dueDate: typeof api.dueDate === 'string' ? api.dueDate : new Date(api.dueDate).toISOString().slice(0, 10),
    submittedAt: api.submittedAt ? new Date(api.submittedAt).toISOString() : undefined,
    verifiedAt: api.verifiedAt ? new Date(api.verifiedAt).toISOString() : undefined,
    verifierNotes: api.verifierNotes,
    evidence: api.evidence,
  } as Milestone;
}

function mapProposal(api: any): Proposal {
  return {
    id: api.id,
    grantId: api.grantId,
    grantTitle: api.grant?.title || api.grantTitle || '',
    applicantId: api.applicantId,
    applicantName: api.applicantName,
    title: api.title,
    description: api.description,
    requestedAmount: Number(api.requestedAmount),
    status: api.status,
    milestones: Array.isArray(api.milestones) ? api.milestones.map(mapMilestone) : [],
    submittedAt: api.submittedAt ? new Date(api.submittedAt).toISOString() : new Date().toISOString(),
    verifierId: api.verifierId || undefined,
  } as Proposal;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  async getGrants(): Promise<Grant[]> {
    const data = await http<any[]>('/api/grants');
    return data.map(mapGrant);
  },
  async getMe(): Promise<any> {
    return http<any>('/api/auth/me');
  },
  async getGrant(id: string): Promise<Grant> {
    const data = await http<any>(`/api/grants/${id}`);
    return mapGrant(data);
  },
  async createGrant(input: Partial<Grant>): Promise<Grant> {
    const payload = {
      title: input.title,
      description: input.description,
      amount: input.amount,
      category: input.category,
      deadline: input.deadline,
      status: input.status || 'open',
      donorId: input.donorId,
      donorName: input.donorName,
      eligibility: input.eligibility || [],
      requirements: input.requirements || [],
      milestonesCount: input.milestones || 0,
    };
    const data = await http<any>('/api/grants', { method: 'POST', body: JSON.stringify(payload) });
    return mapGrant(data);
  },
  async getProposals(): Promise<Proposal[]> {
    const data = await http<any[]>('/api/proposals');
    return data.map(mapProposal);
  },
  async getProposal(id: string): Promise<Proposal> {
    const data = await http<any>(`/api/proposals/${id}`);
    return mapProposal(data);
  },
  async createProposal(input: Partial<Proposal>): Promise<Proposal> {
    const payload = {
      grantId: input.grantId,
      applicantId: input.applicantId,
      applicantName: input.applicantName,
      title: input.title,
      description: input.description,
      requestedAmount: input.requestedAmount,
      status: input.status || 'pending',
    };
    const data = await http<any>('/api/proposals', { method: 'POST', body: JSON.stringify(payload) });
    return mapProposal(data);
  },
  async updateProposalStatus(id: string, status: 'approved' | 'rejected' | 'in_progress' | 'completed') {
    const path = status === 'approved' || status === 'in_progress' ? `/api/proposals/${id}/approve` : `/api/proposals/${id}/reject`;
    const data = await http<any>(path, { method: 'POST' });
    return mapProposal(data);
  },
  async submitMilestone(id: string, payload: Partial<Milestone>): Promise<Milestone> {
    const data = await http<any>(`/api/milestones/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) });
    return mapMilestone(data);
  },
  async verifyMilestone(id: string, payload: Partial<Milestone>): Promise<Milestone> {
    const data = await http<any>(`/api/milestones/${id}/verify`, { method: 'POST', body: JSON.stringify(payload) });
    return mapMilestone(data);
  },
};
