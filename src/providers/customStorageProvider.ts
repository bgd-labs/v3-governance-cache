import {type GovernanceCacheAdapterWithSync} from '..';
import {ISSUES_FETCHING_PAYLOAD, ISSUES_FETCHING_PROPOSAL} from '../errors';

export const customStorageProvider = (
  adapter: GovernanceCacheAdapterWithSync,
): GovernanceCacheAdapterWithSync => ({
  async getPayload(args) {
    let cache = await adapter.getPayload(args);
    if (!cache) {
      await adapter.syncPayloadsCache(args);
      cache = await adapter.getPayload(args);
      if (!cache) throw new Error(ISSUES_FETCHING_PAYLOAD);
    }
    return cache;
  },
  async getProposal(args) {
    let cache = await adapter.getProposal(args);
    if (!cache) {
      await adapter.syncProposalCache(args);
      cache = await adapter.getProposal(args);
      if (!cache) throw new Error(ISSUES_FETCHING_PROPOSAL);
    }
    return cache;
  },
  syncPayloadsCache(args) {
    return adapter.syncPayloadsCache(args);
  },
  syncProposalCache(args) {
    return adapter.syncProposalCache(args);
  },
});
