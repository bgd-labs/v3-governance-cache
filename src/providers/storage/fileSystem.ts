import {existsSync, readFileSync, mkdirSync, writeFileSync} from 'fs';
import path from 'path';
import packageJson from '../../../package.json';
import {
  isPayloadFinal,
  isProposalFinal,
  type GovernanceCacheAdapterWithSync,
  type PayloadCacheRaw,
  type ProposalCacheRaw,
} from '../..';
import {ISSUES_FETCHING_PAYLOAD, ISSUES_FETCHING_PROPOSAL} from '../../errors';
import {
  formatPayloadLogs,
  getPayload,
  syncPayloadsControllerEvents,
} from '../../common/payloadsController';
import {formatProposalLogs, syncGovernanceEvents, getProposal} from '../../common/governance';
import {CHAIN_ID_CLIENT_MAP, getProposalMetadata} from '@bgd-labs/js-utils';

function getPath() {
  const installPath = path.join(process.cwd(), 'node_modules', packageJson.name);
  const isInstalled = existsSync(installPath);
  return path.join(isInstalled ? installPath : process.cwd(), 'cache');
}

export function readJSONCache<T = any>(
  filePath: string,
  filename: string | number | bigint,
): T | undefined {
  const joinedPath = path.join(getPath(), filePath, `${filename}.json`);
  if (existsSync(joinedPath)) {
    return JSON.parse(readFileSync(joinedPath, 'utf8'));
  }
}

export function writeJSONCache<T extends {}>(
  filePath: string,
  filename: string | number | bigint,
  json: T,
) {
  const joinedFolderPath = path.join(getPath(), filePath);
  if (!existsSync(joinedFolderPath)) {
    mkdirSync(joinedFolderPath, {recursive: true});
  }
  const joinedFilePath = path.join(joinedFolderPath, `${filename}.json`);
  writeFileSync(
    joinedFilePath,
    JSON.stringify(
      json,
      (key, value) =>
        typeof value === 'bigint' ? value.toString() : value === undefined ? null : value,
      2,
    ),
  );
}

export type TrackingCache = {lastSeenBlock: string | bigint; isFinal: Record<string, boolean>};

/**
 * Simple cache that:
 * 1. fetches new events
 * 2. re-fetches the proposal for ever proposalId encountered in the events
 */
const syncProposalCache: GovernanceCacheAdapterWithSync['syncProposalCache'] = async ({
  chainId,
  governance,
}) => {
  const client = CHAIN_ID_CLIENT_MAP[chainId];
  const proposalsPath = `${chainId.toString()}/${governance}/proposals`;
  const trackingCache: TrackingCache = readJSONCache<TrackingCache>(
    proposalsPath,
    'trackingCache',
  ) || {
    lastSeenBlock: 0n,
    isFinal: {},
  };
  const newData = await syncGovernanceEvents({
    client,
    governance,
    lastSeenBlock: BigInt(trackingCache.lastSeenBlock),
  });
  trackingCache.lastSeenBlock = newData.lastSeenBlock;
  // store events
  const uniqueProposals = new Set<bigint>(
    Object.keys(trackingCache.isFinal)
      .filter((id) => !trackingCache.isFinal[id])
      .map((id) => BigInt(id)) || [],
  );
  for (const event of newData.events) {
    const proposalId = event.args.proposalId!;
    uniqueProposals.add(proposalId);
    const cache: ProposalCacheRaw = readJSONCache<ProposalCacheRaw>(
      proposalsPath,
      proposalId.toString(),
    ) || {events: []};
    cache.events.push(event);
    writeJSONCache(proposalsPath, proposalId.toString(), cache);
  }
  // update proposalCache
  for (const proposalId of uniqueProposals) {
    const cache: ProposalCacheRaw = readJSONCache<ProposalCacheRaw>(
      proposalsPath,
      proposalId.toString(),
    ) || {events: []};
    cache.proposal = await getProposal({client, governance, proposalId});

    if (!cache.ipfs) {
      try {
        cache.ipfs = await getProposalMetadata(cache.proposal.ipfsHash);
      } catch (e) {
        console.log(e);
      }
    }
    trackingCache.isFinal[String(proposalId)] = isProposalFinal(cache.proposal.state);
    writeJSONCache(proposalsPath, proposalId.toString(), cache);
  }
  // store lastSeenBlock
  writeJSONCache(proposalsPath, 'trackingCache', trackingCache);
  return newData;
};
/**
 * Sync payloads cache
 * 1. fetch new events
 * 2. fetch all payloads encountered in the events
 */
const syncPayloadsCache: GovernanceCacheAdapterWithSync['syncPayloadsCache'] = async ({
  chainId,
  payloadsController,
}) => {
  const client = CHAIN_ID_CLIENT_MAP[chainId];
  const path = `${chainId.toString()}/${payloadsController}/payloads`;
  const trackingCache: TrackingCache = readJSONCache<TrackingCache>(path, 'trackingCache') || {
    lastSeenBlock: 0n,
    isFinal: {},
  };
  const newData = await syncPayloadsControllerEvents({
    client,
    payloadsController,
    lastSeenBlock: BigInt(trackingCache.lastSeenBlock),
  });
  trackingCache.lastSeenBlock = newData.lastSeenBlock;
  // store events
  const uniquePayloads = new Set<number>(
    Object.keys(trackingCache.isFinal)
      .filter((id) => !trackingCache.isFinal[id])
      .map((id) => Number(id)) || [],
  );
  for (const event of newData.events) {
    const payloadId = event.args.payloadId!;
    uniquePayloads.add(payloadId);
    const cache = readJSONCache<PayloadCacheRaw>(path, payloadId) || {
      events: [],
    };
    cache.events.push(event);
    writeJSONCache(path, payloadId, cache);
  }
  // update payload cache
  for (const payloadId of uniquePayloads) {
    const cache: PayloadCacheRaw = readJSONCache<PayloadCacheRaw>(path, payloadId) || {
      events: [],
    };
    cache.payload = await getPayload({client, payloadsController, payloadId});
    writeJSONCache(path, payloadId, cache);
    trackingCache.isFinal[String(payloadId)] = isPayloadFinal(cache.payload.state);
  }
  // store lastSeenBlock
  writeJSONCache(path, 'trackingCache', trackingCache);
  return newData;
};

export const fileSystemStorageAdapter: GovernanceCacheAdapterWithSync = {
  async getPayload({chainId, payloadsController, payloadId}) {
    const path = `${chainId.toString()}/${payloadsController}/payloads`;
    const cache = readJSONCache<PayloadCacheRaw>(path, payloadId);
    if (!cache) throw new Error(ISSUES_FETCHING_PAYLOAD);
    return {payload: cache.payload!, logs: formatPayloadLogs(cache.events)};
  },
  async getProposal({chainId, governance, proposalId}) {
    const path = `${chainId.toString()}/${governance}/proposals`;
    const cache = readJSONCache<ProposalCacheRaw>(path, proposalId);
    if (!cache) throw new Error(ISSUES_FETCHING_PROPOSAL);
    return {proposal: cache.proposal!, logs: formatProposalLogs(cache.events), ipfs: cache.ipfs!};
  },
  syncPayloadsCache,
  syncProposalCache,
};
