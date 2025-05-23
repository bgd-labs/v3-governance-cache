/**
 * No-Cache adapter which simply fetches data on-chain
 * This adapter will not return any logs
 */
import {getProposalMetadata} from '@bgd-labs/js-utils';
import {getClient} from '@bgd-labs/toolbox';
import type {GovernanceCacheAdapter} from '..';
import {getPayload} from '../common/payloadsController';
import {getProposal} from '../common/governance';

export const rpcProvider: GovernanceCacheAdapter = {
  async getPayload({chainId, payloadsController, payloadId}) {
    const client = getClient(chainId, {providerConfig: {alchemyKey: process.env.ALCHEMY_API_KEY}});
    return {payload: await getPayload({client, payloadsController, payloadId}), logs: {} as any};
  },
  async getProposal({chainId, governance, proposalId}) {
    const client = getClient(chainId, {providerConfig: {alchemyKey: process.env.ALCHEMY_API_KEY}});

    const proposal = await getProposal({client, proposalId, governance});
    return {
      proposal,
      logs: {} as any,
      ipfs: await getProposalMetadata(proposal.ipfsHash, 'https://ipfs.io/ipfs'),
    };
  },
};
