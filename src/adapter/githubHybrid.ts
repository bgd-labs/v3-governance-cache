/**
 * Hybrid adapter that tries to fetch via github pages
 * If github pages doesn't contain the desired data it will fallback to the supplied adapter
 */
import type {GovernanceCacheAdapter, PayloadCacheRaw, ProposalCacheRaw} from '..';
import {formatPayloadLogs} from '../common/payloadsController';
import {formatProposalLogs} from '../common/governance';

function getPath() {
  return 'https://bgd-labs.github.io/v3-governance-cache/';
}

export const githubHybridCacheAdapter = (
  fallbackAdapter: GovernanceCacheAdapter,
): GovernanceCacheAdapter => ({
  async getPayload({chainId, payloadsController, payloadId}) {
    const path = `${chainId.toString()}/${payloadsController}/payloads`;
    try {
      const cache = (await (await fetch(getPath() + path)).json()) as PayloadCacheRaw;
      return {payload: cache.payload!, logs: formatPayloadLogs(cache.events)};
    } catch (e) {
      await fallbackAdapter.syncPayloadsCache({chainId, payloadsController});
      return fallbackAdapter.getPayload({chainId, payloadsController, payloadId});
    }
  },
  async getProposal({chainId, governance, proposalId}) {
    const path = `${chainId.toString()}/${governance}/proposals`;
    try {
      const cache = (await (await fetch(getPath() + path)).json()) as ProposalCacheRaw;
      return {proposal: cache.proposal!, logs: formatProposalLogs(cache.events), ipfs: cache.ipfs!};
    } catch (e) {
      await fallbackAdapter.syncProposalCache({chainId, governance});
      return fallbackAdapter.getProposal({chainId, governance, proposalId});
    }
  },
  async syncProposalCache({chainId, governance}) {
    return fallbackAdapter.syncProposalCache({chainId, governance});
  },
  async syncPayloadsCache({chainId, payloadsController}) {
    return fallbackAdapter.syncPayloadsCache({chainId, payloadsController});
  },
});
