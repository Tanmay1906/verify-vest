import 'dotenv/config';
import { Aptos, AptosConfig, Network } from 'aptos';
import { prisma } from './shared/prisma.js';

// Basic polling indexer: reads events from a module account and upserts minimal records.
// NOTE: In real prod, persist last synced cursor in DB and handle reorgs.

const MODULE_ADDRESS = process.env.MODULE_ADDRESS || process.env.VITE_MODULE_ADDRESS || '';
const NETWORK = (process.env.APTOS_NETWORK as Network) || Network.DEVNET;
const POLL_MS = Number(process.env.INDEXER_POLL_MS || 10000);

if (!MODULE_ADDRESS) {
  console.error('Missing MODULE_ADDRESS env for indexer');
  process.exit(1);
}

const config = new AptosConfig({ network: NETWORK });
const client = new Aptos(config);

// Event type strings must match the Move structs
const EVENTS = {
  GrantCreatedEvent: `${MODULE_ADDRESS}::verity_vest::GrantCreatedEvent`,
  ProposalCreatedEvent: `${MODULE_ADDRESS}::verity_vest::ProposalCreatedEvent`,
  MilestoneSubmittedEvent: `${MODULE_ADDRESS}::verity_vest::MilestoneSubmittedEvent`,
  VerificationLoggedEvent: `${MODULE_ADDRESS}::verity_vest::VerificationLoggedEvent`,
};

async function getCursor(eventType: string): Promise<number> {
  const row = await prisma.indexerCursor.findUnique({ where: { eventType } });
  return row ? Number(row.lastVersion) : 0;
}

async function setCursor(eventType: string, lastVersion: number): Promise<void> {
  await prisma.indexerCursor.upsert({
    where: { eventType },
    update: { lastVersion: BigInt(lastVersion) },
    create: { eventType, lastVersion: BigInt(lastVersion) },
  });
}

async function syncLoop() {
  console.log(`[indexer] polling ${NETWORK} for events from ${MODULE_ADDRESS}`);
  // For demo: we fetch latest 50 events of each type per poll (no cursor).
  // You should persist a cursor (e.g., event sequence number) to avoid duplicates.
  try {
    await Promise.all([
      handleGrantEvents(),
      handleProposalEvents(),
      handleMilestoneEvents(),
      handleVerificationEvents(),
    ]);
  } catch (e) {
    console.error('[indexer] error', e);
  }
  setTimeout(syncLoop, POLL_MS);
}

async function handleGrantEvents() {
  const eventType = EVENTS.GrantCreatedEvent;
  const last = await getCursor(eventType);
  const events = await client.getAccountEvents({ accountAddress: MODULE_ADDRESS, eventType, limit: 50 });
  let maxVersion = last;
  const ordered = events.sort((a: any, b: any) => Number(a.version) - Number(b.version));
  for (const ev of ordered) {
    const version = Number(ev.version);
    if (version <= last) continue;
    const d = ev.data as any;
    // Upsert grant by on-chain id (vector<u8> -> hex string provided by chain client)
    await prisma.grant.upsert({
      where: { id: d.grant_id },
      update: { title: Buffer.from(d.title.slice(2), 'hex').toString('utf8'), amount: Number(d.amount) },
      create: {
        id: d.grant_id,
        title: Buffer.from(d.title.slice(2), 'hex').toString('utf8'),
        description: 'On-chain created',
        amount: Number(d.amount),
        category: 'General',
        deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        status: 'open',
        donorId: 'onchain',
        donorName: d.donor,
        eligibility: [],
        requirements: [],
        milestones: Number(d.milestones),
        txHash: String(ev.version),
      } as any,
    });
    if (version > maxVersion) maxVersion = version;
  }
  if (maxVersion > last) await setCursor(eventType, maxVersion);
}

async function handleProposalEvents() {
  const eventType = EVENTS.ProposalCreatedEvent;
  const last = await getCursor(eventType);
  const events = await client.getAccountEvents({ accountAddress: MODULE_ADDRESS, eventType, limit: 50 });
  let maxVersion = last;
  const ordered = events.sort((a: any, b: any) => Number(a.version) - Number(b.version));
  for (const ev of ordered) {
    const version = Number(ev.version);
    if (version <= last) continue;
    const d = ev.data as any;
    await prisma.proposal.upsert({
      where: { id: d.proposal_id },
      update: { requestedAmount: Number(d.requested_amount) },
      create: {
        id: d.proposal_id,
        grantId: d.grant_id,
        applicantId: 'onchain',
        applicantName: d.applicant,
        title: 'On-chain Proposal',
        description: Buffer.from((d.metadata_uri || '0x').slice(2), 'hex').toString('utf8'),
        requestedAmount: Number(d.requested_amount),
        status: 'pending',
        submittedAt: new Date(),
        txHash: String(ev.version),
      } as any,
    });
    if (version > maxVersion) maxVersion = version;
  }
  if (maxVersion > last) await setCursor(eventType, maxVersion);
}

async function handleMilestoneEvents() {
  const eventType = EVENTS.MilestoneSubmittedEvent;
  const last = await getCursor(eventType);
  const events = await client.getAccountEvents({ accountAddress: MODULE_ADDRESS, eventType, limit: 50 });
  let maxVersion = last;
  const ordered = events.sort((a: any, b: any) => Number(a.version) - Number(b.version));
  for (const ev of ordered) {
    const version = Number(ev.version);
    if (version <= last) continue;
    const d = ev.data as any;
    // You may link milestones to proposal by id and index; simplified here
    await prisma.milestone.create({
      data: {
        proposalId: d.proposal_id,
        title: `Milestone #${Number(d.milestone_index) + 1}`,
        description: Buffer.from((d.evidence || '0x').slice(2), 'hex').toString('utf8'),
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        status: 'submitted',
      } as any,
    }).catch(() => {});
    if (version > maxVersion) maxVersion = version;
  }
  if (maxVersion > last) await setCursor(eventType, maxVersion);
}

async function handleVerificationEvents() {
  const eventType = EVENTS.VerificationLoggedEvent;
  const last = await getCursor(eventType);
  const events = await client.getAccountEvents({ accountAddress: MODULE_ADDRESS, eventType, limit: 50 });
  let maxVersion = last;
  const ordered = events.sort((a: any, b: any) => Number(a.version) - Number(b.version));
  for (const ev of ordered) {
    const version = Number(ev.version);
    if (version <= last) continue;
    const d = ev.data as any;
    await prisma.milestone.updateMany({
      where: { proposalId: d.proposal_id },
      data: { status: d.approved ? 'verified' : 'rejected' },
    });
    if (version > maxVersion) maxVersion = version;
  }
  if (maxVersion > last) await setCursor(eventType, maxVersion);
}

syncLoop();
