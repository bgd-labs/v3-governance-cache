import {
  type AbiStateMutability,
  type Address,
  type ContractFunctionReturnType,
  type GetLogsReturnType,
} from 'viem';
import type {AbiEvent} from 'abitype';
import type {PayloadLogs} from './common/payloadsController';
import type {ProposalMetadata} from '@bgd-labs/js-utils';
import type {IGovernanceCore_ABI, IPayloadsControllerCore_ABI} from '@bgd-labs/aave-address-book';
import type {ExtractAbiEvent} from 'abitype';

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type LogWithTimestamp<
  TAbiEvent extends AbiEvent | undefined = undefined,
  TAbiEvents extends
    | readonly AbiEvent[]
    | readonly unknown[]
    | undefined = TAbiEvent extends AbiEvent ? [TAbiEvent] : undefined,
> = ArrayElement<GetLogsReturnType<TAbiEvent, TAbiEvents>> & {
  timestamp: number;
};

export type ProposalCacheRaw = {
  events: ProposalEvent[];
  ipfs?: ProposalMetadata;
  proposal?: Proposal;
};

export type PayloadCacheRaw = {
  events: PayloadEvent[];
  payload?: Payload;
};

export interface GetPayloadReturnType {
  logs: PayloadLogs;
  payload: Payload;
}

export interface GetProposalReturnType {
  logs: ProposalLogs;
  proposal: Proposal;
  // it's optional as there#s a chance the ipfs file is not reachable
  ipfs?: ProposalMetadata;
}

export interface GovernanceCacheAdapter {
  syncPayloadsCache: (args: {chainId: number; payloadsController: Address}) => any;
  syncProposalCache: (args: {chainId: number; governance: Address}) => any;
  getPayload: (args: {
    chainId: number;
    payloadsController: Address;
    payloadId: number;
  }) => GetPayloadReturnType | Promise<GetPayloadReturnType>;
  getProposal: (args: {
    chainId: number;
    governance: Address;
    proposalId: bigint;
  }) => GetProposalReturnType | Promise<GetProposalReturnType>;
}

/**
 * Proposal types
 */
export type ProposalCreatedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, 'ProposalCreated'>
>;
export type ProposalQueuedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, 'ProposalQueued'>
>;
export type ProposalCanceledEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, 'ProposalCanceled'>
>;
export type ProposalExecutedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, 'ProposalExecuted'>
>;
export type ProposalPayloadSentEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, 'PayloadSent'>
>;
export type ProposalVotingActivatedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IGovernanceCore_ABI, 'VotingActivated'>
>;
export type ProposalEvent =
  | ProposalCreatedEvent
  | ProposalQueuedEvent
  | ProposalCanceledEvent
  | ProposalExecutedEvent
  | ProposalPayloadSentEvent
  | ProposalVotingActivatedEvent;

export type Proposal = ContractFunctionReturnType<
  typeof IGovernanceCore_ABI,
  AbiStateMutability,
  'getProposal'
>;

export interface ProposalLogs {
  createdLog: ProposalCreatedEvent;
  queuedLog?: ProposalQueuedEvent;
  executedLog?: ProposalExecutedEvent;
  votingActivatedLog?: ProposalVotingActivatedEvent;
  canceledLog?: ProposalCanceledEvent;
  payloadSentLog: ProposalPayloadSentEvent[];
}

export enum ProposalState {
  Null = 0, // proposal does not exists
  Created = 1, // created, waiting for a cooldown to initiate the balances snapshot
  Active = 2, // balances snapshot set, voting in progress
  Queued = 3, // voting results submitted, but proposal is under grace period when guardian can cancel it
  Executed = 4, // results sent to the execution chain(s)
  Failed = 5, // voting was not successful
  Cancelled = 6, // got cancelled by guardian, or because proposition power of creator dropped below allowed minimum
  Expired = 7,
}

export function isProposalFinal(state: ProposalState) {
  return [
    ProposalState.Executed,
    ProposalState.Failed,
    ProposalState.Cancelled,
    ProposalState.Expired,
  ].includes(state);
}

/**
 * Payload types
 */
export enum PayloadState {
  None = 0,
  Created = 1,
  Queued = 2,
  Executed = 3,
  Cancelled = 4,
  Expired = 5,
}

export type PayloadCreatedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IPayloadsControllerCore_ABI, 'PayloadCreated'>
>;
export type PayloadQueuedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IPayloadsControllerCore_ABI, 'PayloadQueued'>
>;
export type PayloadExecutedEvent = LogWithTimestamp<
  ExtractAbiEvent<typeof IPayloadsControllerCore_ABI, 'PayloadExecuted'>
>;
export type PayloadEvent = PayloadCreatedEvent | PayloadQueuedEvent | PayloadExecutedEvent;

export interface PayloadLogs {
  createdLog: PayloadCreatedEvent;
  queuedLog?: PayloadQueuedEvent;
  executedLog?: PayloadExecutedEvent;
}

export type Payload = ContractFunctionReturnType<
  typeof IPayloadsControllerCore_ABI,
  AbiStateMutability,
  'getPayloadById'
>;

export function isPayloadFinal(state: number) {
  return [
    PayloadState.Cancelled,
    PayloadState.Executed,
    PayloadState.Expired,
    // -1, // error
  ].includes(state);
}
