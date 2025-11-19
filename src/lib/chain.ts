import { submitEntryFunction } from './wallet';

const MODULE_ADDRESS = import.meta.env.VITE_MODULE_ADDRESS as string; // e.g., 0x<published_address>
const MODULE = `${MODULE_ADDRESS}::verity_vest`;

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function strToHex(str: string): string {
  const enc = new TextEncoder();
  return bytesToHex(enc.encode(str));
}

function generateIdHex(lengthBytes = 16): string {
  const bytes = new Uint8Array(lengthBytes);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export const chain = {
  async createGrant(params: { grantId?: string; title: string; amount: number; milestones: number; metadataUri?: string }) {
    const grantId = params.grantId ?? generateIdHex();
    const payload = {
      function: `${MODULE}::create_grant`,
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: [
        grantId,
        strToHex(params.title),
        BigInt(params.amount),
        BigInt(params.milestones),
        strToHex(params.metadataUri || ''),
      ],
    };
    return submitEntryFunction(payload);
  },

  async applyProposal(params: { proposalId?: string; grantId: string; requestedAmount: number; metadataUri?: string }) {
    const proposalId = params.proposalId ?? generateIdHex();
    const payload = {
      function: `${MODULE}::apply_proposal`,
      arguments: [
        proposalId,
        strToHex(params.grantId),
        BigInt(params.requestedAmount),
        strToHex(params.metadataUri || ''),
      ],
    };
    return submitEntryFunction(payload);
  },

  async submitMilestone(params: { proposalId: string; milestoneIndex: number; evidenceUriOrHash: string }) {
    const payload = {
      function: `${MODULE}::submit_milestone`,
      type_arguments: [],
      arguments: [strToHex(params.proposalId), BigInt(params.milestoneIndex), strToHex(params.evidenceUriOrHash)],
    };
    return submitEntryFunction(payload);
  },

  async verifyMilestone(params: { proposalId: string; milestoneIndex: number; approved: boolean; notes?: string }) {
    const payload = {
      function: `${MODULE}::verify_milestone`,
      type_arguments: [],
      arguments: [strToHex(params.proposalId), BigInt(params.milestoneIndex), params.approved, strToHex(params.notes || '')],
    };
    return submitEntryFunction(payload);
  },

  async disburseFunds(params: { to: string; amount: number }) {
    const payload = {
      function: `${MODULE}::disburse_funds`,
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: [params.to, BigInt(params.amount)],
    };
    return submitEntryFunction(payload);
  },
};
