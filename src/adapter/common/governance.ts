import { type Client, type Address, getContract, getAbiItem } from "viem";
import { getBlockNumber, getBlock } from "viem/actions";
import { getBlockAtTimestamp, strategicGetLogs } from "@bgd-labs/js-utils";
import { IGovernanceCore_ABI } from "@bgd-labs/aave-address-book";
import type { ExtractAbiEvent } from "abitype";
import type { LogWithTimestamp } from "../../types";

export type ProposalCreatedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, "ProposalCreated">
>;
export type ProposalQueuedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, "ProposalQueued">
>;
export type ProposalCanceledEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, "ProposalCanceled">
>;
export type ProposalExecutedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, "ProposalExecuted">
>;
export type ProposalPayloadSentEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, "PayloadSent">
>;
export type ProposalVotingActivatedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, "VotingActivated">
>;
export type ProposalEvent =
  | ProposalCreatedEvent
  | ProposalQueuedEvent
  | ProposalCanceledEvent
  | ProposalExecutedEvent
  | ProposalPayloadSentEvent
  | ProposalVotingActivatedEvent;

async function getGovernanceEvents({
  governance,
  client,
  fromBlockNumber,
  toBlockNumber,
}: {
  governance: Address;
  client: Client;
  fromBlockNumber: bigint;
  toBlockNumber: bigint;
}) {
  const logs = await strategicGetLogs({
    client,
    events: [
      getAbiItem({ abi: IGovernanceCore_ABI, name: "ProposalCreated" }),
      getAbiItem({ abi: IGovernanceCore_ABI, name: "ProposalQueued" }),
      getAbiItem({ abi: IGovernanceCore_ABI, name: "ProposalExecuted" }),
      getAbiItem({ abi: IGovernanceCore_ABI, name: "PayloadSent" }),
      getAbiItem({ abi: IGovernanceCore_ABI, name: "VotingActivated" }),
      getAbiItem({ abi: IGovernanceCore_ABI, name: "ProposalCanceled" }),
    ],
    address: governance,
    fromBlock: fromBlockNumber,
    toBlock: toBlockNumber,
  });
  return await Promise.all(
    logs.map(async (l) => ({
      ...l,
      timestamp: Number(
        (
          await getBlock(client, { blockNumber: l.blockNumber as bigint })
        ).timestamp
      ),
    }))
  );
}

export async function syncGovernanceEvents({
  client,
  governance,
  lastSeenBlock = 0n,
}: {
  client: Client;
  governance: Address;
  lastSeenBlock: bigint;
}): Promise<{ lastSeenBlock: bigint; events: ProposalEvent[] }> {
  const currentBlock = await getBlockNumber(client);
  const contract = getContract({
    abi: IGovernanceCore_ABI,
    address: governance,
    client,
  });
  const proposalsCount = await contract.read.getProposalsCount();
  if (proposalsCount === 0n) {
    return { lastSeenBlock: currentBlock, events: [] };
  }
  if (lastSeenBlock === 0n) {
    const firstProposal = await contract.read.getProposal([0n]);
    const firstRelevantBlock = await getBlockAtTimestamp({
      client: client,
      timestamp: BigInt(firstProposal.creationTime),
      fromBlock: BigInt(0),
      toBlock: currentBlock,
      maxDelta: BigInt(60 * 60 * 12), // 12h
    });
    lastSeenBlock = firstRelevantBlock.number;
  }
  return {
    lastSeenBlock: currentBlock,
    events: await getGovernanceEvents({
      governance,
      client,
      fromBlockNumber: lastSeenBlock,
      toBlockNumber: currentBlock,
    }),
  };
}
