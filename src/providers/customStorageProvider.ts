import {type GovernanceCacheAdapterWithSync} from '..';

export const customStorageProvider = (
  adapter: GovernanceCacheAdapterWithSync,
): GovernanceCacheAdapterWithSync => ({
  async getPayload(args) {
    try {
      const cache = await adapter.getPayload(args);
      return cache;
    } catch (e) {
      await adapter.syncPayloadsCache(args);
      return await adapter.getPayload(args);
    }
  },
  async getProposal(args) {
    try {
      const cache = await adapter.getProposal(args);
      return cache;
    } catch (e) {
      await adapter.syncProposalCache(args);
      return await adapter.getProposal(args);
    }
  },
  syncPayloadsCache(args) {
    return adapter.syncPayloadsCache(args);
  },
  syncProposalCache(args) {
    return adapter.syncProposalCache(args);
  },
});
