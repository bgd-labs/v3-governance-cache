import {type Client, type Address, getContract, getAbiItem} from 'viem';
import {getBlockNumber, getBlock} from 'viem/actions';
import {getBlockAtTimestamp, strategicGetLogs} from '@bgd-labs/js-utils';
import {IPayloadsControllerCore_ABI} from '@bgd-labs/aave-address-book/abis';
import type {
  PayloadCreatedEvent,
  PayloadEvent,
  PayloadExecutedEvent,
  PayloadLogs,
  PayloadQueuedEvent,
} from '..';

export async function getPayloadsControllerEvents({
  payloadsController,
  client,
  fromBlockNumber,
  toBlockNumber,
}: {
  payloadsController: Address;
  client: Client;
  fromBlockNumber: bigint;
  toBlockNumber: bigint;
}) {
  const logs = await strategicGetLogs({
    client,
    events: [
      getAbiItem({abi: IPayloadsControllerCore_ABI, name: 'PayloadCreated'}),
      getAbiItem({abi: IPayloadsControllerCore_ABI, name: 'PayloadQueued'}),
      getAbiItem({abi: IPayloadsControllerCore_ABI, name: 'PayloadExecuted'}),
    ],
    address: payloadsController,
    fromBlock: fromBlockNumber,
    toBlock: toBlockNumber,
  });
  return await Promise.all(
    logs.map(async (l) => ({
      ...l,
      timestamp: Number((await getBlock(client, {blockNumber: l.blockNumber as bigint})).timestamp),
    })),
  );
}

export async function syncPayloadsControllerEvents({
  client,
  payloadsController,
  lastSeenBlock = 0n,
}: {
  client: Client;
  payloadsController: Address;
  lastSeenBlock: bigint;
}): Promise<{lastSeenBlock: bigint; events: PayloadEvent[]}> {
  const currentBlock = await getBlockNumber(client);
  const contract = getContract({
    abi: IPayloadsControllerCore_ABI,
    client,
    address: payloadsController,
  });
  const payloadsCount = await contract.read.getPayloadsCount();
  if (payloadsCount === 0) {
    return {lastSeenBlock: currentBlock, events: []};
  }
  if (lastSeenBlock === 0n) {
    const firstPayload = await contract.read.getPayloadById([0]);
    const firstRelevantBlock = await getBlockAtTimestamp({
      client: client,
      timestamp: BigInt(firstPayload.createdAt),
      fromBlock: BigInt(0),
      toBlock: currentBlock,
      maxDelta: BigInt(60 * 60 * 12), // 12h
    });
    lastSeenBlock = firstRelevantBlock.number;
  }
  return {
    lastSeenBlock: currentBlock,
    events: await getPayloadsControllerEvents({
      client,
      payloadsController,
      fromBlockNumber: lastSeenBlock,
      toBlockNumber: currentBlock,
    }),
  };
}

export function formatPayloadLogs(logs: PayloadEvent[]): PayloadLogs {
  return {
    createdLog: logs.find((log) => log.eventName === 'PayloadCreated') as PayloadCreatedEvent,
    queuedLog: logs.find((log) => log.eventName === 'PayloadQueued') as PayloadQueuedEvent,
    executedLog: logs.find((log) => log.eventName === 'PayloadExecuted') as PayloadExecutedEvent,
  };
}

export function getPayload({
  client,
  payloadsController,
  payloadId,
}: {
  payloadsController: Address;
  client: Client;
  payloadId: number;
}) {
  const contract = getContract({
    abi: IPayloadsControllerCore_ABI,
    client,
    address: payloadsController,
  });
  return contract.read.getPayloadById([payloadId]);
}
