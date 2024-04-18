import {type Address, type GetLogsReturnType} from 'viem';
import type {AbiEvent} from 'abitype';
import type {Payload, PayloadEvent, PayloadLogs} from './common/payloadsController';
import type {Proposal, ProposalEvent, ProposalLogs} from './common/governance';
import type {ProposalMetadata} from '@bgd-labs/js-utils';

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
    proposalId: number;
  }) => GetProposalReturnType | Promise<GetProposalReturnType>;
}
