/**
 * No-Cache adapter which simply fetches data on-chain
 * This adapter will not return any logs
 */
import {CHAIN_ID_CLIENT_MAP, getProposalMetadata} from '@bgd-labs/js-utils';
import type {GovernanceCacheAdapter} from '..';
import {getPayload} from '../common/payloadsController';
import {getProposal} from '../common/governance';

export const rpcProvider: GovernanceCacheAdapter = {
  async getPayload({chainId, payloadsController, payloadId}) {
    const client = CHAIN_ID_CLIENT_MAP[chainId];
    return {payload: await getPayload({client, payloadsController, payloadId}), logs: {} as any};
  },
  async getProposal({chainId, governance, proposalId}) {
    const client = CHAIN_ID_CLIENT_MAP[chainId];

    const proposal = await getProposal({client, proposalId, governance});
    return {proposal, logs: {} as any, ipfs: await getProposalMetadata(proposal.ipfsHash)};
  },
};
