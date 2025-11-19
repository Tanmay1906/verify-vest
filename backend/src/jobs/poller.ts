import { AptosClient } from 'aptos';
import { logger } from '../shared/logger.js';

const NODE_URL = process.env.APTOS_NODE_URL || 'https://fullnode.mainnet.aptoslabs.com/v1';
const MODULE_ADDRESS = process.env.MODULE_ADDRESS;

export async function startPoller() {
  if (!MODULE_ADDRESS) {
    logger.warn('MODULE_ADDRESS not set, poller disabled');
    return;
  }
  const client = new AptosClient(NODE_URL);
  const account = MODULE_ADDRESS;

  async function pollOnce() {
    try {
      const grantEvents = await client.getEventsByEventHandle(account, `${account}::verity_vest::VerityVestStore`, 'grant_created_event');
      const proposalEvents = await client.getEventsByEventHandle(account, `${account}::verity_vest::VerityVestStore`, 'proposal_created_event');
      logger.info({ grantEvents: grantEvents.length, proposalEvents: proposalEvents.length }, 'polled events');
    } catch (e) {
      logger.error({ err: e }, 'poller error');
    }
  }

  await pollOnce();
  setInterval(pollOnce, 30000);
}
