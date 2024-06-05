/**
 * Hybrid adapter that tries to fetch via github pages
 * If github pages doesn't contain the desired data it will fallback to the supplied adapter
 */
import type {GovernanceCacheAdapter, PayloadCacheRaw, ProposalCacheRaw} from '..';
import {formatPayloadLogs} from '../common/payloadsController';
import {formatProposalLogs} from '../common/governance';

function getPath() {
  return 'https://bgd-labs.github.io/v3-governance-cache/cache/';
}

export const githubPagesProvider: GovernanceCacheAdapter = {
  async getPayload({chainId, payloadsController, payloadId}) {
    const path = `${chainId.toString()}/${payloadsController}/payloads/${payloadId}.json`;
    const cache = (await (await fetch(getPath() + path)).json()) as PayloadCacheRaw;
    return {payload: cache.payload!, logs: formatPayloadLogs(cache.events)};
  },
  async getProposal({chainId, governance, proposalId}) {
    const path = `${chainId.toString()}/${governance}/proposals/${proposalId}.json`;
    console.log(path);
    const cache = (await (await fetch(getPath() + path)).json()) as ProposalCacheRaw;
    return {proposal: cache.proposal!, logs: formatProposalLogs(cache.events), ipfs: cache.ipfs!};
  },
};
