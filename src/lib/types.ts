export type UserRole = 'donor' | 'applicant' | 'verifier';

export type GrantStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
export type MilestoneStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export interface Grant {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  deadline: string;
  status: GrantStatus;
  donorId: string;
  donorName: string;
  eligibility: string[];
  requirements: string[];
  milestones: number;
  applicantsCount: number;
  fundsDistributed: number;
  createdAt: string;
}

export interface Proposal {
  id: string;
  grantId: string;
  grantTitle: string;
  applicantId: string;
  applicantName: string;
  title: string;
  description: string;
  requestedAmount: number;
  status: ProposalStatus;
  milestones: Milestone[];
  submittedAt: string;
  verifierId?: string;
}

export interface Milestone {
  id: string;
  proposalId: string;
  title: string;
  description: string;
  amount: number;
  status: MilestoneStatus;
  dueDate: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifierNotes?: string;
  evidence?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  bio?: string;
  avatar?: string;
}
