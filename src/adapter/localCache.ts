/**
 * Cache adapter which simply stores the ache in a local cache directory
 */
import {existsSync, readFileSync, mkdirSync, writeFileSync} from 'fs';
import path from 'path';
import {CHAIN_ID_CLIENT_MAP, getProposalMetadata} from '@bgd-labs/js-utils';
import {IGovernanceCore_ABI, IPayloadsControllerCore_ABI} from '@bgd-labs/aave-address-book';
import {getContract} from 'viem';
import packageJson from '../../package.json';
import type {GovernanceCacheAdapter, PayloadCacheRaw, ProposalCacheRaw} from '../types';
import {formatProposalLogs, syncGovernanceEvents} from '../common/governance';
import {formatPayloadLogs, syncPayloadsControllerEvents} from '../common/payloadsController';

function getPath() {
  const installPath = path.join(process.cwd(), 'node_modules', packageJson.name);
  const isInstalled = existsSync(installPath);
  return path.join(isInstalled ? installPath : process.cwd(), 'cache');
}

export function readJSONCache<T = any>(filePath: string, filename: string | number): T | undefined {
  const joinedPath = path.join(getPath(), filePath, `${filename}.json`);
  if (existsSync(joinedPath)) {
    return JSON.parse(readFileSync(joinedPath, 'utf8'));
  }
}

export function writeJSONCache<T extends {}>(filePath: string, filename: string | number, json: T) {
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

export type TrackingCache = {lastSeenBlock: string | bigint};

/**
 * Simple cache that:
 * 1. fetches new events
 * 2. re-fetches the proposal for ever proposalId encountered in the events
 */
const syncProposalCache: GovernanceCacheAdapter['syncProposalCache'] = async ({
  chainId,
  governance,
}) => {
  const client = CHAIN_ID_CLIENT_MAP[chainId];
  const contract = getContract({
    abi: IGovernanceCore_ABI,
    address: governance,
    client,
  });
  const proposalsPath = `${chainId.toString()}/${governance}/proposals`;
  const cachedBlock = readJSONCache<TrackingCache>(proposalsPath, 'lastSeenBlock') || {
    lastSeenBlock: 0,
  };
  const newData = await syncGovernanceEvents({
    client,
    governance,
    lastSeenBlock: BigInt(cachedBlock.lastSeenBlock),
  });
  // store events
  const uniqueProposals = new Set<bigint>();
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
    cache.proposal = await contract.read.getProposal([proposalId]);
    cache.ipfs = await getProposalMetadata(cache.proposal.ipfsHash);
    writeJSONCache(proposalsPath, proposalId.toString(), cache);
  }
  // store lastSeenBlock
  writeJSONCache(proposalsPath, 'lastSeenBlock', {
    lastSeenBlock: newData.lastSeenBlock,
  });
  return newData;
};
/**
 * Sync payloads cache
 * 1. fetch new events
 * 2. fetch all payloads encountered in the events
 */
const syncPayloadsCache: GovernanceCacheAdapter['syncPayloadsCache'] = async ({
  chainId,
  payloadsController,
}) => {
  const client = CHAIN_ID_CLIENT_MAP[chainId];
  const contract = getContract({
    abi: IPayloadsControllerCore_ABI,
    client,
    address: payloadsController,
  });
  const path = `${chainId.toString()}/${payloadsController}/payloads`;
  const cachedBlock = readJSONCache<TrackingCache>(path, 'lastSeenBlock') || {
    lastSeenBlock: '0',
  };
  const newData = await syncPayloadsControllerEvents({
    client,
    payloadsController,
    lastSeenBlock: BigInt(cachedBlock.lastSeenBlock),
  });
  // store events
  const uniquePayloads = new Set<number>();
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
    cache.payload = await contract.read.getPayloadById([payloadId]);
    writeJSONCache(path, payloadId, cache);
  }
  // store lastSeenBlock
  writeJSONCache(path, 'lastSeenBlock', {
    lastSeenBlock: newData.lastSeenBlock,
  });
  return newData;
};

export const localCacheAdapter: GovernanceCacheAdapter = {
  async getPayload({chainId, payloadsController, payloadId}) {
    const path = `${chainId.toString()}/${payloadsController}/payloads`;
    let cache = readJSONCache<PayloadCacheRaw>(path, payloadId);
    if (!cache) {
      await syncPayloadsCache({chainId, payloadsController});
      cache = readJSONCache<PayloadCacheRaw>(path, payloadId);
      if (!cache)
        throw new Error(`Payload ${payloadId} not found on ${chainId}:${payloadsController}`);
    }
    return {payload: cache.payload!, logs: formatPayloadLogs(cache.events)};
  },
  async getProposal({chainId, governance, proposalId}) {
    const path = `${chainId.toString()}/${governance}/proposals`;
    let cache = readJSONCache<ProposalCacheRaw>(path, proposalId);
    if (!cache) {
      await syncProposalCache({chainId, governance});
      cache = readJSONCache<ProposalCacheRaw>(path, proposalId);
      if (!cache) throw new Error(`Payload ${proposalId} not found on ${chainId}:${governance}`);
    }
    return {proposal: cache.proposal!, logs: formatProposalLogs(cache.events), ipfs: cache.ipfs!};
  },
  syncPayloadsCache,
  syncProposalCache,
};
